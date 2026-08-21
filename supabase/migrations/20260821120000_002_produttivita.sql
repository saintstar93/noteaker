-- =====================================================================
-- 002 — Produttività: goals, key_results, habits, habit_logs, tasks
--       + l'albero delle collection che si mantiene da solo
-- Riferimento: docs/02-modello-dati.md §3 e §7
-- =====================================================================

-- ---------------------------------------------------------------------
-- goals — l'obiettivo trimestrale o annuale. Sta in cima alla catena
-- Goal → Habit → Task: è la ragione per cui una cosa è nella lista.
-- ---------------------------------------------------------------------
create table public.goals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  space_id     uuid references public.spaces on delete set null,
  title        text not null,
  why          text,                                   -- si rilegge nelle review
  horizon      text not null default 'quarter'
               check (horizon in ('quarter','year','life')),
  color        text check (color in ('yellow','purple','green','red','blue','teal')),
  period_start date,
  period_end   date,
  status       text not null default 'active'
               check (status in ('active','done','dropped')),
  position     int  not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index goals_user_idx on public.goals (user_id, status, position);

create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- key_results — la parte misurabile dell'obiettivo. Senza numero non è
-- un key result, è un desiderio.
-- ---------------------------------------------------------------------
create table public.key_results (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null default auth.uid() references auth.users on delete cascade,
  goal_id  uuid not null references public.goals on delete cascade,
  title    text not null,
  unit     text,                        -- '€', 'kg', 'sessioni', '%'
  target   numeric,
  current  numeric not null default 0,
  position int not null default 0
);

create index key_results_goal_idx on public.key_results (goal_id, position);

-- ---------------------------------------------------------------------
-- habits — ricorrenti. `rrule` è lo standard dei calendari (RFC 5545),
-- es. 'FREQ=WEEKLY;BYDAY=MO,TH'. Non inventiamo un formato nostro: così
-- importare ed esportare verso un calendario diventa gratis.
-- ---------------------------------------------------------------------
create table public.habits (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users on delete cascade,
  goal_id           uuid references public.goals on delete set null,
  title             text not null,
  color             text check (color in ('yellow','purple','green','red','blue','teal')),
  rrule             text not null default 'FREQ=DAILY',
  target_per_period int  not null default 1,
  position          int  not null default 0,
  active            boolean not null default true,
  created_at        timestamptz not null default now()
);

create index habits_user_idx on public.habits (user_id, active, position);

-- ---------------------------------------------------------------------
-- habit_logs — una riga per giorno fatto. Le STREAK NON si salvano:
-- si calcolano da qui. Un contatore salvato è un contatore che prima o
-- poi si disallinea dalla realtà.
-- ---------------------------------------------------------------------
create table public.habit_logs (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null default auth.uid() references auth.users on delete cascade,
  habit_id  uuid not null references public.habits on delete cascade,
  done_on   date not null default current_date,
  value     numeric not null default 1,
  note      text,
  unique (habit_id, done_on)   -- due volte lo stesso giorno non ha senso
);

create index habit_logs_lookup_idx on public.habit_logs (user_id, done_on desc);

-- ---------------------------------------------------------------------
-- tasks — il livello quotidiano. `status` sono anche le colonne del
-- Kanban; `position` è l'ordinamento manuale dentro la colonna.
-- ---------------------------------------------------------------------
create table public.tasks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users on delete cascade,
  goal_id       uuid references public.goals on delete set null,
  item_id       uuid references public.items on delete set null,  -- task nato da una nota
  title         text not null,
  notes         text,
  due_on        date,
  scheduled_for date,                    -- il giorno in cui compare in Today
  priority      int  not null default 2 check (priority between 1 and 3),
  estimate_min  int,
  status        text not null default 'todo'
                check (status in ('todo','doing','done','dropped')),
  position      int  not null default 0,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index tasks_today_idx  on public.tasks (user_id, scheduled_for, status);
create index tasks_board_idx  on public.tasks (user_id, status, position);
create index tasks_goal_idx   on public.tasks (goal_id);

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- `completed_at` non lo scrive l'app: lo scrive il database quando lo
-- stato diventa 'done'. Così è vero anche per le scritture che non
-- passano dall'interfaccia.
create or replace function public.set_task_completed_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status = 'done' and coalesce(old.status, '') <> 'done' then
    new.completed_at = now();
  elsif new.status <> 'done' then
    new.completed_at = null;
  end if;
  return new;
