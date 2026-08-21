'use server';

import {
  blocchiSchema,
  buildRrule,
  generaToken,
  impronta,
  indizio,
  SPACE_COLORS,
  toDateKey,
  WEEKDAYS,
  type Weekday,
} from '@noteaker/core';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { STATI_TASK } from '@/lib/types';

/**
 * TUTTE le scritture passano da qui.
 *
 * Ogni funzione è una SERVER ACTION: il browser la chiama come se fosse una
 * funzione locale, ma esegue sul server. Due conseguenze da tenere a mente:
 *  1. è una porta HTTP a tutti gli effetti, quindi ogni input viene validato
 *     con Zod prima di toccare il database (docs/06-sicurezza.md §3.3);
 *  2. `user_id` non lo passiamo MAI dal client: lo mette il default
 *     `auth.uid()` della colonna, e RLS rifiuterebbe comunque una riga
 *     intestata a un altro.
 *
 * `revalidatePath` dice a Next: "i dati di questa pagina sono cambiati,
 * rigenerala". Senza, la schermata resterebbe ferma sui dati vecchi.
 */

const colore = z.enum(SPACE_COLORS);
const uuid = z.uuid();
const testoBreve = z.string().trim().min(1, 'Serve un titolo.').max(200);

function leggi(formData: FormData, chiave: string): string | undefined {
  const valore = formData.get(chiave);
  if (typeof valore !== 'string') return undefined;
  const pulito = valore.trim();
  return pulito === '' ? undefined : pulito;
}

// =====================================================================
// SPACES — le macro-aree
// =====================================================================

export async function creaSpace(formData: FormData) {
  const { supabase } = await requireUser();

  const dati = z
    .object({ name: testoBreve, color: colore })
    .parse({ name: leggi(formData, 'name'), color: leggi(formData, 'color') ?? 'yellow' });

  const { count } = await supabase.from('spaces').select('id', { count: 'exact', head: true });
  await supabase.from('spaces').insert({ ...dati, position: count ?? 0 });

  revalidatePath('/', 'layout');
}

export async function rinominaSpace(id: string, nome: string, nuovoColore?: string) {
  const { supabase } = await requireUser();

  const dati = z
    .object({ id: uuid, name: testoBreve, color: colore.optional() })
    .parse({ id, name: nome, color: nuovoColore });

  await supabase
    .from('spaces')
    .update({ name: dati.name, ...(dati.color ? { color: dati.color } : {}) })
    .eq('id', dati.id);

  revalidatePath('/', 'layout');
}

/**
 * Eliminare uno space è distruttivo e va capito prima di farlo:
 * le sue cartelle spariscono a cascata (`on delete cascade`), mentre gli item
 * che c'erano dentro NON vengono cancellati — la loro `collection_id` diventa
 * nulla (`on delete set null`) e tornano in Inbox. Nessuna nota va persa.
 * L'interfaccia lo dice esplicitamente prima di chiedere conferma.
 */
export async function eliminaSpace(id: string) {
  const { supabase } = await requireUser();
  const idValido = uuid.parse(id);

  // Gli item delle cartelle di questo space tornano in inbox invece di
  // restare invisibili con una collection_id azzerata.
  const { data: cartelle } = await supabase
    .from('collections')
    .select('id')
    .eq('space_id', idValido);

  if (cartelle && cartelle.length > 0) {
    await supabase
      .from('items')
      .update({ status: 'inbox' })
      .in(
        'collection_id',
        cartelle.map((c) => c.id),
      );
  }

  await supabase.from('spaces').delete().eq('id', idValido);
  revalidatePath('/', 'layout');
}

// =====================================================================
// COLLECTIONS — le cartelle annidabili dentro uno space
// `path` non lo scriviamo noi: lo calcola il trigger nel database.
// =====================================================================

