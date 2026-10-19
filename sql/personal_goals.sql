-- Run once in the Supabase SQL editor before using personal goals.
-- Existing journal goals remain unchanged. Safe to run again.

alter table public.trading_goals add column if not exists description text not null default '';
alter table public.trading_goals add column if not exists progress_value numeric not null default 0;
alter table public.trading_goals add column if not exists unit text not null default '';
