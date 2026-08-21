import { generaToken, impronta, indizio } from '@noteaker/core';
import { createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, expect, it } from 'vitest';

/**
 * `POST /api/capture` è l'unica porta aperta su internet senza login, e l'unico
 * punto dell'app che gira con la chiave `service_role`, che salta RLS. Qui la
 * sicurezza non la garantisce il database: la garantisce il codice. Quindi si
 * prova a forzarla davvero.
 *
 * Richiede `supabase start` E `pnpm dev` (l'endpoint gira dentro Next).
 */

const APP = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const ENDPOINT = `${APP}/api/capture`;
const URL_API = process.env.SUPABASE_API_URL ?? 'http://127.0.0.1:54321';
const SERVICE =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const admin = createClient(URL_API, SERVICE, { auth: { persistSession: false } });

let userA = '';
let userB = '';
let tokenA = '';
let tokenB = '';
let tokenRevocato = '';

async function creaUtenteConToken(prefisso: string) {
  const email = `${prefisso}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}@test.local`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: 'password123',
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error('utente non creato');

  const token = generaToken();
  await admin.from('capture_tokens').insert({
    user_id: data.user.id,
    name: prefisso,
    token_hash: await impronta(token),
    token_hint: indizio(token),
  });

  return { userId: data.user.id, token };
}

async function cattura(token: string | null, corpo: unknown, intestazioni: HeadersInit = {}) {
  return fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...intestazioni,
    },
    body: typeof corpo === 'string' ? corpo : JSON.stringify(corpo),
  });
}

beforeAll(async () => {
  const risposta = await fetch(APP, { redirect: 'manual' }).catch(() => null);
  if (!risposta) {
    throw new Error(`L'app non risponde su ${APP}. Avvia \`pnpm dev\`.`);
  }

  const a = await creaUtenteConToken('capture-a');
  const b = await creaUtenteConToken('capture-b');
  userA = a.userId;
  tokenA = a.token;
  userB = b.userId;
  tokenB = b.token;

  const revocato = await creaUtenteConToken('capture-revocato');
  tokenRevocato = revocato.token;
  await admin
    .from('capture_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('token_hash', await impronta(tokenRevocato));
});

afterAll(async () => {
  for (const id of [userA, userB]) if (id) await admin.auth.admin.deleteUser(id);
});

it('con un token valido salva in inbox e risponde 202', async () => {
  const risposta = await cattura(tokenA, {
    url: 'https://www.example.com/articolo',
    title: 'Un articolo',
    source: 'extension',
  });

  // 202 e non 201: la riga esiste, ma l'elaborazione deve ancora cominciare
  expect(risposta.status).toBe(202);
  const corpo = await risposta.json();
  expect(corpo.stato).toBe('inbox');

  const { data } = await admin.from('items').select('*').eq('id', corpo.id).single();
  expect(data?.user_id).toBe(userA);
  expect(data?.status).toBe('inbox');
  expect(data?.captured_via).toBe('extension');
  expect(data?.source_domain).toBe('example.com');
});

it('indovina il tipo di contenuto dall’indirizzo', async () => {
  const casi: [string, string][] = [
    ['https://www.youtube.com/watch?v=abc', 'video'],
    ['https://www.instagram.com/reel/xyz', 'reel'],
    ['https://www.tiktok.com/@tale/video/1', 'reel'],
    ['https://qualsiasi.it/post', 'article'],
  ];

  for (const [url, atteso] of casi) {
    const risposta = await cattura(tokenA, { url, source: 'ios_shortcut' });
    const { id } = await risposta.json();
    const { data } = await admin.from('items').select('kind').eq('id', id).single();
    expect(data?.kind, url).toBe(atteso);
  }
});

it('senza token risponde 401', async () => {
  const risposta = await cattura(null, { url: 'https://example.com' });
  expect(risposta.status).toBe(401);
});

it('con un token inventato risponde 401', async () => {
  const risposta = await cattura(generaToken(), { url: 'https://example.com' });
  expect(risposta.status).toBe(401);
});

it('con un token revocato risponde 401, e con lo stesso messaggio', async () => {
  const inventato = await cattura(generaToken(), { url: 'https://example.com' });
  const revocato = await cattura(tokenRevocato, { url: 'https://example.com' });

  expect(revocato.status).toBe(401);
  // Stesso messaggio: a chi bussa non si dice se ha indovinato metà serratura
  expect(await revocato.json()).toEqual(await inventato.json());
});

it('un token non permette di scrivere nelle note di un altro utente', async () => {
  // Il tentativo: passare user_id nel corpo sperando che venga usato.
  const risposta = await cattura(tokenB, {
    url: 'https://example.com/furto',
    source: 'app',
    user_id: userA,
  });

  expect(risposta.status).toBe(202);
  const { id } = await risposta.json();

  const { data } = await admin.from('items').select('user_id').eq('id', id).single();
  expect(data?.user_id).toBe(userB); // il proprietario del token, non quello nel corpo
});

it('rifiuta i dati che non rispettano lo schema', async () => {
  expect((await cattura(tokenA, { source: 'app' })).status).toBe(400); // né url né testo
  expect((await cattura(tokenA, { url: 'non-un-indirizzo' })).status).toBe(400);
  expect((await cattura(tokenA, { url: 'https://x.it', source: 'inventata' })).status).toBe(400);
  expect((await cattura(tokenA, '{ rotto')).status).toBe(400);
});

it('rifiuta un corpo enorme prima di guardarci dentro', async () => {
  const risposta = await cattura(tokenA, { url: 'https://x.it', text: 'a'.repeat(150_000) });
  expect(risposta.status).toBe(413);
});

it('una GET risponde 405', async () => {
  expect((await fetch(ENDPOINT)).status).toBe(405);
});

it('legge anche l’intestazione dedicata, per lo Shortcut di iOS', async () => {
  const risposta = await cattura(
    null,
    { url: 'https://example.com/shortcut' },
    {
      'x-noteaker-token': tokenA,
    },
  );
  expect(risposta.status).toBe(202);
});

it('oltre 60 richieste al minuto risponde 429', async () => {
  const suo = await creaUtenteConToken('capture-limite');

  // 60 in parallelo passano, la 61esima no
  const prime = await Promise.all(
    Array.from({ length: 60 }, () => cattura(suo.token, { text: 'ping', source: 'app' })),
  );
  expect(prime.every((r) => r.status === 202)).toBe(true);

  const oltre = await cattura(suo.token, { text: 'ping', source: 'app' });
  expect(oltre.status).toBe(429);
  expect(oltre.headers.get('retry-after')).toBe('60');

  await admin.auth.admin.deleteUser(suo.userId);
}, 60_000);