export async function creaCollection(formData: FormData) {
  const { supabase } = await requireUser();

  const dati = z.object({ space_id: uuid, parent_id: uuid.nullable(), name: testoBreve }).parse({
    space_id: leggi(formData, 'space_id'),
    parent_id: leggi(formData, 'parent_id') ?? null,
    name: leggi(formData, 'name'),
  });

  // `path` è obbligatoria in tabella ma la sovrascrive il trigger:
  // qui basta un segnaposto.
  await supabase.from('collections').insert({ ...dati, path: 'tmp' });
  revalidatePath('/spaces', 'layout');
}

export async function rinominaCollection(id: string, nome: string) {
  const { supabase } = await requireUser();
  await supabase
    .from('collections')
    .update({ name: testoBreve.parse(nome) })
    .eq('id', uuid.parse(id));
  revalidatePath('/spaces', 'layout');
}

export async function eliminaCollection(id: string) {
  const { supabase } = await requireUser();
  await supabase.from('collections').delete().eq('id', uuid.parse(id));
  revalidatePath('/spaces', 'layout');
}

// =====================================================================
// NOTE (items di kind 'note')
// =====================================================================

export async function creaNota(formData: FormData) {
  const { supabase } = await requireUser();

  const dati = z.object({ title: testoBreve, collection_id: uuid.nullable() }).parse({
    title: leggi(formData, 'title'),
    collection_id: leggi(formData, 'collection_id') ?? null,
  });

  const { data } = await supabase
    .from('items')
    .insert({
      title: dati.title,
      collection_id: dati.collection_id,
      kind: 'note',
      // una nota scritta a mano non passa dall'inbox: l'hai già smistata
      // nel momento in cui hai scelto dove crearla
      status: dati.collection_id ? 'active' : 'inbox',
      captured_via: 'app',
    })
    .select('id')
    .single();

  revalidatePath('/spaces', 'layout');
  revalidatePath('/inbox');
  return data?.id ?? null;
}

/**
 * Salva la nota. DUE colonne, e la ragione conta (docs/01-architettura.md §4):
 *  - `body`      jsonb — la struttura dei blocchi, verità per l'editor;
 *  - `body_text` testo — lo stesso contenuto appiattito in markdown, che è ciò
 *                su cui lavorano la ricerca full-text di Postgres e, dalla
 *                fase 3, gli embedding. Rigenerarlo a ogni ricerca sarebbe
 *                lento: lo scriviamo insieme al JSON.
 */
export async function salvaNota(id: string, titolo: string, testo: string, blocchi?: unknown) {
  const { supabase } = await requireUser();

  const dati = z
    .object({
      id: uuid,
      title: z.string().trim().max(200),
      body_text: z.string().max(500_000),
      body: blocchiSchema.nullable(),
    })
    .parse({
      id,
      title: titolo,
      body_text: testo,
      body: Array.isArray(blocchi) ? blocchi : null,
    });

  await supabase
    .from('items')
    .update({
      title: dati.title || 'Senza titolo',
      body_text: dati.body_text,
      ...(dati.body ? { body: dati.body } : {}),
    })
    .eq('id', dati.id);

  revalidatePath(`/note/${dati.id}`);
}

export async function spostaItem(itemId: string, collectionId: string | null) {
  const { supabase } = await requireUser();
  await supabase
    .from('items')
    .update({
      collection_id: collectionId ? uuid.parse(collectionId) : null,
      status: collectionId ? 'active' : 'inbox',
    })
    .eq('id', uuid.parse(itemId));

  revalidatePath('/inbox');
  revalidatePath('/spaces', 'layout');
}

export async function eliminaItem(id: string) {
  const { supabase } = await requireUser();
  await supabase.from('items').delete().eq('id', uuid.parse(id));
  revalidatePath('/inbox');
  revalidatePath('/spaces', 'layout');
}

// =====================================================================
// GOALS e KEY RESULT
// =====================================================================

