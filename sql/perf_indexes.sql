-- Read performance: indexes and cheaper row-level security.
-- Run this once in the Supabase SQL editor. Safe to re-run.
--
-- Two things it does:
--
-- 1. Indexes on the columns every read filters by. Row-level security adds
--    `user_id = auth.uid()` to each query, and without an index on user_id
--    that is a sequential scan of the whole table on every load, for every
--    user. The dashboard also bounds its reads by date, so the hot tables get
--    a (user_id, date) index that serves both the scope and the range at once.
--    habit_completions has no user_id: its policy joins through habits, so it
--    gets (habit_id, date) instead.
--
-- 2. `(select auth.uid())` instead of `auth.uid()` in every policy. Written
--    bare, Postgres calls the function once per row; wrapped in a subselect it
--    is evaluated once per query and the result is used as a constant. Same
--    security, a fraction of the work. (Supabase's own RLS performance
--    guidance recommends exactly this.)

-- ── Indexes ───────────────────────────────────────────────────────────
create index if not exists trades_user_date_idx            on trades (user_id, date_time desc);
create index if not exists trades_linked_analysis_idx      on trades (linked_analysis_id);
create index if not exists analyses_user_created_idx       on analyses (user_id, created_at desc);
create index if not exists funded_accounts_user_idx        on funded_accounts (user_id, updated_at desc);
create index if not exists payout_events_account_idx       on payout_events (funded_account_id, payout_date desc);
create index if not exists habits_user_idx                 on habits (user_id, created_at);
create index if not exists habit_completions_habit_date_idx on habit_completions (habit_id, date);
create index if not exists weekly_reflections_user_week_idx on weekly_reflections (user_id, week_start);
create index if not exists weekly_trade_reviews_user_week_idx on weekly_trade_reviews (user_id, week_start);
create index if not exists psych_edge_sessions_user_date_idx on psych_edge_sessions (user_id, date desc);
create index if not exists best_trade_of_day_user_date_idx on best_trade_of_day (user_id, date desc);
create index if not exists pre_market_exercise_user_date_idx on pre_market_exercise (user_id, date);
create index if not exists daily_tasks_user_date_idx       on daily_tasks (user_id, date);
create index if not exists trader_playbooks_user_idx       on trader_playbooks (user_id);
create index if not exists commitment_adherence_user_date_idx on commitment_adherence_log (user_id, date);

-- ── Policies: one auth.uid() per query, not per row ───────────────────
drop policy if exists "Users can view own profile"   on profiles;
drop policy if exists "Users can update own profile" on profiles;
create policy "Users can view own profile"   on profiles for select using ((select auth.uid()) = id);
create policy "Users can update own profile" on profiles for update using ((select auth.uid()) = id);

drop policy if exists "Users manage own analyses" on analyses;
create policy "Users manage own analyses" on analyses for all using ((select auth.uid()) = user_id);

drop policy if exists "Users manage own trades" on trades;
create policy "Users manage own trades" on trades for all using ((select auth.uid()) = user_id);

drop policy if exists "Users manage own accounts" on funded_accounts;
create policy "Users manage own accounts" on funded_accounts for all using ((select auth.uid()) = user_id);

drop policy if exists "Users manage own payouts" on payout_events;
create policy "Users manage own payouts" on payout_events for all
  using (
    exists (
      select 1 from funded_accounts
      where funded_accounts.id = payout_events.funded_account_id
        and funded_accounts.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users manage own habits" on habits;
create policy "Users manage own habits" on habits for all using ((select auth.uid()) = user_id);

drop policy if exists "Users manage own habit completions" on habit_completions;
create policy "Users manage own habit completions" on habit_completions for all
  using (
    exists (
      select 1 from habits
      where habits.id = habit_completions.habit_id
        and habits.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users manage own weekly reflections" on weekly_reflections;
create policy "Users manage own weekly reflections" on weekly_reflections for all using ((select auth.uid()) = user_id);

drop policy if exists "Users manage own weekly trade reviews" on weekly_trade_reviews;
create policy "Users manage own weekly trade reviews" on weekly_trade_reviews for all using ((select auth.uid()) = user_id);

drop policy if exists "Users manage own psych edge sessions" on psych_edge_sessions;
create policy "Users manage own psych edge sessions" on psych_edge_sessions for all using ((select auth.uid()) = user_id);

drop policy if exists "Users manage own best trade of day" on best_trade_of_day;
create policy "Users manage own best trade of day" on best_trade_of_day for all using ((select auth.uid()) = user_id);

drop policy if exists "Users manage own pre-market exercise" on pre_market_exercise;
create policy "Users manage own pre-market exercise" on pre_market_exercise for all using ((select auth.uid()) = user_id);

drop policy if exists "Users manage own daily tasks" on daily_tasks;
create policy "Users manage own daily tasks" on daily_tasks for all using ((select auth.uid()) = user_id);

drop policy if exists "Users manage own playbook" on trader_playbooks;
create policy "Users manage own playbook" on trader_playbooks for all using ((select auth.uid()) = user_id);

drop policy if exists "Users manage own commitments" on commitments;
create policy "Users manage own commitments" on commitments for all using ((select auth.uid()) = user_id);

drop policy if exists "Users manage own pattern events" on pattern_events;
create policy "Users manage own pattern events" on pattern_events for all using ((select auth.uid()) = user_id);

drop policy if exists "Users manage own adherence log" on commitment_adherence_log;
create policy "Users manage own adherence log" on commitment_adherence_log for all using ((select auth.uid()) = user_id);

drop policy if exists "Users manage own monte carlo settings" on monte_carlo_settings;
create policy "Users manage own monte carlo settings" on monte_carlo_settings for all using ((select auth.uid()) = user_id);

drop policy if exists "Users manage own trading goals" on trading_goals;
create policy "Users manage own trading goals" on trading_goals for all using ((select auth.uid()) = user_id);
