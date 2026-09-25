-- Run once in the Supabase SQL editor.
-- Stores the personal rules and confluence library used by the trade logger.

alter table public.profiles
  add column if not exists discipline_rules text,
  add column if not exists confluence_options text;