export async function creaGoal(formData: FormData) {
  const { supabase } = await requireUser();

  const dati = z
    .object({
      title: testoBreve,
      why: z.string().trim().max(1000).nullable(),
      horizon: z.enum(['quarter', 'year', 'life']),
      color: colore,
      space_id: uuid.nullable(),
    })
    .parse({
      title: leggi(formData, 'title'),
      why: leggi(formData, 'why') ?? null,
      horizon: leggi(formData, 'horizon') ?? 'quarter',
      color: leggi(formData, 'color') ?? 'purple',
      space_id: leggi(formData, 'space_id') ?? null,
    });

  const { count } = await supabase.from('goals').select('id', { count: 'exact', head: true });
  await supabase.from('goals').insert({ ...dati, position: count ?? 0 });
  revalidatePath('/obiettivi');
}

export async function creaKeyResult(formData: FormData) {
  const { supabase } = await requireUser();

  const dati = z
    .object({
      goal_id: uuid,
      title: testoBreve,
      unit: z.string().trim().max(20).nullable(),
      target: z.coerce.number().nullable(),
    })
    .parse({
      goal_id: leggi(formData, 'goal_id'),
      title: leggi(formData, 'title'),
      unit: leggi(formData, 'unit') ?? null,
      target: leggi(formData, 'target') ?? null,
    });

  await supabase.from('key_results').insert(dati);
  revalidatePath('/obiettivi');
}

export async function aggiornaKeyResult(id: string, valore: number) {
  const { supabase } = await requireUser();
  await supabase
    .from('key_results')
    .update({ current: z.number().parse(valore) })
    .eq('id', uuid.parse(id));
  revalidatePath('/obiettivi');
}

export async function cambiaStatoGoal(id: string, stato: 'active' | 'done' | 'dropped') {
  const { supabase } = await requireUser();
  await supabase
    .from('goals')
    .update({ status: z.enum(['active', 'done', 'dropped']).parse(stato) })
    .eq('id', uuid.parse(id));
  revalidatePath('/obiettivi');
}

// =====================================================================
// HABITS
// =====================================================================

export async function creaHabit(formData: FormData) {
  const { supabase } = await requireUser();

  // I giorni arrivano come checkbox multiple con lo stesso `name`.
  const giorni = formData
    .getAll('byday')
    .filter(
      (g): g is Weekday => typeof g === 'string' && (WEEKDAYS as readonly string[]).includes(g),
    );

  const dati = z
    .object({
      title: testoBreve,
      color: colore,
      goal_id: uuid.nullable(),
      rrule: z.string().max(200),
    })
    .parse({
      title: leggi(formData, 'title'),
      color: leggi(formData, 'color') ?? 'green',
      goal_id: leggi(formData, 'goal_id') ?? null,
      rrule: giorni.length > 0 ? buildRrule({ freq: 'WEEKLY', byday: giorni }) : 'FREQ=DAILY',
    });

  const { count } = await supabase.from('habits').select('id', { count: 'exact', head: true });
  await supabase.from('habits').insert({ ...dati, position: count ?? 0 });
  revalidatePath('/abitudini');
  revalidatePath('/');
}

/**
 * Un tocco per segnare l'abitudine fatta, un altro per annullare.
 * Il vincolo `unique (habit_id, done_on)` in tabella rende impossibile
 * registrare due volte lo stesso giorno anche se l'utente fa doppio clic.
 */
export async function toggleHabitLog(habitId: string, giorno?: string) {
  const { supabase } = await requireUser();

  const dati = z
    .object({ habit_id: uuid, done_on: z.iso.date() })
    .parse({ habit_id: habitId, done_on: giorno ?? toDateKey(new Date()) });

  const { data: esistente } = await supabase
    .from('habit_logs')
    .select('id')
    .eq('habit_id', dati.habit_id)
    .eq('done_on', dati.done_on)
    .maybeSingle();

  if (esistente) {
    await supabase.from('habit_logs').delete().eq('id', esistente.id);
  } else {
    await supabase.from('habit_logs').insert(dati);
  }

  revalidatePath('/abitudini');
  revalidatePath('/');
}

