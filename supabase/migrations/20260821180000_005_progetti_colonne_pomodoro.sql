-- =====================================================================
-- 005 — Progetti, colonne del Kanban personalizzabili, Pomodoro
-- =====================================================================

-- ---------------------------------------------------------------------
-- projects — il livello che mancava fra l'obiettivo e la task.
--
-- Perché un progetto NON è un obiettivo: un obiettivo è trimestrale e
-- misurabile ("fatturare 50k"), un progetto è un corpo di lavoro con un
-- inizio e una fine ("rifare il sito"). Tenerli come due etichette
-- parallele sulla stessa task avrebbe prodotto due tendine che fanno
-- quasi la stessa cosa. Sono incatenati: Goal → Project → Task, con
-- entrambi i collegamenti facoltativi.
-- ---------------------------------------------------------------------
create table public.projects (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  goal_id    uuid references public.goals on delete set null,
  space_id   uuid references public.spaces on delete set null,
  name       text not null,
  description text,
  color      text check (color in ('yellow','purple','green','red','blue','teal')),
  status     text not null default 'active' check (status in ('active','done','archived')),
  position   int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_user_idx on public.projects (user_id, status, position);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.tasks
  add column project_id uuid references public.projects on delete set null;

create index tasks_project_idx on public.tasks (project_id, position);

-- ---------------------------------------------------------------------
-- task_columns — le colonne del Kanban, decise dall'utente
--
-- `status` NON viene sostituito: resta la verità su "fatto / non fatto",
-- perché ci si appoggiano la schermata Today, le statistiche e le review.
-- Una colonna marcata `is_done` aggiorna lo `status` tramite trigger.
-- Una sola fonte di verità, non due che prima o poi divergono.
-- ---------------------------------------------------------------------
create table public.task_columns (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  name       text not null,
  color      text check (color in ('yellow','purple','green','red','blue','teal')),
  position   int not null default 0,
  -- "arrivare qui vuol dire aver finito"
  is_done    boolean not null default false,
  created_at timestamptz not null default now()
);

create index task_columns_user_idx on public.task_columns (user_id, position);

alter table public.tasks
  add column column_id uuid references public.task_columns on delete set null;

create index tasks_column_idx on public.tasks (column_id, position);

/**
 * Due cose insieme, ed entrambe devono valere anche per le scritture che NON
 * passano dall'interfaccia (per esempio una task creata dall'endpoint di
 * cattura, o a mano da psql):
 *
 *  1. una task senza colonna finisce nella prima colonna della board.
 *     Senza questo, resterebbe con `column_id` nullo e **non comparirebbe in
 *     nessuna colonna**: sparirebbe dalla vista Kanban senza dire niente.
 *  2. `status` resta allineato alla colonna: entrare in una colonna marcata
 *     `is_done` significa aver finito.
 */
create or replace function public.sync_task_status_from_column()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  colonna_finale boolean;
begin
  if new.column_id is null then
    select id into new.column_id
    from public.task_columns
    where user_id = new.user_id
    order by position
    limit 1;
  end if;

  if new.column_id is null then
    return new;   -- l'utente non ha ancora colonne: non c'è niente da fare
  end if;

  select is_done into colonna_finale
  from public.task_columns
  where id = new.column_id;

  if colonna_finale is true then
    new.status := 'done';
  elsif new.status = 'done' then
    -- spostata FUORI da una colonna finale: torna in lavorazione
    new.status := 'todo';
  end if;

  return new;
end;
$$;

-- Prima del trigger che scrive `completed_at`, altrimenti quello leggerebbe
-- lo stato vecchio. In Postgres i trigger `before` di pari livello scattano
-- in ordine alfabetico di nome: `tasks_a_sync_status` viene prima di
-- `tasks_completed_at`. Il nome è brutto di proposito, l'ordine conta.
-- `before insert` SENZA lista di colonne (una task nuova spesso non nomina
-- affatto `column_id`), e `before update of column_id` per gli spostamenti.
create trigger tasks_a_sync_status_insert
  before insert on public.tasks
  for each row execute function public.sync_task_status_from_column();

create trigger tasks_a_sync_status_update
  before update of column_id on public.tasks
  for each row execute function public.sync_task_status_from_column();

-- ---------------------------------------------------------------------
-- Pomodoro
--
-- Le impostazioni stanno in database e non nel browser perché devono
-- valere anche sull'iPhone: se le mettessimo in localStorage avresti due
-- configurazioni diverse sui due dispositivi.
-- ---------------------------------------------------------------------
create table public.pomodoro_settings (
  user_id            uuid primary key default auth.uid() references auth.users on delete cascade,
  work_minutes       int not null default 25 check (work_minutes between 1 and 180),
  short_break_minutes int not null default 5 check (short_break_minutes between 1 and 60),
  long_break_minutes int not null default 15 check (long_break_minutes between 1 and 120),
  cycles_before_long int not null default 4 check (cycles_before_long between 2 and 12),
  auto_start_next    boolean not null default false,
  suono              boolean not null default true,
  updated_at         timestamptz not null default now()
);

create trigger pomodoro_settings_set_updated_at
  before update on public.pomodoro_settings
  for each row execute function public.set_updated_at();

/**
 * Le sessioni concluse. Servono a due cose: sapere quanto hai lavorato
 * davvero su una task, e riprendere il conteggio dei cicli su un altro
 * dispositivo.
 */
create table public.pomodoro_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  task_id    uuid references public.tasks on delete set null,
  kind       text not null check (kind in ('work','short_break','long_break')),
  minutes    int not null,
  started_at timestamptz not null,
  ended_at   timestamptz not null default now(),
  completed  boolean not null default true   -- false = interrotta a metà
);

