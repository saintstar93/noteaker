# 02 — Modello dati

Postgres 17 su Supabase. **Ogni** modifica passa da una migrazione in
`supabase/migrations/`. Mai modifiche a mano dalla dashboard.

Convenzioni: nomi di tabella al plurale in inglese, `snake_case`, chiavi `uuid`
generate da `gen_random_uuid()`, timestamp `timestamptz` con `default now()`,
ogni tabella ha `user_id uuid not null default auth.uid()` e RLS attiva.

---

## 1. Mappa delle tabelle

> Aggiornato il 22/08/2026: si sono aggiunte `projects` (ADR 0005),
> `task_columns` (ADR 0006), `pomodoro_settings` e `pomodoro_sessions`
> (ADR 0007), `capture_tokens` e `capture_events`.

```
profiles
│
├── spaces ──── collections (albero, parent_id) ──┐
│                                                 │
├── items ◄──────────────────────────────────────┘
│     ├── item_chunks      (testo spezzettato + embedding, per il RAG)
│     ├── item_tags ──── tags
│     ├── highlights      (evidenziazioni, con posizione o timestamp video)
│     └── item_links      (backlink: item → item)
│
├── goals ──── key_results
│     ├── projects ──── tasks ──── task_columns
│     └── habits ──── habit_logs
│
├── pomodoro_settings / pomodoro_sessions
│
├── reviews                (settimanali / mensili)
├── capture_tokens         (uno per fonte, hashati)
├── calendar_events        (cache di Google Calendar)
└── ai_runs                (log delle chiamate AI: costo, modello, esito)
```

---

## 2. Il cuore: `items`

Una sola tabella per tutti i contenuti. La differenza tra un articolo, un reel e
un capitolo di libro è **il valore di `kind` e cosa c'è in `metadata`**, non una
tabella diversa. Motivo: la ricerca, i tag, i backlink e l'inbox devono
funzionare in modo identico su tutto, e con tabelle separate ogni query
diventerebbe una `UNION` di sette pezzi.

```sql
create type item_kind as enum (
  'note', 'article', 'video', 'reel', 'book', 'course', 'highlight'
);

create type item_status as enum (
  'inbox',       -- appena catturato, non ancora smistato
  'processing',  -- l'AI ci sta lavorando
  'active',      -- smistato e in uso
  'archived'
);

create table items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,

  kind         item_kind   not null default 'note',
  status       item_status not null default 'inbox',

  title        text,
  body         jsonb,        -- struttura BlockNote (verità per l'editor)
  body_text    text,         -- stesso contenuto appiattito (ricerca + embedding)
  summary      text,         -- riassunto generato dall'AI

  source_url   text,
  source_domain text generated always as (
    nullif(regexp_replace(coalesce(source_url,''), '^https?://(www\.)?([^/]+).*$', '\2'), '')
  ) stored,

  collection_id uuid references collections on delete set null,

  -- campi specifici per kind: autore, canale, durata, pagina, capitolo,
  -- numero lezione, thumbnail, transcript_status...
  metadata     jsonb not null default '{}'::jsonb,

  -- ricerca full-text: colonna generata, sempre allineata al contenuto
  search_vector tsvector generated always as (
    setweight(to_tsvector('italian', coalesce(title,'')),   'A') ||
    setweight(to_tsvector('italian', coalesce(summary,'')), 'B') ||
    setweight(to_tsvector('italian', coalesce(body_text,'')),'C')
  ) stored,

  is_favorite  boolean not null default false,
  captured_via text,          -- 'extension' | 'ios_shortcut' | 'telegram' | 'app'
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  processed_at timestamptz
);

create index items_user_status_idx  on items (user_id, status, created_at desc);
create index items_collection_idx   on items (collection_id);
create index items_search_idx       on items using gin (search_vector);
create index items_metadata_idx     on items using gin (metadata jsonb_path_ops);
```

Note su scelte non ovvie:

