import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, expect, it } from 'vitest';

/**
 * I trigger sono codice che gira DENTRO Postgres, invocato dal database stesso
 * a ogni scrittura — anche per le scritture che non passano dall'app. Sono la
 * parte più facile da dare per scontata e la più difficile da correggere dopo,
 * perché quando sbagliano lasciano dati incoerenti in tabella.
 *
 * Richiede `supabase start`.
 */

const URL = process.env.SUPABASE_API_URL ?? 'http://127.0.0.1:54321';
const ANON =
  process.env.SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SERVICE =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

let db: SupabaseClient;
let userId: string;
let spaceId: string;

beforeAll(async () => {
  const email = `trigger-${Date.now()}@test.local`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: 'password123',
    email_confirm: true,
  });
  if (error || !data.user) {
    throw new Error(
      `Stack Supabase locale non raggiungibile su ${URL}. Avvia \`supabase start\`.`,
      {
        cause: error,
      },
    );
  }
  userId = data.user.id;

  db = createClient(URL, ANON, { auth: { persistSession: false } });
  await db.auth.signInWithPassword({ email, password: 'password123' });

  const { data: space } = await db
    .from('spaces')
    .insert({ name: 'Corsi', color: 'purple' })
    .select()
    .single();
  spaceId = space.id;
});

afterAll(async () => {
  if (userId) await admin.auth.admin.deleteUser(userId);
});

/** `path` viene sempre riscritto dal trigger: il valore passato è un segnaposto. */
async function creaCartella(name: string, parentId: string | null = null) {
  const { data, error } = await db
    .from('collections')
    .insert({ space_id: spaceId, parent_id: parentId, name, path: 'segnaposto' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

it('il path si calcola dal nome, in forma di slug', async () => {
  const cartella = await creaCartella('Meta Ads');
  expect(cartella.path).toBe('meta-ads');
});

it('una sottocartella eredita il percorso del genitore', async () => {
  const padre = await creaCartella('Google Ads');
  const figlia = await creaCartella('Lezione 3', padre.id);
  expect(figlia.path).toBe('google-ads/lezione-3');
});

it('rinominare una cartella riscrive il path di tutte le discendenti', async () => {
  // Il bug che questo test blocca: il trigger a cascata era dichiarato
  // `after update OF path`, e `update of` scatta solo se quella colonna
  // compare nella SET. Rinominando si scrive `name`, non `path` — quindi la
  // cascata non partiva e le figlie restavano con il percorso vecchio.
  const padre = await creaCartella('TikTok Ads');
  const figlia = await creaCartella('Modulo 1', padre.id);
  const nipote = await creaCartella('Lezione 2', figlia.id);

  await db.from('collections').update({ name: 'TikTok Advertising' }).eq('id', padre.id);

  const { data } = await db.from('collections').select('id, path').in('id', [figlia.id, nipote.id]);

  const percorsi = Object.fromEntries((data ?? []).map((c) => [c.id, c.path]));
  expect(percorsi[figlia.id]).toBe('tiktok-advertising/modulo-1');
  expect(percorsi[nipote.id]).toBe('tiktok-advertising/modulo-1/lezione-2');
});

it('una cartella non può essere spostata dentro una sua discendente', async () => {
  const padre = await creaCartella('LinkedIn');
  const figlia = await creaCartella('Modulo A', padre.id);

  const { error } = await db
    .from('collections')
    .update({ parent_id: figlia.id })
    .eq('id', padre.id);
  expect(error).not.toBeNull();
});

it('completed_at lo scrive il database, non l’app', async () => {
  const { data: creata } = await db
    .from('tasks')
    .insert({ title: 'Guardare la lezione 4' })
    .select()
    .single();
  expect(creata.completed_at).toBeNull();

  const { data: fatta } = await db
    .from('tasks')
    .update({ status: 'done' })
    .eq('id', creata.id)
    .select()
    .single();
  expect(fatta.completed_at).not.toBeNull();

  const { data: riaperta } = await db
    .from('tasks')
    .update({ status: 'todo' })
    .eq('id', creata.id)
    .select()
    .single();
  expect(riaperta.completed_at).toBeNull();
});

it('la stessa abitudine non si può registrare due volte nello stesso giorno', async () => {
  const { data: habit } = await db
    .from('habits')
    .insert({ title: 'Leggere 20 minuti', rrule: 'FREQ=DAILY' })
    .select()
    .single();

  const giorno = '2026-08-21';
  const primo = await db.from('habit_logs').insert({ habit_id: habit.id, done_on: giorno });
  const secondo = await db.from('habit_logs').insert({ habit_id: habit.id, done_on: giorno });

  expect(primo.error).toBeNull();
  expect(secondo.error).not.toBeNull();
});
