-- Apply after broker_oauth.sql. Existing account snapshots/history remain intact.
-- Password logins are retired; OAuth is the only persistent broker authorisation.
update broker_credentials set secret = null, token = null, token_expires_at = null
where secret is not null;
update broker_connections set state = 'auth_failed',
  last_error = 'Reconnect with Tradovate OAuth to continue syncing'
where auth_method = 'password';
alter table broker_credentials alter column secret drop not null;
alter table broker_connections add column if not exists trades_synced_at timestamptz;

-- Browser sessions must never read ciphertext, even if they know their own row ID.
drop policy if exists "Users manage own broker credentials" on broker_credentials;
revoke all on table broker_credentials from anon, authenticated;
grant select, insert, update, delete on table broker_credentials to service_role;

create table if not exists broker_trade_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('tradovate', 'topstepx', 'rithmic', 'csv')),
  source_key text not null,
  external_account text not null,
  broker_account_id uuid references broker_accounts(id) on delete set null,
  funded_account_id uuid references funded_accounts(id) on delete set null,
  instrument text not null,
  direction text check (direction in ('long', 'short')),
  quantity numeric(14,4),
  entry_time timestamptz,
  exit_time timestamptz,
  entry_price numeric(18,6),
  exit_price numeric(18,6),
  fees numeric(14,2),
  pnl numeric(14,2),
  status text not null default 'pending' check (status in ('pending', 'linked', 'ignored')),
  journal_trade_id uuid references trades(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, source, external_account, source_key)
);
create index if not exists broker_trade_imports_user_status_idx
  on broker_trade_imports (user_id, status, created_at desc, id desc);
alter table broker_trade_imports enable row level security;
drop policy if exists "Users read own imported trades" on broker_trade_imports;
create policy "Users read own imported trades" on broker_trade_imports
  for select using ((select auth.uid()) = user_id);
-- All writes go through authenticated server routes, which verify ownership and
-- use the service role. Browser Supabase calls cannot bypass import validation.
revoke insert, update, delete on broker_trade_imports from anon, authenticated;
grant select on broker_trade_imports to authenticated;
grant select, insert, update, delete on broker_trade_imports to service_role;

-- One transaction prevents two review requests from creating two journal rows.
create or replace function broker_accept_import(p_import_id uuid, p_user_id uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  imported broker_trade_imports%rowtype;
  new_trade_id uuid;
begin
  select * into imported from broker_trade_imports
    where id = p_import_id and user_id = p_user_id for update;
  if not found or imported.status <> 'pending' then
    raise exception 'Trade is not pending';
  end if;
  if imported.direction is null or imported.quantity is null or imported.entry_time is null
     or imported.exit_time is null or imported.entry_price is null
     or imported.exit_price is null or imported.pnl is null
     or imported.exit_time < imported.entry_time then
    raise exception 'Trade details are incomplete';
  end if;
  if imported.funded_account_id is not null and not exists (
    select 1 from funded_accounts where id = imported.funded_account_id and user_id = p_user_id
  ) then
    raise exception 'Funded account does not belong to user';
  end if;
  insert into trades (user_id, funded_account_id, date_time, execution_time,
    execution_end_time, instrument, direction, result, execution_notes)
  values (p_user_id, imported.funded_account_id,
    to_char(imported.entry_time at time zone 'UTC', 'YYYY-MM-DD'),
    to_char(imported.entry_time at time zone 'UTC', 'HH24:MI'),
    to_char(imported.exit_time at time zone 'UTC', 'HH24:MI'),
    imported.instrument, imported.direction,
    case when imported.pnl > 0 then 'win' when imported.pnl < 0 then 'loss' else 'break-even' end,
    format('Imported from %s. %s contracts · %s → %s · net P&L %s USD%s.',
      imported.source, imported.quantity, imported.entry_price, imported.exit_price,
      imported.pnl, case when imported.fees is null then '' else format(' · fees %s USD', imported.fees) end)
  ) returning id into new_trade_id;
  update broker_trade_imports set status = 'linked', journal_trade_id = new_trade_id
    where id = p_import_id;
  return new_trade_id;
end;
$$;
revoke all on function broker_accept_import(uuid, uuid) from public, anon, authenticated;
grant execute on function broker_accept_import(uuid, uuid) to service_role;
