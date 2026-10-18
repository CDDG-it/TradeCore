-- Pre-market exercises: allow the expanded exercise library (14 types).
-- Run once in the Supabase SQL editor. Safe to re-run.
begin;

alter table pre_market_exercise drop constraint if exists pre_market_exercise_type_check;
alter table pre_market_exercise add constraint pre_market_exercise_type_check check (exercise_type in (
  'loss_win_review','mental_contrasting','pre_mortem','mental_rehearsal','rules_recall','state_check','scenario_plan',
  'post_loss_reset',
  'calm_plan','impulse_gate','follow_through','thrill_outlet','idea_parking','evidence_file'
));

commit;
