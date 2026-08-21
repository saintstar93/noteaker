import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, expect, it } from 'vitest';

/**
 * RLS non basta che sia "attiva": deve isolare davvero.
 * Qui si creano DUE utenti veri sullo stack locale e si verifica che l'uno non
 * possa leggere, scrivere o cancellare le righe dell'altro. È il test che
 * traduce in fatti le policy della migrazione 001.
 *
 * Richiede `supabase start`. Le chiavi qui sotto sono quelle DIMOSTRATIVE dello
 * stack locale: identiche per tutti, pubbliche, inutili fuori da localhost.
 */

const URL = process.env.SUPABASE_API_URL ?? 'http://127.0.0.1:54321';
const ANON =
  process.env.SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SERVICE =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

type Utente = { id: string; client: SupabaseClient };

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

let a: Utente;
let b: Utente;
let itemDiA: { id: string; source_domain: string | null; status: string };

async function creaUtente(prefisso: string): Promise<Utente> {
  const email = `${prefisso}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}@test.local`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: 'password123',
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error('utente non creato');

  const client = createClient(URL, ANON, { auth: { persistSession: false } });
  const { error: erroreLogin } = await client.auth.signInWithPassword({
    email,
    password: 'password123',
  });
  if (erroreLogin) throw erroreLogin;

  return { id: data.user.id, client };
}

beforeAll(async () => {
  try {
    a = await creaUtente('utente-a');
    b = await creaUtente('utente-b');
  } catch (cause) {
    throw new Error(
      `Stack Supabase locale non raggiungibile su ${URL}. Avvialo con \`supabase start\`.`,
      { cause },
    );
  }

  const { data, error } = await a.client
    .from('items')
    .insert({ title: 'Nota di A', kind: 'note', source_url: 'https://www.example.com/x/y' })
    .select()
    .single();
  if (error) throw error;
  itemDiA = data;
});

afterAll(async () => {
  if (a) await admin.auth.admin.deleteUser(a.id);
  if (b) await admin.auth.admin.deleteUser(b.id);
});

it('il trigger su auth.users crea il profilo da solo', async () => {
  const { data } = await admin.from('profiles').select('id').eq('id', a.id);
  expect(data).toHaveLength(1);
});

it('user_id si valorizza da solo con auth.uid()', async () => {
  const { data, error } = await a.client
    .from('spaces')
    .insert({ name: 'Business', color: 'yellow' })
    .select()
    .single();

  expect(error).toBeNull();
  expect(data?.user_id).toBe(a.id);
});

it('le colonne generate si calcolano da sole', () => {
  expect(itemDiA.source_domain).toBe('example.com');
  expect(itemDiA.status).toBe('inbox');
});

it('A vede i propri item', async () => {
  const { data } = await a.client.from('items').select('id');
  expect(data).toHaveLength(1);
});

it('B non vede gli item di A', async () => {
  const { data } = await b.client.from('items').select('id');
  expect(data).toEqual([]);
});

it('B non può inserire righe intestate ad A (è il `with check`)', async () => {
  const { error } = await b.client.from('items').insert({ title: 'furto', user_id: a.id });
  expect(error).not.toBeNull();
});

it('B non può cancellare gli item di A', async () => {
  const { data } = await b.client.from('items').delete().eq('id', itemDiA.id).select();
  expect(data).toEqual([]);
});

it('un anonimo senza sessione non vede nulla', async () => {
  const anonimo = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data, error } = await anonimo.from('items').select('id');

  // Il ruolo `anon` non ha nemmeno il GRANT sulla tabella: Postgres si ferma
  // prima delle policy e risponde "permission denied". Va benissimo così —
  // è il livello di rifiuto più esterno possibile.
  expect(error?.code).toBe('42501');
  expect(data).toBeNull();
});

it("eliminare l'utente cancella i suoi dati (on delete cascade)", async () => {
  const usaEGetta = await creaUtente('utente-c');
  await usaEGetta.client.from('items').insert({ title: 'effimera' });
  await admin.auth.admin.deleteUser(usaEGetta.id);

  const { data } = await admin.from('items').select('id').eq('user_id', usaEGetta.id);
  expect(data).toEqual([]);
});
