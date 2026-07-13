-- Psychological Edge — generated 5R coaching sessions.
-- Run this once in the Supabase SQL editor to enable saving on
-- /psychological-edge.
--
-- report/relate/reason are engine-written from the journal — nothing here
-- duplicates data entry. response_tag/reasoning_answer/reconstruction_* are
-- the trader's own input (a one-tap emotional read, a short written answer
-- to the engine's "why" question, and a commit on the action plan), which
-- the next session references to check whether a flagged pattern recurred.
--
-- Safe to re-run: creates the table if it doesn't exist yet, and upgrades an
-- existing table from the earlier single-`narrative` version if you already
-- ran that migration.

create table if not exists psych_edge_sessions (
  id                       uuid primary key default uuid_generate_v4(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  date                     text not null,
  trade_id                 uuid references trades(id) on delete set null,
  pattern_key              text,
  recurring_pattern_label  text,
  report                   text not null default '',
  relate                   text,
  reason                   text not null default '',
  primary_objective        text,
  reminder                 text,
  success_metric           text,
  response_tag             text,
  reasoning_answer         text,
  reconstruction_note      text,
  reconstruction_confirmed boolean not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (user_id, date)
);

-- Upgrade path from the earlier version (which only had a `narrative` jsonb column).
alter table psych_edge_sessions add column if not exists report text not null default '';
alter table psych_edge_sessions add column if not exists relate text;
alter table psych_edge_sessions add column if not exists reason text not null default '';
alter table psych_edge_sessions add column if not exists response_tag text;
alter table psych_edge_sessions add column if not exists reasoning_answer text;
alter table psych_edge_sessions add column if not exists reconstruction_note text;
alter table psych_edge_sessions add column if not exists reconstruction_confirmed boolean not null default false;
alter table psych_edge_sessions drop column if exists narrative;

alter table psych_edge_sessions enable row level security;

drop policy if exists "Users manage own psych edge sessions" on psych_edge_sessions;
create policy "Users manage own psych edge sessions"
  on psych_edge_sessions for all
  using (auth.uid() = user_id);
