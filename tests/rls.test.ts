import { Client } from 'pg';
import { afterAll, beforeAll, expect, it } from 'vitest';

/**
 * IL TEST CHE DEVE ESISTERE DALLA FASE 0 (docs/06-sicurezza.md §3.2).
 *
 * Una tabella dimenticata senza RLS in Supabase è leggibile da chiunque abbia
 * la chiave anon — che è pubblica e sta dentro il JavaScript del browser.
 * È l'errore più facile da commettere e il più costoso: quindi non ci si
 * affida alla memoria, lo si trasforma in un test che diventa rosso.
 *
 * Richiede il Postgres locale acceso:
 *     supabase start
 *     pnpm test
 *
 * Se il database non risponde il test FALLISCE, non viene saltato: un test di
 * sicurezza che passa in silenzio quando non ha controllato niente è peggio
 * che non averlo.
 */

const CONNECTION_STRING =
  process.env.SUPABASE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

let db: Client;

beforeAll(async () => {
  db = new Client({ connectionString: CONNECTION_STRING });
  try {
    await db.connect();
  } catch (cause) {
    throw new Error(
      `Postgres locale non raggiungibile su ${CONNECTION_STRING}. Avvia lo stack con \`supabase start\` (serve Docker acceso).`,
      { cause },
    );
  }
});

afterAll(async () => {
  await db?.end();
});

it('ogni tabella dello schema public ha RLS attiva', async () => {
  const { rows } = await db.query<{ tablename: string }>(`
    select tablename
    from pg_tables
    where schemaname = 'public'
      and rowsecurity = false
    order by tablename
  `);

  expect(rows.map((r) => r.tablename)).toEqual([]);
});

it('ogni tabella con RLS ha almeno una policy', async () => {
  // RLS attiva ma senza policy = tabella murata: nessuno legge niente.
  // È un bug silenzioso, si manifesta come "liste sempre vuote".
  const { rows } = await db.query<{ tablename: string }>(`
    select t.tablename
    from pg_tables t
    left join pg_policies p
      on p.schemaname = t.schemaname and p.tablename = t.tablename
    where t.schemaname = 'public'
      and t.rowsecurity = true
      and p.policyname is null
    order by t.tablename
  `);

  expect(rows.map((r) => r.tablename)).toEqual([]);
});

it('ogni policy valida anche le scritture (with check), non solo le letture', async () => {
  // `using` senza `with check` su una policy FOR ALL permette di inserire
  // righe intestate a un altro utente (docs/02-modello-dati.md §9).
  const { rows } = await db.query<{ tablename: string; policyname: string }>(`
    select tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and cmd = 'ALL'
      and with_check is null
    order by tablename
  `);

  expect(rows).toEqual([]);
});
