-- Best Trade of the Day.
-- Run this once in the Supabase SQL editor to enable the "Best trade of the
-- day" feature in the Journal.
--
-- One row per calendar day (even on days you did not trade). It stores the
-- screenshots + notes of the best trade that was on offer that day, or a flag
-- that the trade you actually took was already the best one available.
-- Screenshots reuse the existing trade-screenshots bucket, under the path
-- {userId}/best-trade/{date}/…, so no new storage bucket or policy is needed.
--
-- Safe to re-run: creates the table only if it does not exist yet.

create table if not exists best_trade_of_day (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  date              text not null,
  taken_was_best    boolean not null default false,
  notes             text not null default '',
  screenshot_groups jsonb not null default '[]',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, date)
);

alter table best_trade_of_day enable row level security;

drop policy if exists "Users manage own best trade of day" on best_trade_of_day;
create policy "Users manage own best trade of day"
  on best_trade_of_day for all
  using (auth.uid() = user_id);
