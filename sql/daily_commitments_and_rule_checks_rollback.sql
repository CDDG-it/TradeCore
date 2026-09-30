begin;
drop trigger if exists trades_sync_rule_checks on trades;
drop function if exists sync_trade_rule_checks();
drop trigger if exists trade_rule_checks_preserve_snapshot on trade_rule_checks;
drop function if exists preserve_trade_rule_check_snapshot();
update profiles p set discipline_rules = rules.text
from (select user_id, string_agg(text, E'\n' order by sort_order) as text from standing_rules where active group by user_id) rules
where p.id = rules.user_id;
-- New tables and additive columns deliberately remain as a dormant archive.
-- This makes the rollback operationally reversible without deleting user work.
commit;
