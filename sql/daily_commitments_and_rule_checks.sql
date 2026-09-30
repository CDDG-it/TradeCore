begin;

alter table pre_market_exercise add column if not exists exercise_type text not null default 'loss_win_review';
alter table pre_market_exercise add column if not exists inputs jsonb not null default '{}'::jsonb;
alter table pre_market_exercise add column if not exists commitment_text text not null default '';
alter table pre_market_exercise add column if not exists commitment_format text;
alter table pre_market_exercise add column if not exists completed_at timestamptz;
alter table pre_market_exercise drop constraint if exists pre_market_exercise_type_check;
alter table pre_market_exercise add constraint pre_market_exercise_type_check check (exercise_type in ('loss_win_review','mental_contrasting','post_loss_reset'));
alter table pre_market_exercise drop constraint if exists pre_market_commitment_format_check;
alter table pre_market_exercise add constraint pre_market_commitment_format_check check (commitment_format is null or commitment_format in ('if_then','scope','rule'));

update pre_market_exercise
set inputs = jsonb_build_object('loss_plans', loss_plans, 'win_plans', win_plans)
where inputs = '{}'::jsonb and (loss_plans <> '{}'::jsonb or win_plans <> '{}'::jsonb);

create table if not exists standing_rules (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null check (length(trim(text)) > 0),
  sort_order integer not null default 0,
  active boolean not null default true,
  active_from text not null default to_char(current_date, 'YYYY-MM-DD'),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists standing_rules_user_text_unique on standing_rules (user_id, lower(trim(text)));
create index if not exists standing_rules_user_active_idx on standing_rules (user_id, active, sort_order);
alter table standing_rules enable row level security;
drop policy if exists "Users manage own standing rules" on standing_rules;
create policy "Users manage own standing rules" on standing_rules for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

insert into standing_rules (user_id, text, sort_order, active_from)
select p.id, trim(rule), row_number() over (partition by p.id order by ordinality) - 1, to_char(current_date, 'YYYY-MM-DD')
from profiles p
cross join lateral regexp_split_to_table(coalesce(p.discipline_rules, ''), E'\\n') with ordinality as lines(rule, ordinality)
where trim(rule) <> ''
on conflict (user_id, lower(trim(text))) do nothing;

insert into standing_rules (user_id, text, sort_order, active_from, created_at, updated_at)
select c.user_id, trim('If ' || c.trigger_text || ', then ' || c.action_text), 1000 + row_number() over (partition by c.user_id order by c.created_at),
       to_char(c.created_at, 'YYYY-MM-DD'), c.created_at, c.updated_at
from commitments c
where c.active and trim(c.trigger_text) <> '' and trim(c.action_text) <> ''
on conflict (user_id, lower(trim(text))) do nothing;

alter table trades add column if not exists funded_account_id uuid references funded_accounts(id) on delete set null;
create index if not exists trades_funded_account_idx on trades (funded_account_id);

create table if not exists trade_rule_checks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trade_id uuid not null references trades(id) on delete cascade,
  source_type text not null check (source_type in ('commitment','standing_rule')),
  source_id uuid not null,
  source_text_snapshot text not null check (length(trim(source_text_snapshot)) > 0),
  status text not null default 'not_applicable' check (status in ('kept','broken','not_applicable')),
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trade_id, source_type, source_id)
);
create index if not exists trade_rule_checks_user_trade_idx on trade_rule_checks (user_id, trade_id);
create index if not exists trade_rule_checks_user_status_idx on trade_rule_checks (user_id, status, updated_at);
alter table trade_rule_checks enable row level security;
drop policy if exists "Users manage own trade rule checks" on trade_rule_checks;
create policy "Users manage own trade rule checks" on trade_rule_checks for all
  using ((select auth.uid()) = user_id and exists (select 1 from trades t where t.id = trade_id and t.user_id = (select auth.uid())))
  with check ((select auth.uid()) = user_id and exists (select 1 from trades t where t.id = trade_id and t.user_id = (select auth.uid())));

create or replace function preserve_trade_rule_check_snapshot() returns trigger language plpgsql as $$
begin
  new.user_id := old.user_id;
  new.trade_id := old.trade_id;
  new.source_type := old.source_type;
  new.source_id := old.source_id;
  new.source_text_snapshot := old.source_text_snapshot;
  return new;
end $$;

drop trigger if exists trade_rule_checks_preserve_snapshot on trade_rule_checks;
create trigger trade_rule_checks_preserve_snapshot before update on trade_rule_checks
for each row execute function preserve_trade_rule_check_snapshot();

create or replace function sync_trade_rule_checks() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and old.date_time is distinct from new.date_time then
    delete from trade_rule_checks where trade_id = new.id and status = 'not_applicable';
  end if;
  insert into trade_rule_checks (user_id, trade_id, source_type, source_id, source_text_snapshot)
  select new.user_id, new.id, 'commitment', e.id, e.commitment_text
  from pre_market_exercise e
  where e.user_id = new.user_id and e.date = left(new.date_time, 10) and e.completed_at is not null and trim(e.commitment_text) <> ''
  on conflict (trade_id, source_type, source_id) do nothing;

  insert into trade_rule_checks (user_id, trade_id, source_type, source_id, source_text_snapshot)
  select new.user_id, new.id, 'standing_rule', r.id, r.text
  from standing_rules r
  where r.user_id = new.user_id and r.active_from <= left(new.date_time, 10)
    and (r.archived_at is null or to_char(r.archived_at, 'YYYY-MM-DD') > left(new.date_time, 10))
  on conflict (trade_id, source_type, source_id) do nothing;
  return new;
end $$;

drop trigger if exists trades_sync_rule_checks on trades;
create trigger trades_sync_rule_checks after insert or update of date_time on trades
for each row execute function sync_trade_rule_checks();

insert into trade_rule_checks (user_id, trade_id, source_type, source_id, source_text_snapshot, status, created_at, updated_at)
select l.user_id, l.trade_id, 'standing_rule', r.id, r.text,
       case when l.followed is true then 'kept' when l.followed is false then 'broken' else 'not_applicable' end,
       l.created_at, l.created_at
from commitment_adherence_log l
join commitments c on c.id = l.commitment_id
join standing_rules r on r.user_id = c.user_id and lower(trim(r.text)) = lower(trim('If ' || c.trigger_text || ', then ' || c.action_text))
where l.trade_id is not null
on conflict (trade_id, source_type, source_id) do nothing;

-- Legacy journal checkboxes defaulted false, so false is migrated to N/A
-- rather than inventing a historical rule break the user may never assessed.
insert into trade_rule_checks (user_id, trade_id, source_type, source_id, source_text_snapshot, status, created_at, updated_at)
select t.user_id, t.id, 'standing_rule', r.id, r.text,
       case when coalesce((item->>'passed')::boolean, false) then 'kept' else 'not_applicable' end,
       t.created_at, t.updated_at
from trades t
cross join lateral jsonb_array_elements(coalesce(t.discipline->'custom_checks', '[]'::jsonb)) item
join standing_rules r on r.user_id = t.user_id and lower(trim(r.text)) = lower(trim(item->>'label'))
where trim(coalesce(item->>'label', '')) <> ''
on conflict (trade_id, source_type, source_id) do nothing;

commit;
