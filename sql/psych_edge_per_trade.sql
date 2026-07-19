-- Psychological Edge — reflections are now one deep 5R walkthrough per
-- bad-execution trade, not one summary per day. Re-key the table on trade_id.
-- Safe to run more than once.

-- 1) Drop the old one-per-day uniqueness.
alter table psych_edge_sessions drop constraint if exists psych_edge_sessions_user_id_date_key;

-- 2) A reflection now always belongs to a trade — clear any legacy day-only rows.
delete from psych_edge_sessions where trade_id is null;

-- 3) Collapse any duplicates that share a trade_id (keep the most recently updated).
delete from psych_edge_sessions a
  using psych_edge_sessions b
  where a.trade_id = b.trade_id
    and a.user_id = b.user_id
    and (a.updated_at < b.updated_at
         or (a.updated_at = b.updated_at and a.ctid < b.ctid));

-- 4) One reflection per trade, per user.
alter table psych_edge_sessions drop constraint if exists psych_edge_sessions_user_id_trade_id_key;
alter table psych_edge_sessions add constraint psych_edge_sessions_user_id_trade_id_key unique (user_id, trade_id);

-- 5) When the trade is deleted, its reflection goes with it.
alter table psych_edge_sessions drop constraint if exists psych_edge_sessions_trade_id_fkey;
alter table psych_edge_sessions add constraint psych_edge_sessions_trade_id_fkey
  foreign key (trade_id) references trades(id) on delete cascade;