export async function archiviaHabit(id: string) {
  const { supabase } = await requireUser();
  await supabase.from('habits').update({ active: false }).eq('id', uuid.parse(id));
  revalidatePath('/abitudini');
  revalidatePath('/');
}

// =====================================================================
// TASKS
// =====================================================================

export async function creaTask(formData: FormData) {
  const { supabase } = await requireUser();

  const dati = z
    .object({
      title: testoBreve,
      goal_id: uuid.nullable(),
      priority: z.coerce.number().int().min(1).max(3),
      scheduled_for: z.iso.date().nullable(),
      status: z.enum(STATI_TASK),
    })
    .parse({
      title: leggi(formData, 'title'),
      goal_id: leggi(formData, 'goal_id') ?? null,
      priority: leggi(formData, 'priority') ?? 2,
      scheduled_for: leggi(formData, 'scheduled_for') ?? null,
      status: leggi(formData, 'status') ?? 'todo',
    });

  const { count } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('status', dati.status);

  await supabase.from('tasks').insert({ ...dati, position: count ?? 0 });

  revalidatePath('/task');
  revalidatePath('/');
}

/** Spostamento fra colonne del Kanban. `completed_at` lo scrive un trigger. */
export async function spostaTask(id: string, stato: string, posizione = 0) {
  const { supabase } = await requireUser();

  const dati = z
    .object({ id: uuid, status: z.enum(STATI_TASK), position: z.number().int().min(0) })
    .parse({ id, status: stato, position: posizione });

  await supabase
    .from('tasks')
    .update({ status: dati.status, position: dati.position })
    .eq('id', dati.id);

  revalidatePath('/task');
  revalidatePath('/');
}

export async function toggleTask(id: string, fatto: boolean) {
  const { supabase } = await requireUser();
  await supabase
    .from('tasks')
    .update({ status: fatto ? 'done' : 'todo' })
    .eq('id', uuid.parse(id));

  revalidatePath('/task');
  revalidatePath('/');
}

export async function programmaTaskOggi(id: string) {
  const { supabase } = await requireUser();
  await supabase
    .from('tasks')
    .update({ scheduled_for: toDateKey(new Date()) })
    .eq('id', uuid.parse(id));

  revalidatePath('/task');
  revalidatePath('/');
}

export async function eliminaTask(id: string) {
  const { supabase } = await requireUser();
  await supabase.from('tasks').delete().eq('id', uuid.parse(id));
  revalidatePath('/task');
  revalidatePath('/');
}

// =====================================================================
// TOKEN DI CATTURA
// =====================================================================

/**
 * Crea un token e lo restituisce **in chiaro una sola volta**.
 *
 * In database finisce solo l'impronta SHA-256. Non esiste un modo di
 * rileggerlo dopo: se lo perdi, se ne crea un altro e si revoca il vecchio.
 * È scomodo di proposito — è ciò che rende il furto del database inutile
 * (docs/06-sicurezza.md §3.4).
 *
 * Uno per fonte (Chrome, iPhone, Telegram) così se ne può revocare uno senza
 * rompere gli altri.
 */
export async function creaCaptureToken(formData: FormData): Promise<string> {
  const { supabase } = await requireUser();

  const nome = testoBreve.parse(leggi(formData, 'name'));
  const token = generaToken();

  const { error } = await supabase.from('capture_tokens').insert({
    name: nome,
    token_hash: await impronta(token),
    token_hint: indizio(token),
  });
  if (error) throw new Error(`Creazione del token fallita: ${error.message}`);

  revalidatePath('/impostazioni');
  return token;
}

/**
 * Revoca, non cancella: la riga resta, con la data. Così il registro delle
 * chiamate continua ad avere un token a cui riferirsi e si può capire cosa è
 * successo prima della revoca.
 */
export async function revocaCaptureToken(id: string) {
  const { supabase } = await requireUser();
  await supabase
    .from('capture_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', uuid.parse(id));

  revalidatePath('/impostazioni');
}
