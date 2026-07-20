-- MC Trade Therapist — deterministic behavioural coaching.
-- Run this once in the Supabase SQL editor to enable the Post-Trade 5R session,
-- the Pre-Trade Mirror, and the Mindscore commitment-adherence component.
--
-- Three tables:
--   commitments               — if-then commitments from the 5R "Reconstructing"
--                               step, reused by the Pre-Trade Mirror.
--   pattern_events            — a log of pattern occurrences the engine surfaced,
--                               plus the trader's confirm/refute. Cumulative
--                               P&L per pattern is derived from these rows.
--   commitment_adherence_log  — each time a commitment's trigger re-matched,
--                               whether the trader honoured it. This is the
--                               behaviour-change signal in the Mindscore.
--
-- The 5R session itself is stored in psych_edge_sessions (already migrated).
-- Safe to re-run.

-- ── Commitments ─────────────────────────────────────────────────────────
create table if not exists commitments (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  trade_id      uuid references trades(id) on delete set null,
  pattern_type  text,                       -- revenge | size-escalation | overtrading | plan-deviation
  trigger_text  text not null default '',   -- the "if"
  action_text   text not null default '',   -- the "then"
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists commitments_user_active_idx
  on commitments (user_id, active);

alter table commitments enable row level security;
drop policy if exists "Users manage own commitments" on commitments;
create policy "Users manage own commitments"
  on commitments for all using (auth.uid() = user_id);

-- ── Pattern events ──────────────────────────────────────────────────────
create table if not exists pattern_events (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  trade_id         uuid not null references trades(id) on delete cascade,
  date             text not null,
  pattern_type     text not null,
  confidence       numeric(4,3) not null default 0,   -- 0..1
  r_impact         numeric(8,2) not null default 0,   -- R of the focus trade
  detail           text not null default '',
  trader_confirmed boolean,                            -- null = not reviewed
  created_at       timestamptz not null default now(),
  -- One stored event per (trade, pattern) — re-running detection upserts.
  unique (user_id, trade_id, pattern_type)
);

create index if not exists pattern_events_user_type_idx
  on pattern_events (user_id, pattern_type);

alter table pattern_events enable row level security;
drop policy if exists "Users manage own pattern events" on pattern_events;
create policy "Users manage own pattern events"
  on pattern_events for all using (auth.uid() = user_id);

-- ── Commitment adherence log ────────────────────────────────────────────
create table if not exists commitment_adherence_log (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  commitment_id uuid not null references commitments(id) on delete cascade,
  trade_id      uuid references trades(id) on delete set null,
  date          text not null,
  matched       boolean not null default true,
  followed      boolean,                       -- null until resolved
  created_at    timestamptz not null default now()
);

create index if not exists commitment_adherence_commitment_idx
  on commitment_adherence_log (commitment_id);

alter table commitment_adherence_log enable row level security;
drop policy if exists "Users manage own adherence log" on commitment_adherence_log;
create policy "Users manage own adherence log"
  on commitment_adherence_log for all using (auth.uid() = user_id);
