-- My Goals.
-- Run this once in the Supabase SQL editor to enable the "My Goals" tab in
-- My Edge → Mind Edge.
--
-- A goal is a target on a number the app already computes — execution rate,
-- rule adherence, Mindscore, win rate, net R, clean days, trades logged —
-- measured over a window you pick. Progress is never stored: it is recomputed
-- from your trades and habits every time the tab is opened, so a goal can
-- never drift out of step with the data behind it. The row only holds the
-- intent: what you are aiming at, from where, and by when.
--
-- Safe to re-run: creates the table only if it does not exist yet.

create table if not exists trading_goals (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  -- What the trader wrote, e.g. "Get execution to 80% this month". Optional:
  -- the UI writes a sentence from the metric when this is left empty.
  title       text not null default '',
  -- Which number is being aimed at. Kept as text rather than an enum so a new
  -- metric does not need a migration.
  metric      text not null,
  -- The number to reach, in that metric's own unit (percent, R, or a count).
  target      numeric not null,
  -- Where the trader was starting from, so progress can be read as a journey
  -- rather than an absolute. Null when they did not record one.
  baseline    numeric,
  -- The window the metric is measured over, as inclusive ISO dates.
  start_date  text not null,
  end_date    text not null,
  -- Set when the trader archives a goal by hand; live goals stay null and are
  -- judged on the data.
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists trading_goals_user_idx on trading_goals (user_id, end_date desc);

alter table trading_goals enable row level security;

drop policy if exists "Users manage own trading goals" on trading_goals;
create policy "Users manage own trading goals"
  on trading_goals for all
  using (auth.uid() = user_id);
