-- MC Pass Simulation — saved settings
-- Run this once in the Supabase SQL editor. Lets the Strategy page save your
-- simulation setup (firm rules + edge) so it persists across sessions/devices.
-- Safe to re-run: uses "if not exists" and drops/recreates the policy.

create table if not exists monte_carlo_settings (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  inputs     jsonb not null default '{}'::jsonb,     -- MonteCarloInputs
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table monte_carlo_settings enable row level security;

drop policy if exists "Users manage own monte carlo settings" on monte_carlo_settings;
create policy "Users manage own monte carlo settings"
  on monte_carlo_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
