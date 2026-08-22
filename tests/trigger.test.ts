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
  const email = `trigger-${Date.now()}-${crypto.randomUUID().slice(0, 8)}@test.local`;
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

it('spostare una task in una colonna "finale" la marca come fatta', async () => {
  const { data: colonne } = await db.from('task_columns').select('*').order('position');
  const daFare = colonne?.find((c) => !c.is_done);
  const finale = colonne?.find((c) => c.is_done);
  expect(daFare, 'colonne di partenza create dal trigger').toBeDefined();
  expect(finale).toBeDefined();

  const { data: task } = await db
    .from('tasks')
    .insert({ title: 'Da spostare', column_id: daFare?.id })
    .select()
    .single();
  expect(task.status).toBe('todo');

  const { data: spostata } = await db
    .from('tasks')
    .update({ column_id: finale?.id })
    .eq('id', task.id)
    .select()
    .single();

  // Lo `status` NON lo scrive l'app: lo allinea il trigger. È così che Today
  // continua a sapere cosa resta da chiudere anche se la colonna si chiama
  // "Consegnato" invece di "Fatto".
  expect(spostata.status).toBe('done');
  expect(spostata.completed_at).not.toBeNull();

  const { data: riaperta } = await db
    .from('tasks')
    .update({ column_id: daFare?.id })
    .eq('id', task.id)
    .select()
    .single();

  expect(riaperta.status).toBe('todo');
  expect(riaperta.completed_at).toBeNull();
});

it('ogni nuovo utente parte con tre colonne e le impostazioni del pomodoro', async () => {
  const { data: colonne } = await db.from('task_columns').select('name, is_done').order('position');
  expect(colonne?.map((c) => c.name)).toEqual(['Da fare', 'In corso', 'Fatto']);
  expect(colonne?.filter((c) => c.is_done)).toHaveLength(1);

  const { data: pomodoro } = await db.from('pomodoro_settings').select('*').single();
  expect(pomodoro?.work_minutes).toBe(25);
  expect(pomodoro?.cycles_before_long).toBe(4);
});

it('eliminare un progetto non cancella le sue task', async () => {
  const { data: progetto } = await db
    .from('projects')
    .insert({ name: 'Rifare il sito' })
    .select()
    .single();

  const { data: task } = await db
    .from('tasks')
    .insert({ title: 'Comprare il dominio', project_id: progetto.id })
    .select()
    .single();

  await db.from('projects').delete().eq('id', progetto.id);

  const { data: sopravvissuta } = await db
    .from('tasks')
    .select('id, project_id')
    .eq('id', task.id)
    .single();

  expect(sopravvissuta?.id).toBe(task.id);
  expect(sopravvissuta?.project_id).toBeNull();
});

it('una task creata senza colonna finisce nella prima della board', async () => {
  // È il caso della cattura da fuori e di ogni scrittura che non passa
  // dall'interfaccia. Senza questo, la task resterebbe con `column_id` nullo
  // e non comparirebbe in NESSUNA colonna del Kanban: sparirebbe in silenzio.
  const { data: task } = await db
    .from('tasks')
    .insert({ title: 'Nata senza colonna' })
    .select()
    .single();

  expect(task.column_id).not.toBeNull();

  const { data: colonna } = await db
    .from('task_columns')
    .select('position')
    .eq('id', task.column_id)
    .single();

  expect(colonna?.position).toBe(0);
});