create index pomodoro_sessions_user_idx on public.pomodoro_sessions (user_id, ended_at desc);
create index pomodoro_sessions_task_idx on public.pomodoro_sessions (task_id);

-- ---------------------------------------------------------------------
-- Colonne di partenza per ogni utente
-- ---------------------------------------------------------------------
create or replace function public.crea_colonne_iniziali(id_utente uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.task_columns (user_id, name, color, position, is_done)
  values
    (id_utente, 'Da fare',  'blue',   0, false),
    (id_utente, 'In corso', 'yellow', 1, false),
    (id_utente, 'Fatto',    'green',  2, true);
end;
$$;

-- Ogni nuovo utente parte con una board utilizzabile invece che vuota.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
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

  perform public.crea_colonne_iniziali(new.id);
  insert into public.pomodoro_settings (user_id) values (new.id) on conflict do nothing;

  return new;
end;
$$;

-- Gli utenti che esistono già non passano dal trigger: vanno serviti qui.
do $$
declare
  utente record;
begin
  for utente in select id from auth.users loop
    if not exists (select 1 from public.task_columns where user_id = utente.id) then
      perform public.crea_colonne_iniziali(utente.id);
    end if;
    insert into public.pomodoro_settings (user_id) values (utente.id) on conflict do nothing;
  end loop;
end $$;

-- Le task esistenti finiscono nella colonna che corrisponde al loro stato.
update public.tasks t
set column_id = c.id
from public.task_columns c
where c.user_id = t.user_id
  and t.column_id is null
  and c.is_done = (t.status = 'done')
  and c.position = case when t.status = 'done' then 2 when t.status = 'doing' then 1 else 0 end;

-- =====================================================================
-- RLS + GRANT
-- =====================================================================
alter table public.projects           enable row level security;
alter table public.task_columns       enable row level security;
alter table public.pomodoro_settings  enable row level security;
alter table public.pomodoro_sessions  enable row level security;

create policy "own rows" on public.projects
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "own rows" on public.task_columns
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "own rows" on public.pomodoro_settings
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "own rows" on public.pomodoro_sessions
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on
  public.projects,
  public.task_columns,
  public.pomodoro_settings,
  public.pomodoro_sessions
to authenticated, service_role;
