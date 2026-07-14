-- Adds the trade exit time (and back-fills the entry-time / quality columns in
-- case they were never added to the trades table). Run once in the Supabase
-- SQL editor. Safe to re-run — every statement is idempotent.

alter table trades add column if not exists execution_time text;      -- entry "09:32"
alter table trades add column if not exists execution_end_time text;  -- exit  "10:14"
alter table trades add column if not exists execution_quality text;   -- 'good' | 'bad'
