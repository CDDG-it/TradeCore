-- Live broker accounts (Tradovate).
-- Run this once in the Supabase SQL editor to enable "Live accounts" on the
-- Accounts page.
--
-- Security model:
--   * The Tradovate username + password never exist in plain text in the
--     database. The server encrypts them with AES-256-GCM using
--     BROKER_ENCRYPTION_KEY, a key that lives only in the server environment
--     (Vercel / .env.local) and never reaches the browser or Supabase. The
--     ciphertext is bound to its owner and row, so it cannot be copied to
--     another row or user and still decrypt.
--   * The same goes for the cached Tradovate access token.
--   * Every table is row-level secured to its owner, like the rest of the app.
--   * The integration is read-only: the server only ever calls Tradovate's
--     account, balance and position read endpoints.
--
-- Safe to re-run.

-- One login (username/password) at Tradovate. One login can hold several
-- accounts (eval, funded, sim).
create table if not exists broker_connections (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  -- 'tradovate' for real logins; 'mock' only exists in local development.
  broker        text not null default 'tradovate' check (broker in ('tradovate', 'mock')),
  label         text not null default '',
  -- A masked hint of the username ("luc•••23") so the list is recognisable
  -- without storing the username itself in the clear.
  username_hint text not null default '',
  state         text not null default 'connected'
                  check (state in ('connected', 'auth_failed', 'error')),
  last_error    text,
  last_sync_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists broker_connections_user_idx on broker_connections (user_id, created_at);
alter table broker_connections enable row level security;
drop policy if exists "Users manage own broker connections" on broker_connections;
create policy "Users manage own broker connections" on broker_connections
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Encrypted secrets, kept apart from the connection row so no list query can
-- ever select them by accident.
create table if not exists broker_credentials (
  connection_id    uuid primary key references broker_connections(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  secret           text not null,
  token            text,
  token_expires_at timestamptz,
  updated_at       timestamptz not null default now()
);
alter table broker_credentials enable row level security;
drop policy if exists "Users manage own broker credentials" on broker_credentials;
create policy "Users manage own broker credentials" on broker_credentials
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Accounts discovered under a connection.
create table if not exists broker_accounts (
  id            uuid primary key default uuid_generate_v4(),
  connection_id uuid not null references broker_connections(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  environment   text not null check (environment in ('live', 'demo')),
  external_id   bigint not null,
  name          text not null default '',
  created_at    timestamptz not null default now(),
  unique (connection_id, environment, external_id)
);
create index if not exists broker_accounts_user_idx on broker_accounts (user_id);
alter table broker_accounts enable row level security;
drop policy if exists "Users manage own broker accounts" on broker_accounts;
create policy "Users manage own broker accounts" on broker_accounts
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Equity history for charts: at most one row per account per 5 minutes.
create table if not exists broker_account_history (
  account_id uuid not null references broker_accounts(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  bucket     timestamptz not null,
  balance    numeric(14,2),
  equity     numeric(14,2),
  day_pl     numeric(14,2),
  primary key (account_id, bucket)
);
create index if not exists broker_account_history_user_idx on broker_account_history (user_id, bucket desc);
alter table broker_account_history enable row level security;
drop policy if exists "Users manage own broker history" on broker_account_history;
create policy "Users manage own broker history" on broker_account_history
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
