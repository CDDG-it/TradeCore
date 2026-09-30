-- Pull the old if/then commitments back out of standing_rules.
--
-- daily_commitments_and_rule_checks.sql folded every active row of the legacy
-- `commitments` table into standing_rules as "If <trigger>, then <action>".
-- That was wrong: a commitment is a promise made for one morning and lives on
-- the pre-market exercise, while a standing rule holds over every trade. This
-- file removes those rows and keeps the adherence history by moving it to the
-- commitment side.
--
-- Run once in the Supabase SQL editor. Safe to re-run: once the rows are gone
-- there is nothing left to match.
--
-- BEFORE RUNNING, look at what it will touch:
--
--   select r.id, r.text, r.active, r.active_from
--   from standing_rules r
--   join commitments c
--     on c.user_id = r.user_id
--    and lower(trim(r.text)) = lower(trim('If ' || c.trigger_text || ', then ' || c.action_text))
--   order by r.sort_order;
--
-- Anything listed there is removed. A rule you typed yourself is only caught if
-- its text is character-for-character one of those sentences.

begin;

create temporary table migrated_commitment_rules on commit drop as
select distinct r.id
from standing_rules r
join commitments c
  on c.user_id = r.user_id
 and lower(trim(r.text)) = lower(trim('If ' || c.trigger_text || ', then ' || c.action_text));

-- Adherence already recorded against these rows is real history, so it moves to
-- the commitment side rather than being deleted. The snapshot trigger pins
-- source_type on update, so it stands down for this one statement.
alter table trade_rule_checks disable trigger trade_rule_checks_preserve_snapshot;
update trade_rule_checks
set source_type = 'commitment', updated_at = now()
where source_type = 'standing_rule'
  and source_id in (select id from migrated_commitment_rules);
alter table trade_rule_checks enable trigger trade_rule_checks_preserve_snapshot;

delete from standing_rules where id in (select id from migrated_commitment_rules);

commit;