- **`search_vector` è una colonna generata**: Postgres la ricalcola da solo a
  ogni scrittura. Non esiste il rischio di indice disallineato dal contenuto.
- **`setweight` A/B/C**: un match nel titolo pesa più di uno nel corpo.
- **Configurazione `'italian'`**: gestisce lo stemming italiano ("conversioni" →
  "conversion"). Se molte note sono in inglese, si valuterà una colonna doppia.
- **`source_domain` generata**: permette "tutto quello che ho salvato da
  youtube.com" senza `LIKE '%...%'` su ogni riga.

---

## 3. Organizzazione: `spaces`, `collections`, `tags`

```sql
create table spaces (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  name       text not null,
  color      text not null default 'yellow',  -- token della palette, vedi doc 03
  icon       text,
  position   int  not null default 0,
  created_at timestamptz not null default now()
);

create table collections (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  space_id   uuid not null references spaces on delete cascade,
  parent_id  uuid references collections on delete cascade,  -- albero
  name       text not null,
  path       text not null,   -- es. 'business/ads/meta' — materialized path
  position   int  not null default 0,
  created_at timestamptz not null default now()
);
create index collections_path_idx on collections (user_id, path text_pattern_ops);
```

**Perché `path` oltre a `parent_id`.** Con il solo `parent_id`, per rispondere a
"dammi tutti gli item dentro Business e sottocartelle" servirebbe una query
ricorsiva a ogni caricamento. Con il *materialized path* (la stringa del
percorso) diventa un `path LIKE 'business/%'`, indicizzato. Il costo è mantenere
`path` aggiornato quando si sposta una cartella: lo fa un trigger, scritto una
volta.

```sql
create table tags (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  name       text not null,
  color      text,
  is_ai      boolean not null default false,   -- suggerito dall'AI o creato a mano
  unique (user_id, name)
);

create table item_tags (
  item_id uuid references items on delete cascade,
  tag_id  uuid references tags  on delete cascade,
  user_id uuid not null default auth.uid(),
  primary key (item_id, tag_id)
);

-- backlink [[nota]]
create table item_links (
  source_item_id uuid references items on delete cascade,
  target_item_id uuid references items on delete cascade,
  user_id uuid not null default auth.uid(),
  primary key (source_item_id, target_item_id)
);
```

I backlink si ricalcolano a ogni salvataggio della nota: si estraggono i
`[[wikilink]]` da `body`, si risolvono in `item_id`, si riscrive il set. Semplice
e sempre corretto; ottimizzare solo se diventasse lento.

---

## 4. Highlight

Le evidenziazioni (da articolo, libro, video) sono **item a sé** di kind
`highlight` **più** una riga in `highlights` con la posizione:

```sql
create table highlights (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid(),
  item_id    uuid not null references items on delete cascade,  -- l'highlight stesso
  parent_item_id uuid references items on delete cascade,       -- la fonte
  quote      text not null,
  note       text,
  locator    jsonb not null default '{}'::jsonb,
    -- articolo: {"selector": "...", "prefix": "...", "suffix": "..."}
    -- video:    {"start_s": 431, "end_s": 448}
    -- libro:    {"page": 128, "chapter": "4"}
  created_at timestamptz not null default now()
);
```