end;
$$;

create trigger tasks_completed_at
  before insert or update on public.tasks
  for each row execute function public.set_task_completed_at();

-- =====================================================================
-- L'albero delle collection: `path` mantenuto da un trigger
--
-- Con il solo `parent_id`, per rispondere a "dammi tutto quello che sta
-- dentro Corsi, sottocartelle comprese" servirebbe una query ricorsiva a
-- ogni caricamento. Con il materialized path diventa
-- `path like 'corsi/%'`, che usa l'indice.
--
-- Il costo è tenerlo aggiornato quando una cartella si sposta o si
-- rinomina: lo fa questo trigger, scritto una volta. Se lo lasciassimo
-- fare all'app, prima o poi una scrittura da un'altra parte lo
-- disallineerebbe.
-- =====================================================================

create or replace function public.slugify(valore text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(both '-' from
    regexp_replace(lower(coalesce(valore, '')), '[^a-z0-9]+', '-', 'g')
  );
$$;

create or replace function public.set_collection_path()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  path_genitore text;
  slug          text;
begin
  slug := public.slugify(new.name);
  if slug = '' then slug := 'senza-nome'; end if;

  if new.parent_id is null then
    new.path := slug;
  else
    select c.path into path_genitore
    from public.collections c
    where c.id = new.parent_id;

    if path_genitore is null then
      raise exception 'La cartella genitore % non esiste', new.parent_id;
    end if;

    new.path := path_genitore || '/' || slug;
  end if;

  return new;
end;
$$;

create trigger collections_set_path
  before insert or update of name, parent_id on public.collections
  for each row execute function public.set_collection_path();

-- Quando una cartella cambia percorso, tutte le sue discendenti vanno
-- riscritte: il loro path comincia con quello vecchio.
create or replace function public.cascade_collection_path()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.path is distinct from old.path then
    update public.collections
    set path = new.path || substring(path from length(old.path) + 1)
    where user_id = new.user_id
      and path like old.path || '/%';
  end if;
  return null;
end;
$$;

-- ATTENZIONE al `after update` SENZA lista di colonne.
-- `after update of path` scatterebbe solo se `path` comparisse nella SET
-- dell'istruzione UPDATE. Ma `path` non lo scrive mai nessuno a mano: lo
-- riscrive il trigger BEFORE qui sopra a partire da `name`. Con la lista di
-- colonne, rinominare una cartella non aggiornava le discendenti — bug vero,
-- trovato provando il caso "Corsi → Meta Ads → Lezione 3".
-- Il confronto `is distinct from` dentro la funzione evita comunque il lavoro
-- inutile quando il percorso non è cambiato.
create trigger collections_cascade_path
  after update on public.collections
  for each row execute function public.cascade_collection_path();

-- Una cartella non può finire dentro sé stessa: senza questo controllo
-- l'albero diventa un anello e le query ricorsive non finiscono più.
create or replace function public.check_collection_cycle()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  corrente uuid := new.parent_id;
  passi    int  := 0;
begin
  while corrente is not null loop
    if corrente = new.id then
      raise exception 'Una cartella non può essere spostata dentro sé stessa';
    end if;
    select parent_id into corrente from public.collections where id = corrente;
    passi := passi + 1;
    if passi > 50 then
      raise exception 'Albero delle cartelle troppo profondo o corrotto';
    end if;
  end loop;
  return new;
end;
$$;

create trigger collections_check_cycle
  before update of parent_id on public.collections
  for each row execute function public.check_collection_cycle();

-- =====================================================================
-- RLS + GRANT sulle tabelle nuove (docs/06-sicurezza.md §3.2)
-- Servono entrambi: GRANT è il permesso sulla tabella, RLS sulla riga.
-- =====================================================================

alter table public.goals       enable row level security;
alter table public.key_results enable row level security;
alter table public.habits      enable row level security;
alter table public.habit_logs  enable row level security;
alter table public.tasks       enable row level security;

create policy "own rows" on public.goals
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "own rows" on public.key_results
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "own rows" on public.habits
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "own rows" on public.habit_logs
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "own rows" on public.tasks
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on
  public.goals,
  public.key_results,
  public.habits,
  public.habit_logs,
  public.tasks
to authenticated, service_role;
