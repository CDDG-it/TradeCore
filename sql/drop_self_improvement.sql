-- Drop the unused Self-Improvement tables.
--
-- These four features had Supabase tables, types and query functions but were
-- never given a UI, so nothing in the app ever read or wrote them. The code was
-- removed; this file removes the tables themselves.
--
-- DESTRUCTIVE: this permanently deletes any rows these tables hold. It is
-- OPTIONAL — the app runs fine with the tables left in place, they are simply
-- unused. Run it only once you are sure you do not want the data.
--
-- Check first if you are unsure:
--   select count(*) from daily_journals;
--   select count(*) from daily_state_checks;
--   select count(*) from sleep_recovery;
--   select count(*) from personal_standards;

drop table if exists personal_standard_scores;  -- references personal_standards
drop table if exists personal_standards;
drop table if exists sleep_recovery;
drop table if exists daily_state_checks;
drop table if exists daily_journals;
