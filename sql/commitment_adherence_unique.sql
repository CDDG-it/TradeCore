-- One adherence check per commitment per trade.
--
-- The Commitments panel raises a check when a commitment's pattern re-fires on
-- a later trade, and skips any pair it already has. That guard is client-side,
-- so two sessions loading at the same time could each raise the same check.
-- This index makes the rule the database's job instead.
--
-- Postgres treats NULLs as distinct in a unique index, so commitments checked
-- without a trade anchor (trade_id null) are unaffected.
--
-- Safe to re-run.

create unique index if not exists commitment_adherence_unique
  on commitment_adherence_log (commitment_id, trade_id);
