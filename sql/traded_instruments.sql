-- Run once in the Supabase SQL editor.
-- The markets a trader logs (set on the Profile page): one symbol for a
-- single-market trader, several for someone trading a basket of pairs or
-- contracts. The trade and analysis forms offer only these.
--
-- The three preference columns below were added by hand earlier and never made
-- it into a migration; "if not exists" makes this safe either way.

alter table public.profiles
  add column if not exists preferred_instrument text,
  add column if not exists preferred_session text,
  add column if not exists timezone text,
  add column if not exists traded_instruments text[] not null default '{}';

-- Seed from the old single preference, so nobody starts from an empty list.
update public.profiles
set traded_instruments = array[upper(preferred_instrument)]
where cardinality(traded_instruments) = 0
  and coalesce(trim(preferred_instrument), '') <> ''
  and preferred_instrument <> 'Other';
