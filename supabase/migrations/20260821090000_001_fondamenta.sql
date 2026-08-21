-- =====================================================================
-- 001 — Fondamenta: profiles, spaces, collections, items
-- Riferimento: docs/02-modello-dati.md
--
-- Regola d'oro: lo schema si cambia SOLO da qui. Mai dalla dashboard.
-- Ogni tabella ha user_id e RLS attiva: nessuna eccezione, mai.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tipi enumerati
-- ---------------------------------------------------------------------
create type item_kind as enum (
  'note', 'article', 'video', 'reel', 'book', 'course', 'highlight'
);

create type item_status as enum (
  'inbox',       -- appena catturato, non ancora smistato
  'processing',  -- l'AI ci sta lavorando
  'active',      -- smistato e in uso
  'archived'
);

-- ---------------------------------------------------------------------
-- Funzione riusabile: tiene aggiornato updated_at
-- Gira DENTRO Postgres a ogni UPDATE, non nel codice dell'app: così è vera
-- anche per le scritture fatte da un'Edge Function o da psql.
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- profiles — una riga per utente, creata automaticamente alla registrazione
-- ---------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users on delete cascade,
  display_name text,
  avatar_url   text,
  locale       text not null default 'it',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Il profilo nasce da un TRIGGER su auth.users, non da una chiamata dell'app:
-- se l'app dimenticasse di crearlo (o il login avvenisse da un altro canale),
-- l'utente resterebbe senza profilo. Qui non può succedere.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer          -- serve: scrive in public da un trigger su auth
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- spaces — le macro-aree (Business, Fitness, Corsi…)
-- ---------------------------------------------------------------------
create table public.spaces (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  name       text not null,
  -- nome di un token della palette (docs/03 §2), non un esadecimale:
  -- il colore si cambia in un posto solo
  color      text not null default 'yellow'
             check (color in ('yellow','purple','green','red','blue','teal')),
  icon       text,
  position   int  not null default 0,
  created_at timestamptz not null default now()
);

create index spaces_user_idx on public.spaces (user_id, position);

-- ---------------------------------------------------------------------
-- collections — cartelle annidabili dentro uno space
-- ---------------------------------------------------------------------
create table public.collections (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  space_id   uuid not null references public.spaces on delete cascade,
  parent_id  uuid references public.collections on delete cascade,
  name       text not null,
  -- materialized path, es. 'business/ads/meta': evita la query ricorsiva
  -- a ogni caricamento (docs/02 §3). Il trigger che lo mantiene arriva
  -- in fase 2, insieme al drag&drop dell'albero.
  path       text not null,
  position   int  not null default 0,
  created_at timestamptz not null default now()
);

create index collections_path_idx on public.collections (user_id, path text_pattern_ops);
create index collections_space_idx on public.collections (space_id);

-- ---------------------------------------------------------------------
-- items — il cuore: un'unica tabella per tutti i contenuti
-- ---------------------------------------------------------------------
create table public.items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users on delete cascade,

  kind          item_kind   not null default 'note',
  status        item_status not null default 'inbox',

  title         text,
  body          jsonb,   -- struttura BlockNote: verità per l'editor
  body_text     text,    -- stesso contenuto appiattito: ricerca + embedding
  summary       text,    -- riassunto generato dall'AI

  source_url    text,
  -- colonna GENERATA: Postgres la ricalcola da solo a ogni scrittura, quindi
  -- non può mai disallinearsi da source_url
  source_domain text generated always as (
    nullif(regexp_replace(coalesce(source_url,''), '^https?://(www\.)?([^/]+).*$', '\2'), '')
  ) stored,

  collection_id uuid references public.collections on delete set null,

  metadata      jsonb not null default '{}'::jsonb,

  -- ricerca full-text italiana, con pesi: un match nel titolo vale più
  -- di uno nel corpo
  search_vector tsvector generated always as (
    setweight(to_tsvector('italian', coalesce(title,'')),    'A') ||
    setweight(to_tsvector('italian', coalesce(summary,'')),  'B') ||
    setweight(to_tsvector('italian', coalesce(body_text,'')),'C')
  ) stored,

  is_favorite   boolean not null default false,
  captured_via  text check (captured_via in ('app','extension','ios_shortcut','telegram')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  processed_at  timestamptz
);

create index items_user_status_idx on public.items (user_id, status, created_at desc);
create index items_collection_idx  on public.items (collection_id);
create index items_search_idx      on public.items using gin (search_vector);
create index items_metadata_idx    on public.items using gin (metadata jsonb_path_ops);
create index items_domain_idx      on public.items (user_id, source_domain);

create trigger items_set_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

-- =====================================================================
-- RLS — deny by default su OGNI tabella (docs/06-sicurezza.md §3.2)
--
-- Senza queste righe, chiunque abbia la chiave anon (che è pubblica e sta
-- nel browser) leggerebbe tutto. Con queste righe, il database stesso
-- rifiuta le righe di altri utenti: nemmeno una query scritta male dal
-- front-end può aggirarle.
--
-- Tre dettagli che si sbagliano sempre:
--   1. `with check` oltre a `using`: il primo filtra ciò che LEGGI, il
--      secondo valida ciò che SCRIVI. Senza, si possono inserire righe
--      intestate a un altro utente.
--   2. `(select auth.uid())` e non `auth.uid()`: la sottoquery viene
--      valutata una volta sola invece che riga per riga.
--   3. `to authenticated`: la policy non si applica agli anonimi, che
--      quindi non vedono nulla.
-- =====================================================================

alter table public.profiles    enable row level security;
alter table public.spaces      enable row level security;
alter table public.collections enable row level security;
alter table public.items       enable row level security;

create policy "own profile" on public.profiles
  for all to authenticated
  using      ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "own rows" on public.spaces
  for all to authenticated
  using      ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "own rows" on public.collections
  for all to authenticated
  using      ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "own rows" on public.items
  for all to authenticated
  using      ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- =====================================================================
-- GRANT — il livello grossolano, sotto RLS
--
-- Sono due controlli distinti e servono ENTRAMBI:
--   • GRANT dice "il ruolo può toccare questa tabella" (permesso sull'oggetto);
--   • RLS dice  "e comunque solo queste righe"        (permesso sulla riga).
-- Senza GRANT, PostgREST risponde `permission denied for table items` ancora
-- prima di arrivare alle policy.
--
-- Il ruolo `anon` (chi non ha fatto login) resta SENZA permessi: deny by
-- default davvero, non solo a parole.
-- =====================================================================

grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete on
  public.profiles,
  public.spaces,
  public.collections,
  public.items
to authenticated, service_role;
