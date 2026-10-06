-- Run in the Supabase SQL editor for the guided Post Market review.
-- Existing rows keep their content and receive NULL for review_step.
alter table best_trade_of_day add column if not exists review_step text;
alter table best_trade_of_day drop constraint if exists best_trade_review_step_valid;
alter table best_trade_of_day add constraint best_trade_review_step_valid
  check (review_step is null or review_step in ('verdict', 'why', 'market', 'screenshots', 'r', 'complete'));
