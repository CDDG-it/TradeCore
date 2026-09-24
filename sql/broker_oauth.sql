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
