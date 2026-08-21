import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, expect, it } from 'vitest';

/**
 * Le immagini dentro le note sono dati personali quanto il testo.
 * Supabase Storage tiene i metadati dei file in `storage.objects`, una normale
 * tabella Postgres: quindi la protezione è di nuovo RLS, e va verificata come
 * si verifica RLS — provando davvero a rubare il file di un altro.
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

const BUCKET = 'note-media';
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

// 1×1 px PNG trasparente, il file valido più piccolo possibile
const PNG = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  ),
  (c) => c.charCodeAt(0),
);

type Utente = { id: string; client: SupabaseClient };

let a: Utente;
let b: Utente;
let percorsoDiA: string;

async function creaUtente(prefisso: string): Promise<Utente> {
  const email = `${prefisso}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}@test.local`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: 'password123',
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error('utente non creato');

  const client = createClient(URL, ANON, { auth: { persistSession: false } });
  await client.auth.signInWithPassword({ email, password: 'password123' });
  return { id: data.user.id, client };
}

beforeAll(async () => {
  try {
    a = await creaUtente('storage-a');
    b = await creaUtente('storage-b');
  } catch (cause) {
    throw new Error(
      `Stack Supabase locale non raggiungibile su ${URL}. Avvia \`supabase start\`.`,
      {
        cause,
      },
    );
  }

  percorsoDiA = `${a.id}/nota-finta/immagine.png`;
  const { error } = await a.client.storage
    .from(BUCKET)
    .upload(percorsoDiA, PNG, { contentType: 'image/png' });
  if (error) throw error;
});

afterAll(async () => {
  if (a) await admin.auth.admin.deleteUser(a.id);
  if (b) await admin.auth.admin.deleteUser(b.id);
});

it('il bucket è privato', async () => {
  const { data } = await admin.storage.getBucket(BUCKET);
  expect(data?.public).toBe(false);
});

it('A può rileggere il proprio file con un URL firmato', async () => {
  const { data, error } = await a.client.storage.from(BUCKET).createSignedUrl(percorsoDiA, 60);
  expect(error).toBeNull();

  const risposta = await fetch(data?.signedUrl ?? '');
  expect(risposta.status).toBe(200);
  expect(risposta.headers.get('content-type')).toContain('image/png');
});

it('B non può firmare un URL per il file di A', async () => {
  const { data, error } = await b.client.storage.from(BUCKET).createSignedUrl(percorsoDiA, 60);
  expect(error).not.toBeNull();
  expect(data).toBeNull();
});

it('B non vede il file di A elencando il bucket', async () => {
  const { data } = await b.client.storage.from(BUCKET).list(`${a.id}/nota-finta`);
  expect(data).toEqual([]);
});

it('B non può caricare dentro la cartella di A', async () => {
  const { error } = await b.client.storage
    .from(BUCKET)
    .upload(`${a.id}/nota-finta/intruso.png`, PNG, { contentType: 'image/png' });
  expect(error).not.toBeNull();
});

it('B non può cancellare il file di A', async () => {
  await b.client.storage.from(BUCKET).remove([percorsoDiA]);

  // La `remove` di Supabase non segnala errore se la policy nasconde la riga:
  // semplicemente non cancella niente. Quindi si verifica il fatto, non l'esito.
  const { data } = await a.client.storage.from(BUCKET).list(`${a.id}/nota-finta`);
  expect(data?.map((f) => f.name)).toContain('immagine.png');
});

it('un anonimo senza sessione non arriva al file', async () => {
  const anonimo = createClient(URL, ANON, { auth: { persistSession: false } });
  const { error } = await anonimo.storage.from(BUCKET).createSignedUrl(percorsoDiA, 60);
  expect(error).not.toBeNull();
});

it('i tipi di file pericolosi sono rifiutati dal bucket', async () => {
  // Un SVG è XML e può contenere <script>: servito dal nostro dominio sarebbe
  // XSS. Il bucket ha una allow-list di MIME type che non lo include.
  const { error } = await a.client.storage
    .from(BUCKET)
    .upload(`${a.id}/nota-finta/cattivo.svg`, new Blob(['<svg/>']), {
      contentType: 'image/svg+xml',
    });
  expect(error).not.toBeNull();
});
