-- My Trade Profile.
-- Run this once in the Supabase SQL editor to enable the My Trade Profile page
-- (/trade-profile): the IPIP-NEO-120 personality assessment, the trader's
-- change goal, and the 12-week development program built on it.
--
-- Scores, focus areas and the program schedule are never stored. They are
-- recomputed from the raw answers every time the page opens, so a change to
-- the scoring or the focus rules applies to everyone's existing data at once.
-- These tables only hold what the trader entered.
--
-- Safe to re-run: every statement is idempotent.

-- One row per trader: assessment answers, the goal and the program start.
create table if not exists trade_profile (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  -- Item id ("1".."120") → answer 1–5 as given, before reverse keying.
  answers           jsonb not null default '{}'::jsonb,
  -- Assessment page to resume on.
  page              int not null default 0,
  -- ISO days.
  consented_on      text,
  completed_on      text,
  -- The change goal: a domain ("N") or facet ("N1") and a direction.
  goal_trait        text,
  goal_direction    text check (goal_direction in ('increase', 'decrease', 'channel')),
  goal_area         text,
  goal_outcome      text not null default '',
  goal_obstacle     text not null default '',
  goal_if_cue       text not null default '',
  goal_then_action  text not null default '',
  -- Day 1 of the 12-week program.
  program_start     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id)
);

-- The 30-second daily check-in.
create table if not exists trade_profile_checkins (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  date         text not null,
  exercise_id  text not null,
  done         text not null check (done in ('yes', 'partly', 'no')),
  difficulty   int not null check (difficulty between 1 and 5),
  -- One-item state rating of the goal trait that day; higher = more in line with the goal.
  state        int not null check (state between 1 and 7),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, date)
);

-- The three-question weekly reflection, per program week.
create table if not exists trade_profile_reflections (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  week        int not null check (week between 1 and 12),
  answers     jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, week)
);

-- Week 6 and week 12 retests: the 24 items of the goal's domain.
create table if not exists trade_profile_retests (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  week        int not null,
  taken_on    text not null,
  answers     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, week)
);

create index if not exists trade_profile_checkins_user_date_idx on trade_profile_checkins (user_id, date);

alter table trade_profile enable row level security;
alter table trade_profile_checkins enable row level security;
alter table trade_profile_reflections enable row level security;
alter table trade_profile_retests enable row level security;

drop policy if exists "Users manage own trade profile" on trade_profile;
create policy "Users manage own trade profile" on trade_profile
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own trade profile checkins" on trade_profile_checkins;
create policy "Users manage own trade profile checkins" on trade_profile_checkins
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own trade profile reflections" on trade_profile_reflections;
create policy "Users manage own trade profile reflections" on trade_profile_reflections
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own trade profile retests" on trade_profile_retests;
create policy "Users manage own trade profile retests" on trade_profile_retests
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
