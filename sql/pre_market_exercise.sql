-- Pre-Market Exercise.
-- Run this once in the Supabase SQL editor to enable the "Pre-market exercises"
-- tab in the MC Trade Therapist.
--
-- One row per calendar day. Before the session opens, the trader reviews their
-- two most recent losses and two most recent wins and commits — in writing — to
-- a plan for each: how to prevent the losing mistake from repeating today, and
-- how to reproduce what worked. Plans are keyed by the trade's id so they stay
-- attached to the exact trade being reviewed.
--
-- Safe to re-run: creates the table only if it does not exist yet.

create table if not exists pre_market_exercise (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        text not null,
  loss_plans  jsonb not null default '{}',
  win_plans   jsonb not null default '{}',
  focus       text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, date)
);

alter table pre_market_exercise enable row level security;

drop policy if exists "Users manage own pre-market exercise" on pre_market_exercise;
create policy "Users manage own pre-market exercise"
  on pre_market_exercise for all
  using (auth.uid() = user_id);
