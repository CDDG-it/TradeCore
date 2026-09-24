-- TradingMC — Live broker accounts: migraties 2 en 3 van 3.
-- Plak dit in de Supabase SQL editor en klik Run. Veilig om opnieuw te draaien.

-- Live broker accounts: multi-user hardening.
-- Run this in the Supabase SQL editor AFTER broker_connections.sql.
--
-- Three changes, all aimed at the case where the stored credentials belong to
-- someone other than the operator:
--
--  1. Per-connection data keys (envelope encryption). Each connection gets its
--     own random key; that key is stored wrapped by the server's master key.
--     One leaked data key exposes one connection, not every user. It also
--     means the master key can be rotated by rewrapping keys, without
--     touching (or decrypting) the credentials themselves, and it is the
--     shape a hardware key service expects if one is added later.
--
--  2. Login attempts recorded in the database instead of server memory, so
--     the cap holds across serverless instances. Enforced by a function the
--     user cannot bypass: the table has NO user policy, so a stolen browser
--     token cannot delete its own attempts to reset the counter.
--
--  3. An append-only audit trail of every access to stored credentials. Users
--     can read their own history; nobody can edit or delete it through the
--     API.
--
-- Safe to re-run.

-- ── 1. Per-connection data keys ──────────────────────────────────────
-- Null on rows written before this migration: those still use the master key
-- directly and are re-wrapped the next time the password is saved.
alter table broker_credentials add column if not exists wrapped_key text;

-- ── 2. Login attempts ────────────────────────────────────────────────
create table if not exists broker_login_attempts (
  id           bigserial primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  attempted_at timestamptz not null default now()
);
create index if not exists broker_login_attempts_idx on broker_login_attempts (user_id, attempted_at desc);

-- RLS on with no policy at all: unreachable through the REST API. Only the
-- function below touches it.
alter table broker_login_attempts enable row level security;

-- Counts recent attempts and records this one, in a single statement so two
-- simultaneous requests cannot both slip under the cap. Returns true when the
-- attempt is allowed.
create or replace function broker_take_login_attempt(max_attempts int, window_minutes int)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid   uuid := auth.uid();
  taken int;
begin
  if uid is null then
    return false;
  end if;

  delete from broker_login_attempts
   where user_id = uid
     and attempted_at < now() - make_interval(mins => window_minutes);

  select count(*) into taken
    from broker_login_attempts
   where user_id = uid
     and attempted_at > now() - make_interval(mins => window_minutes);

  if taken >= max_attempts then
    return false;
  end if;

  insert into broker_login_attempts (user_id) values (uid);
  return true;
end;
$$;

revoke all on function broker_take_login_attempt(int, int) from public;
grant execute on function broker_take_login_attempt(int, int) to authenticated;

-- ── 3. Audit trail ───────────────────────────────────────────────────
create table if not exists broker_audit_log (
  id            bigserial primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  connection_id uuid,
  action        text not null,
  detail        text,
  created_at    timestamptz not null default now()
);
create index if not exists broker_audit_log_idx on broker_audit_log (user_id, created_at desc);

alter table broker_audit_log enable row level security;

-- Readable by its owner, and by nobody else. No insert, update or delete
-- policy: the log can only be appended by the function below, so a stolen
-- token cannot erase its own tracks.
drop policy if exists "Users read own broker audit log" on broker_audit_log;
create policy "Users read own broker audit log" on broker_audit_log
  for select using ((select auth.uid()) = user_id);

create or replace function broker_audit(action text, connection_id uuid, detail text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    return;
  end if;
  insert into broker_audit_log (user_id, connection_id, action, detail)
  values (uid, connection_id, left(action, 40), left(detail, 200));
end;
$$;

revoke all on function broker_audit(text, uuid, text) from public;
grant execute on function broker_audit(text, uuid, text) to authenticated;
-- Live broker accounts: connect via Tradovate OAuth.
-- Run this in the Supabase SQL editor AFTER broker_hardening.sql.
--
-- This is how Tradecopia and the other copiers connect: the trader logs in on
-- Tradovate's own site and authorises the app there. TradingMC never sees a
-- password. What is stored is a refresh token, which is limited to this app
-- and which the trader can revoke from Tradovate at any time.
--
-- The password route stays in the code for local development and for anyone
-- already connected that way, but OAuth is the route to offer to other people.
--
-- Safe to re-run.

-- How a connection authenticates. Existing rows are password logins.
alter table broker_connections
  add column if not exists auth_method text not null default 'password';

do $$
begin
  alter table broker_connections
    add constraint broker_connections_auth_method_check
    check (auth_method in ('password', 'oauth'));
exception
  when duplicate_object then null;
end $$;

-- The OAuth refresh token, encrypted with the connection's own data key just
-- like a password is. Null for password connections.
alter table broker_credentials add column if not exists refresh_token text;

-- A password connection always has a secret; an OAuth one never does.
alter table broker_credentials alter column secret drop not null;

-- ── One account belongs to one trader, once ──────────────────────────
-- A trader with accounts at several prop firms has several Tradovate logins,
-- so several connections, which is fine. But reconnecting the same firm used
-- to create a second copy of the same accounts, and the totals counted them
-- twice. Uniqueness therefore belongs to the trader, not the connection: a
-- reconnect now moves the existing accounts to the new connection instead of
-- duplicating them.
alter table broker_accounts drop constraint if exists broker_accounts_connection_id_environment_external_id_key;

do $$
begin
  alter table broker_accounts
    add constraint broker_accounts_user_env_external_key
    unique (user_id, environment, external_id);
exception
  when duplicate_table or duplicate_object then null;
end $$;
