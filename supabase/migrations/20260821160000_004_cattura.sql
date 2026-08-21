-- =====================================================================
-- 004 — Cattura: token per fonte e registro delle chiamate
-- Riferimenti: CLAUDE.md §5.1 e §7, docs/06-sicurezza.md §3.4
--
-- `POST /api/capture` è l'UNICA porta dell'app aperta su internet senza
-- sessione di login. Ci arriveranno l'estensione Chrome, lo Shortcut
-- dell'iPhone e il bot Telegram — e, prima o poi, anche i bot che
-- scandagliano internet in cerca di endpoint aperti.
-- =====================================================================

create table public.capture_tokens (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,

  -- 'Chrome', 'iPhone Shortcut', 'Telegram': uno per fonte, così se ne può
  -- revocare uno senza rompere gli altri
  name         text not null,

  -- SOLO l'impronta SHA-256, mai il token in chiaro. Se il database
  -- finisse nelle mani sbagliate, i token non sarebbero riutilizzabili.
  -- Il valore vero si mostra UNA volta, al momento della creazione.
  token_hash   text not null unique,

  -- I primi caratteri, per riconoscere quale token è quale nell'elenco
  -- senza poterlo ricostruire
  token_hint   text not null,

  last_used_at timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);

create index capture_tokens_user_idx on public.capture_tokens (user_id, created_at desc);
-- La ricerca all'arrivo di una richiesta avviene per impronta, e deve
-- essere immediata: è l'indice più caldo dell'endpoint.
create index capture_tokens_hash_idx on public.capture_tokens (token_hash)
  where revoked_at is null;

-- ---------------------------------------------------------------------
-- Registro delle chiamate: serve a due cose insieme —
--   1. il rate limit (quante richieste ha fatto questo token nell'ultimo
--      minuto?);
--   2. accorgersi degli abusi, che senza log non si vedono proprio.
--
-- Perché il rate limit sta in Postgres e non in memoria: l'app gira su
-- funzioni serverless, che nascono e muoiono a ogni richiesta e non
-- condividono memoria fra loro. Un contatore in una variabile verrebbe
-- azzerato di continuo e non limiterebbe niente.
-- ---------------------------------------------------------------------
create table public.capture_events (
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users on delete cascade,
  token_id   uuid references public.capture_tokens on delete cascade,
  status     int not null,          -- il codice HTTP restituito
  source     text,
  created_at timestamptz not null default now()
);

create index capture_events_rate_idx on public.capture_events (token_id, created_at desc);

-- =====================================================================
-- RLS
--
-- Nota importante: l'endpoint di cattura NON usa queste policy. Non ha una
-- sessione, quindi gira con la chiave `service_role`, che salta RLS — è
-- l'unico punto dell'app in cui succede, ed è il motivo per cui quel
-- codice va letto due volte e coperto da test.
-- Queste policy servono all'INTERFACCIA: la pagina delle impostazioni,
-- dove l'utente vede e revoca i propri token.
-- =====================================================================

alter table public.capture_tokens enable row level security;
alter table public.capture_events enable row level security;

create policy "own rows" on public.capture_tokens
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Il registro è in sola lettura per l'utente: le righe le scrive solo
-- l'endpoint, con la chiave di servizio.
create policy "leggi il proprio registro" on public.capture_events
  for select to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.capture_tokens to authenticated, service_role;
grant select on public.capture_events to authenticated;
grant select, insert on public.capture_events to service_role;
grant usage, select on sequence public.capture_events_id_seq to service_role;
