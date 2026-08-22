/**
 * SMOKE TEST DELLE PAGINE — si lancia a mano, non è in CI.
 *
 *   supabase start && pnpm dev      (in un altro terminale)
 *   node scripts/smoke-pagine.mjs
 *
 * Crea un utente vero, gli mette dentro il caso d'uso "Corsi → Meta Ads →
 * Lezione 3 → una nota", poi chiede ogni pagina dell'app con la sua sessione e
 * controlla che risponda 200 E che nell'HTML compaiano davvero i suoi dati.
 * Serve a intercettare le pagine che compilano ma non renderizzano: la build
 * verde non dice niente su cosa si vede a schermo.
 *
 * Le verifiche sui trigger del database stanno invece in `tests/trigger.test.ts`,
 * che gira con `pnpm test` e non ha bisogno del dev server.
 *
 * Le chiavi qui sotto sono quelle dimostrative dello stack locale: pubbliche,
 * identiche per tutti, inutili fuori da localhost.
 */
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const URL = 'http://127.0.0.1:54321';
const ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SERVICE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const APP = 'http://localhost:3100';

const esiti = [];
const ok = (nome, cond, extra = '') => esiti.push([Boolean(cond), nome, extra]);

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const email = `verifica-${Date.now()}@test.local`;
const { data: creato, error: errCreate } = await admin.auth.admin.createUser({
  email,
  password: 'password123',
  email_confirm: true,
});
if (errCreate) throw errCreate;

// Sessione con cookie, come li scriverebbe Next
const jar = new Map();
const supabase = createServerClient(URL, ANON, {
  cookies: {
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    setAll: (elenco) => {
      for (const { name, value } of elenco) jar.set(name, value);
    },
  },
});
const { error: errLogin } = await supabase.auth.signInWithPassword({
  email,
  password: 'password123',
});
if (errLogin) throw errLogin;
const cookie = [...jar].map(([n, v]) => `${n}=${encodeURIComponent(v)}`).join('; ');

// ---------- DATI: il caso d'uso di Daniele ----------
const { data: space } = await supabase
  .from('spaces')
  .insert({ name: 'Corsi', color: 'purple' })
  .select()
  .single();
ok('creato lo space "Corsi"', space?.name === 'Corsi');

const { data: corso } = await supabase
  .from('collections')
  .insert({ space_id: space.id, name: 'Meta Ads', path: 'tmp' })
  .select()
  .single();
ok('il trigger calcola il path della cartella', corso?.path === 'meta-ads', corso?.path);

const { data: lezione } = await supabase
  .from('collections')
  .insert({ space_id: space.id, parent_id: corso.id, name: 'Lezione 3', path: 'tmp' })
  .select()
  .single();
ok(
  'sottocartella annidata col path completo',
  lezione?.path === 'meta-ads/lezione-3',
  lezione?.path,
);

const { data: nota } = await supabase
  .from('items')
  .insert({
    title: 'Appunti lezione 3',
    kind: 'note',
    status: 'active',
    collection_id: lezione.id,
    body_text: 'Il CPM sale il venerdì.',
  })
  .select()
  .single();
ok('nota dentro la sottocartella', nota?.collection_id === lezione.id);

// rinomina il padre: le discendenti devono seguirlo
await supabase.from('collections').update({ name: 'Meta Advertising' }).eq('id', corso.id);
const { data: dopoRinomina } = await supabase
  .from('collections')
  .select('path')
  .eq('id', lezione.id)
  .single();
ok(
  'rinominare il padre riscrive il path dei figli',
  dopoRinomina?.path === 'meta-advertising/lezione-3',
  dopoRinomina?.path,
);

// ciclo: una cartella dentro sé stessa
const { error: errCiclo } = await supabase
  .from('collections')
  .update({ parent_id: lezione.id })
  .eq('id', corso.id);
ok(
  'una cartella non può finire dentro una sua discendente',
  Boolean(errCiclo),
  errCiclo ? '' : 'NESSUN ERRORE',
);

// goal + key result
const { data: goal } = await supabase
  .from('goals')
  .insert({
    title: 'Padroneggiare Meta Ads',
    horizon: 'quarter',
    color: 'purple',
    space_id: space.id,
  })
  .select()
  .single();
