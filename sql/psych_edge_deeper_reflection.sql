-- Psychological Edge — deeper reflection. Each bad-execution trade's 5R
-- walkthrough now asks the trader to spell out, in their own words, WHY it was
-- a mistake (what it cost) and an explicit commitment not to repeat it — both
-- required before a reflection can be committed.
-- Safe to run more than once.

alter table psych_edge_sessions add column if not exists mistake_cost         text;
alter table psych_edge_sessions add column if not exists commitment_statement text;
