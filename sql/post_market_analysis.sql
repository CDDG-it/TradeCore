-- Post-market analysis for the "Best trade of the day" feature.
-- Run this once in the Supabase SQL editor. It adds a single column to the
-- existing best_trade_of_day table, so the MC Trade Therapist "Daily" tab can
-- store a full post-market recap of the session alongside the best trade.
--
-- Safe to re-run: the column is only added if it does not exist yet.

alter table best_trade_of_day
  add column if not exists post_market_analysis text not null default '';