await supabase
  .from('key_results')
  .insert({ goal_id: goal.id, title: 'Lezioni completate', unit: 'n.', target: 20, current: 3 });
ok('obiettivo con key result', Boolean(goal?.id));

// habit
const { data: habit } = await supabase
  .from('habits')
  .insert({
    title: 'Una lezione al giorno',
    rrule: 'FREQ=DAILY',
    color: 'green',
    goal_id: goal.id,
  })
  .select()
  .single();
await supabase
  .from('habit_logs')
  .insert({ habit_id: habit.id, done_on: new Date().toISOString().slice(0, 10) });
ok('abitudine e log di oggi', Boolean(habit?.id));

// progetto — la catena è Obiettivo → Progetto → Task
const { data: progetto } = await supabase
  .from('projects')
  .insert({ name: 'Corso Meta Ads', color: 'teal', goal_id: goal.id })
  .select()
  .single();
ok('progetto collegato a un obiettivo', progetto?.goal_id === goal.id);

// task + trigger completed_at
const { data: task } = await supabase
  .from('tasks')
  .insert({
    title: 'Guardare lezione 4',
    goal_id: goal.id,
    project_id: progetto.id,
    priority: 1,
    scheduled_for: new Date().toISOString().slice(0, 10),
  })
  .select()
  .single();
ok('task creata senza completed_at', task?.completed_at === null);
ok('la task nasce già dentro una colonna della board', Boolean(task?.column_id));
const { data: fatta } = await supabase
  .from('tasks')
  .update({ status: 'done' })
  .eq('id', task.id)
  .select()
  .single();
ok('il trigger valorizza completed_at quando passa a done', Boolean(fatta?.completed_at));
const { data: riaperta } = await supabase
  .from('tasks')
  .update({ status: 'todo' })
  .eq('id', task.id)
  .select()
  .single();
ok('riaprendola completed_at torna vuoto', riaperta?.completed_at === null);

// item in inbox, per la schermata di smistamento
await supabase.from('items').insert({
  title: 'Articolo da leggere',
  kind: 'article',
  source_url: 'https://www.example.com/a',
  captured_via: 'app',
});

// ---------- PAGINE: rispondono e mostrano i dati veri? ----------
const pagine = [
  ['/', ['che contano oggi', 'Guardare lezione 4', 'Una lezione al giorno']],
  ['/task', ['Task', 'Guardare lezione 4', 'Corso Meta Ads', 'Da fare']],
  ['/progetti', ['Progetti', 'Corso Meta Ads']],
  ['/abitudini', ['Abitudini', 'Una lezione al giorno', 'Ogni giorno']],
  ['/obiettivi', ['Obiettivi', 'Padroneggiare Meta Ads', 'Lezioni completate']],
  ['/spaces', ['Spaces', 'Corsi']],
  [`/spaces/${space.id}`, ['Corsi', 'Meta Advertising', 'Lezione 3']],
  [`/spaces/${space.id}?c=${lezione.id}`, ['Lezione 3', 'Appunti lezione 3']],
  [`/note/${nota.id}`, ['Appunti lezione 3', 'Il CPM sale il venerdì']],
  ['/inbox', ['Inbox', 'Articolo da leggere', 'Meta Advertising']],
];

for (const [percorso, attese] of pagine) {
  const res = await fetch(APP + percorso, { headers: { cookie }, redirect: 'manual' });
  const html = res.status === 200 ? await res.text() : '';
  const mancanti = attese.filter((a) => !html.includes(a));
  ok(
    `GET ${percorso}`,
    res.status === 200 && mancanti.length === 0,
    res.status !== 200
      ? `HTTP ${res.status}`
      : mancanti.length
        ? `manca: ${mancanti.join(', ')}`
        : '',
  );
}

await admin.auth.admin.deleteUser(creato.user.id);

for (const [buono, nome, extra] of esiti)
  console.log(`${buono ? '✅' : '❌'} ${nome}${extra ? ` — ${extra}` : ''}`);
const falliti = esiti.filter(([b]) => !b).length;
console.log(
  falliti
    ? `\n${falliti} verifiche fallite su ${esiti.length}`
    : `\nTutte e ${esiti.length} le verifiche passate`,
);
process.exit(falliti ? 1 : 0);
