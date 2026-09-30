begin;

create table if not exists user_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_id text not null default 'basic' check (plan_id in ('basic','plus','pro')),
  entitlements_snapshot jsonb,
  updated_at timestamptz not null default now()
);
alter table user_access enable row level security;
drop policy if exists "Users read own access" on user_access;
create policy "Users read own access" on user_access for select using ((select auth.uid()) = user_id);

create table if not exists platform_access_settings (
  id boolean primary key default true check (id),
  launch_free_enabled boolean not null default true,
  billing_effective_at timestamptz,
  updated_at timestamptz not null default now()
);
insert into platform_access_settings (id, launch_free_enabled) values (true, true) on conflict (id) do nothing;
alter table platform_access_settings enable row level security;

create or replace function effective_entitlements(for_user uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare settings platform_access_settings%rowtype; snapshot jsonb;
begin
  select * into settings from platform_access_settings where id = true;
  if settings.launch_free_enabled and (settings.billing_effective_at is null or now() < settings.billing_effective_at) then
    return '{"planId":"pro","accounts":"unlimited","journal":true,"preMarketExercises":true,"sessionReview":true,"historyRetentionDays":null,"mindscore":"full","habits":true,"goals":true,"standingRules":true,"advancedAnalytics":true,"screenshots":true,"bestTrade":true,"weeklyReviews":true,"monthlyReviews":true,"propRuleTracking":"unlimited","monteCarlo":true,"globalMarkets":"full","prioritySupport":true}'::jsonb;
  end if;
  select entitlements_snapshot into snapshot from user_access where user_id = for_user;
  return coalesce(snapshot, '{"planId":"basic","accounts":1,"journal":true,"preMarketExercises":true,"sessionReview":true,"historyRetentionDays":90,"mindscore":"score","habits":true,"goals":false,"standingRules":false,"advancedAnalytics":false,"screenshots":false,"bestTrade":false,"weeklyReviews":false,"monthlyReviews":false,"propRuleTracking":1,"monteCarlo":false,"globalMarkets":"calendar","prioritySupport":false}'::jsonb);
end $$;

create or replace function has_entitlement(feature text, for_user uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((effective_entitlements(for_user)->>feature)::boolean, false)
$$;

create or replace function history_cutoff(for_user uuid default auth.uid()) returns date
language sql stable security definer set search_path = public as $$
  select case when effective_entitlements(for_user)->>'historyRetentionDays' is null then null
    else current_date - ((effective_entitlements(for_user)->>'historyRetentionDays')::integer - 1) end
$$;

drop policy if exists "Users manage own accounts" on funded_accounts;
drop policy if exists "Users read own accounts" on funded_accounts;
drop policy if exists "Users update own accounts" on funded_accounts;
drop policy if exists "Users delete own accounts" on funded_accounts;
drop policy if exists "Users insert within account limit" on funded_accounts;
create policy "Users read own accounts" on funded_accounts for select using ((select auth.uid()) = user_id);
create policy "Users update own accounts" on funded_accounts for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own accounts" on funded_accounts for delete using ((select auth.uid()) = user_id);
create policy "Users insert within account limit" on funded_accounts for insert with check (
  (select auth.uid()) = user_id and (
    effective_entitlements((select auth.uid()))->>'accounts' = 'unlimited'
    or (select count(*) from funded_accounts a where a.user_id = (select auth.uid())) < (effective_entitlements((select auth.uid()))->>'accounts')::integer
  )
);

drop policy if exists "Users manage own standing rules" on standing_rules;
create policy "Entitled users read own standing rules" on standing_rules for select using ((select auth.uid()) = user_id and has_entitlement('standingRules'));
create policy "Entitled users insert own standing rules" on standing_rules for insert with check ((select auth.uid()) = user_id and has_entitlement('standingRules'));
create policy "Entitled users update own standing rules" on standing_rules for update using ((select auth.uid()) = user_id and has_entitlement('standingRules')) with check ((select auth.uid()) = user_id and has_entitlement('standingRules'));
create policy "Entitled users delete own standing rules" on standing_rules for delete using ((select auth.uid()) = user_id and has_entitlement('standingRules'));

drop policy if exists "Users manage own trading goals" on trading_goals;
create policy "Entitled users manage own trading goals" on trading_goals for all using ((select auth.uid()) = user_id and has_entitlement('goals')) with check ((select auth.uid()) = user_id and has_entitlement('goals'));

drop policy if exists "Users manage own weekly trade reviews" on weekly_trade_reviews;
create policy "Entitled users manage own weekly reviews" on weekly_trade_reviews for all using ((select auth.uid()) = user_id and has_entitlement('weeklyReviews')) with check ((select auth.uid()) = user_id and has_entitlement('weeklyReviews'));

create or replace function enforce_best_trade_entitlement() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not has_entitlement('bestTrade', new.user_id) and (new.taken_was_best or trim(new.notes) <> '' or new.screenshot_groups <> '[]'::jsonb) then
    raise exception 'Plus unlocks Best Trade and review screenshots';
  end if;
  return new;
end $$;
drop trigger if exists best_trade_entitlement_guard on best_trade_of_day;
create trigger best_trade_entitlement_guard before insert or update on best_trade_of_day for each row execute function enforce_best_trade_entitlement();

drop policy if exists "Users upload own screenshots" on storage.objects;
create policy "Entitled users upload own screenshots" on storage.objects for insert to authenticated with check (
  bucket_id = 'trade-screenshots' and (storage.foldername(name))[1] = (select auth.uid())::text and has_entitlement('screenshots')
);

drop policy if exists "Users manage own trades" on trades;
create policy "Users read retained trades" on trades for select using ((select auth.uid()) = user_id and (history_cutoff() is null or left(date_time, 10)::date >= history_cutoff()));
create policy "Users insert own trades" on trades for insert with check ((select auth.uid()) = user_id);
create policy "Users update own trades" on trades for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own trades" on trades for delete using ((select auth.uid()) = user_id);

drop policy if exists "Users manage own pre-market exercise" on pre_market_exercise;
create policy "Users read retained pre-market exercise" on pre_market_exercise for select using ((select auth.uid()) = user_id and (history_cutoff() is null or date::date >= history_cutoff()));
create policy "Users insert own pre-market exercise" on pre_market_exercise for insert with check ((select auth.uid()) = user_id);
create policy "Users update own pre-market exercise" on pre_market_exercise for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own pre-market exercise" on pre_market_exercise for delete using ((select auth.uid()) = user_id);

drop policy if exists "Users manage own trade rule checks" on trade_rule_checks;
create policy "Users read retained trade rule checks" on trade_rule_checks for select using ((select auth.uid()) = user_id and exists (select 1 from trades t where t.id = trade_id and t.user_id = (select auth.uid())));
create policy "Users insert own trade rule checks" on trade_rule_checks for insert with check ((select auth.uid()) = user_id and exists (select 1 from trades t where t.id = trade_id and t.user_id = (select auth.uid())));
create policy "Users update own trade rule checks" on trade_rule_checks for update using ((select auth.uid()) = user_id and exists (select 1 from trades t where t.id = trade_id and t.user_id = (select auth.uid()))) with check ((select auth.uid()) = user_id);
create policy "Users delete own trade rule checks" on trade_rule_checks for delete using ((select auth.uid()) = user_id);

drop policy if exists "Users manage own analyses" on analyses;
create policy "Users read retained analyses" on analyses for select using ((select auth.uid()) = user_id and (history_cutoff() is null or date::date >= history_cutoff()));
create policy "Users insert own analyses" on analyses for insert with check ((select auth.uid()) = user_id);
create policy "Users update own analyses" on analyses for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own analyses" on analyses for delete using ((select auth.uid()) = user_id);

drop policy if exists "Users manage own best trade of day" on best_trade_of_day;
create policy "Users read retained session reviews" on best_trade_of_day for select using ((select auth.uid()) = user_id and (history_cutoff() is null or date::date >= history_cutoff()));
create policy "Users insert own session reviews" on best_trade_of_day for insert with check ((select auth.uid()) = user_id);
create policy "Users update own session reviews" on best_trade_of_day for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own session reviews" on best_trade_of_day for delete using ((select auth.uid()) = user_id);

drop policy if exists "Users read own screenshots" on storage.objects;
create policy "Entitled users read own screenshots" on storage.objects for select to authenticated using (bucket_id = 'trade-screenshots' and (storage.foldername(name))[1] = (select auth.uid())::text and has_entitlement('screenshots'));

commit;