Così un highlight è cercabile, taggabile e collegabile come qualunque altra nota,
ma sa sempre da dove viene e sa riportarti lì (al secondo esatto del video, al
paragrafo esatto dell'articolo).

---

## 5. Chunk ed embedding

Un item lungo non si trasforma in **un** embedding: si spezza in **chunk** di
~500-800 token con sovrapposizione, e ognuno ha il suo vettore. Motivo: cercando
"come si calcola il ROAS" vuoi il paragrafo giusto, non l'intero corso da 40
pagine.

```sql
create extension if not exists vector;

create table item_chunks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid(),
  item_id    uuid not null references items on delete cascade,
  chunk_index int not null,
  content    text not null,
  token_count int,
  embedding  vector(1536),          -- text-embedding-3-small
  created_at timestamptz not null default now(),
  unique (item_id, chunk_index)
);

-- HNSW: indice approssimato, ricerca in millisecondi anche su milioni di righe
create index item_chunks_embedding_idx
  on item_chunks using hnsw (embedding vector_cosine_ops);
```

### Pipeline automatica (pgmq + pg_cron + pg_net + Edge Function)

```
UPDATE items.body_text
        │
        ▼  trigger
   pgmq.send('embedding_jobs', {item_id})
        │
        ▼  pg_cron ogni 10s
   legge un batch di job → pg_net.http_post → Edge Function 'embed'
        │
        ▼
   la function ri-chunka l'item, chiama il modello di embedding,
   riscrive item_chunks, cancella il job dalla coda
```

Se la chiamata fallisce, il job **non** viene cancellato: al giro dopo si
riprova. È tutto il sistema di retry che ci serve. Lo stesso meccanismo, con code
diverse, gestisce riassunti (`summary_jobs`) e trascrizioni
(`transcription_jobs`).

---

## 6. Ricerca ibrida (la funzione che useremo ovunque)

```sql
create or replace function search_items(
  query_text  text,
  query_embedding vector(1536),
  match_count int  default 20,
  rrf_k       int  default 50
)
returns table (item_id uuid, score float)
language sql stable
as $$
with fts as (
  select id as item_id,
         row_number() over (order by ts_rank_cd(search_vector, websearch_to_tsquery('italian', query_text)) desc) as rank
  from items
  where search_vector @@ websearch_to_tsquery('italian', query_text)
  limit match_count * 2
),
sem as (
  select item_id,
         row_number() over (order by min(embedding <=> query_embedding)) as rank
  from item_chunks
  group by item_id
  limit match_count * 2
)
select coalesce(fts.item_id, sem.item_id) as item_id,
       coalesce(1.0 / (rrf_k + fts.rank), 0.0) +
       coalesce(1.0 / (rrf_k + sem.rank), 0.0) as score
from fts full outer join sem on fts.item_id = sem.item_id
order by score desc
limit match_count;
$$;
```

**Come leggerla.** Due classifiche separate — una per parole, una per
significato. Ogni risultato prende `1/(k + posizione)` da ciascuna: chi compare
in entrambe vince, chi compare in una sola resta comunque a galla. `k=50`
attenua il vantaggio dei primissimi posti (è il valore standard della
letteratura su RRF). Non si sommano i punteggi grezzi perché `ts_rank` e la
distanza coseno vivono su scale incomparabili.

`<=>` è l'operatore di **distanza coseno** di pgvector: più è piccolo, più i due
testi si somigliano.

---

## 7. Produttività

```sql
create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  space_id uuid references spaces on delete set null,
  title text not null,
  why   text,                                   -- la motivazione, si rilegge nelle review
  horizon text not null default 'quarter',      -- 'quarter' | 'year' | 'life'
  period_start date, period_end date,
  status text not null default 'active',        -- active | done | dropped
  created_at timestamptz not null default now()
);

create table key_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  goal_id uuid not null references goals on delete cascade,
  title text not null,
  unit text,                       -- '€', 'kg', 'sessioni', '%'
  target numeric, current numeric default 0
);

create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  goal_id uuid references goals on delete set null,
  title text not null,
  color text,
  rrule text not null,             -- ricorrenza standard iCalendar (RFC 5545)
  target_per_period int default 1,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  habit_id uuid not null references habits on delete cascade,
  done_on date not null,
  value numeric default 1,
  note text,
  unique (habit_id, done_on)
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  goal_id uuid references goals on delete set null,
  item_id uuid references items on delete set null,   -- task nato da una nota
  title text not null,
  notes text,
  due_on date,
  scheduled_for date,               -- il giorno in cui compare in "Today"
  priority int not null default 2,  -- 1 alta, 2 media, 3 bassa
  estimate_min int,
  status text not null default 'todo',   -- todo | doing | done | dropped
  rrule text,                        -- task ricorrenti
  completed_at timestamptz,
  position int not null default 0,   -- ordinamento manuale in Today
  created_at timestamptz not null default now()
);
create index tasks_today_idx on tasks (user_id, scheduled_for, status);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  kind text not null,                -- 'weekly' | 'monthly'
  period_start date not null, period_end date not null,
  stats jsonb not null default '{}'::jsonb,   -- precompilato dall'app
  answers jsonb not null default '{}'::jsonb, -- risposte alle domande guidate
  ai_summary text,
  created_at timestamptz not null default now(),
  unique (user_id, kind, period_start)
);
```

**`rrule`**: invece di inventare un formato per "ogni lunedì e giovedì", si usa
lo standard dei calendari (RFC 5545), es. `FREQ=WEEKLY;BYDAY=MO,TH`. Esistono
librerie collaudate per espanderlo, e importare/esportare verso i calendari
diventa gratis.

**Le streak non si salvano**, si calcolano dai `habit_logs` con una window
function. Un contatore salvato è un contatore che prima o poi si disallinea.

---

## 8. Cattura e servizio

```sql
create table capture_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,               -- 'Chrome', 'iPhone Shortcut', 'Telegram'
  token_hash text not null,         -- SHA-256; il token in chiaro si mostra UNA volta
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table ai_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  item_id uuid references items on delete set null,
  job text not null,                -- 'summary' | 'tags' | 'embedding' | 'transcript' | 'ask'
  model text not null,
  input_tokens int, output_tokens int, cost_usd numeric,
  status text not null,             -- ok | error
  error text,
  created_at timestamptz not null default now()
);
```

`ai_runs` esiste per una ragione pratica: **sapere quanto costa l'app** prima che
la bolletta lo dica. Una pagina di impostazioni mostrerà la spesa del mese.

---

## 9. RLS — lo schema di policy, identico per tutte le tabelle

```sql
alter table items enable row level security;

create policy "own rows" on items
  for all
  to authenticated
  using      (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
```

Tre punti che si sbagliano sempre:

1. **`enable row level security` va scritto su ogni tabella.** Una tabella senza
   RLS in Supabase è leggibile da chiunque abbia la chiave pubblica. Serve un
   test automatico che fallisce se una tabella non ha RLS.
2. **`with check` oltre a `using`.** `using` filtra cosa *leggi*, `with check`
   valida cosa *scrivi*. Senza il secondo, si possono inserire righe intestate a
   un altro utente.
3. **`(select auth.uid())` invece di `auth.uid()`**: la sottoquery viene valutata
   una volta sola invece che riga per riga. Su tabelle grandi è la differenza tra
   millisecondi e secondi.
4. **RLS non basta: serve anche il `GRANT`.** Sono due controlli distinti e
   servono entrambi. `GRANT` dice *«questo ruolo può toccare questa tabella»*
   (permesso sull'oggetto), RLS dice *«e comunque solo queste righe»* (permesso
   sulla riga). Su una tabella creata da una migrazione senza `GRANT` espliciti,
   l'API risponde `permission denied for table items` **prima** ancora di
   valutare le policy. Verificato sul campo in fase 0. Quindi ogni migrazione che
   crea una tabella finisce con:

   ```sql
   grant select, insert, update, delete on public.<tabella>
     to authenticated, service_role;
   ```

   Il ruolo `anon` (chi non ha fatto login) resta volutamente **senza alcun
   permesso**: è il rifiuto più esterno possibile, prima ancora delle policy.

---

## 10. Export (obbligatorio dalla fase 2)

Una funzione che produce uno zip: un file `.md` per item (con frontmatter YAML:
titolo, tag, fonte, date, collection) più un `data.json` con tutto lo schema
grezzo. Deve essere possibile ricostruire l'intero contenuto senza l'app. È la
polizza assicurativa contro il lock-in — la stessa cosa che ha spinto Daniele
fuori da Notion.
