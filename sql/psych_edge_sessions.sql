-- Psychological Edge — generated coaching sessions.
-- Run this once in the Supabase SQL editor to enable saving on
-- /psychological-edge. One row per day; the engine reads the trade journal
-- and writes the narrative + action plan here, it isn't a form the trader
-- fills in.

create table if not exists psych_edge_sessions (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null references auth.users(id) on delete cascade,
  date                    text not null,                          -- ISO date (day)
  trade_id                uuid references trades(id) on delete set null,
  pattern_key             text,
  recurring_pattern_label text,
  narrative               jsonb not null default '[]'::jsonb,     -- string[]
  primary_objective       text,
  reminder                text,
  success_metric          text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (user_id, date)
);

alter table psych_edge_sessions enable row level security;

create policy "Users manage own psych edge sessions"
  on psych_edge_sessions for all
  using (auth.uid() = user_id);
