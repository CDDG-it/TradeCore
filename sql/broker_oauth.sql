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
