-- Run in the Supabase SQL editor before using Post Market R Potential Analysis.
-- Each observation belongs to one existing journal trade. The trade row remains
-- the source of truth for result, realised R, instrument and chart details.
create table if not exists r_potential_analyses (
  trade_id uuid primary key references trades(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  planned_take_profit_r numeric(8,2),
  mfe_r numeric(8,2),
  stop_hit_mfe_r numeric(8,2),
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint r_potential_planned_positive check (planned_take_profit_r is null or planned_take_profit_r > 0),
  constraint r_potential_mfe_nonnegative check (mfe_r is null or mfe_r >= 0),
  constraint r_potential_stop_mfe_nonnegative check (stop_hit_mfe_r is null or stop_hit_mfe_r >= 0)
);

create index if not exists r_potential_analyses_user_idx on r_potential_analyses (user_id);
alter table r_potential_analyses enable row level security;

drop policy if exists "Users read own R potential analyses" on r_potential_analyses;
create policy "Users read own R potential analyses" on r_potential_analyses for select
  using ((select auth.uid()) = user_id and exists (
    select 1 from trades t where t.id = trade_id and t.user_id = (select auth.uid())
  ));
drop policy if exists "Users insert own R potential analyses" on r_potential_analyses;
create policy "Users insert own R potential analyses" on r_potential_analyses for insert
  with check ((select auth.uid()) = user_id and exists (
    select 1 from trades t where t.id = trade_id and t.user_id = (select auth.uid())
  ));
drop policy if exists "Users update own R potential analyses" on r_potential_analyses;
create policy "Users update own R potential analyses" on r_potential_analyses for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and exists (
    select 1 from trades t where t.id = trade_id and t.user_id = (select auth.uid())
  ));
drop policy if exists "Users delete own R potential analyses" on r_potential_analyses;
create policy "Users delete own R potential analyses" on r_potential_analyses for delete
  using ((select auth.uid()) = user_id);
