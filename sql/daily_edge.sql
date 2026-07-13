-- Psychological Edge — day-after-loss protocol.
-- Run this once in the Supabase SQL editor to enable saving on /psychological-edge.
-- One row per day, scoped to the authenticated user via RLS.

create table if not exists daily_edge (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  date            text not null,                          -- ISO date (day)
  yesterday_loss  boolean not null default false,
  loss_trade      text,
  was_own_fault   boolean,                                -- true = own mistake, false = valid setup
  fault_reason    text,
  revenge_urge    integer,                                -- 1..5
  daily_rule      text,
  rule_followed   text,                                   -- 'ja' | 'deels' | 'nee'
  triggered_extra boolean not null default false,
  sized_up        boolean not null default false,
  note            text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, date)
);

alter table daily_edge enable row level security;

create policy "Users manage own daily edge"
  on daily_edge for all
  using (auth.uid() = user_id);
