import type { AccountSnapshot, BrokerAccountsResponse, BrokerConnectionView } from "./types";

/**
 * Sample live accounts for the development preview at /preview/accounts.
 *
 * Covers the states the panel has to survive, which are otherwise only
 * reachable by connecting a real broker: two prop firms under two logins, a
 * winning and a losing day, an account that has gone quiet, and a login whose
 * password Tradovate rejected. Balances drift with the clock so the polling,
 * the freshness fade and the count-ups can be watched.
 */

const connection = (
  id: string,
  label: string,
  extra: Partial<BrokerConnectionView> = {}
): BrokerConnectionView => ({
  id,
  broker: "tradovate",
  auth_method: "oauth",
  label,
  username_hint: "authorised at Tradovate",
  state: "connected",
  last_error: null,
  last_sync_at: new Date().toISOString(),
  created_at: new Date(Date.now() - 86_400_000).toISOString(),
  ...extra,
});

export function sampleBrokerData(now = Date.now()): BrokerAccountsResponse {
  const t = now / 1000;
  const drift = (seed: number, size: number) => Math.round(Math.sin(t / 40 + seed) * size * 100) / 100;
  const fresh = new Date(now).toISOString();

  const account = (
    id: string,
    connectionId: string,
    label: string,
    base: number,
    seed: number,
    over: Partial<AccountSnapshot> = {}
  ): AccountSnapshot => {
    const open_pl = drift(seed, base / 240);
    const day_pl = Math.round((base / 90 + open_pl) * 100) / 100;
    const balance = Math.round((base + base / 90) * 100) / 100;
    return {
      account_id: id,
      connection_id: connectionId,
      label,
      environment: "demo",
      external_account_id: 900000 + seed,
      currency: "USD",
      balance,
      equity: Math.round((balance + open_pl) * 100) / 100,
      open_pl,
      day_pl,
      open_positions_count: seed % 3,
      connection_state: "connected",
      last_update_ts: fresh,
      error: null,
      ...over,
    };
  };

  return {
    setup: null,
    oauth_available: true,
    connections: [
      connection("c1", "MyFundedFutures"),
      connection("c2", "Lucid Trading"),
      connection("c3", "Apex", {
        state: "auth_failed",
        last_error: "Tradovate rejected the authorisation. Reconnect this login.",
        last_sync_at: new Date(now - 3 * 3_600_000).toISOString(),
      }),
    ],
    accounts: [
      account("a1", "c1", "MFF-100K-01", 100_000, 1),
      account("a2", "c1", "MFF-50K-02", 50_000, 2),
      account("a3", "c2", "LUCID-150K-01", 150_000, 3),
      // Gone quiet: the panel should fade this one and keep the last figures.
      account("a4", "c2", "LUCID-50K-02", 50_000, 4, {
        last_update_ts: new Date(now - 90_000).toISOString(),
      }),
      // Never loaded: no numbers at all, and it must not read as zero.
      account("a5", "c3", "APEX-100K-01", 100_000, 5, {
        balance: null,
        equity: null,
        open_pl: null,
        day_pl: null,
        open_positions_count: null,
        connection_state: "error",
        last_update_ts: null,
        error: "Reconnect this Tradovate login.",
      }),
    ],
  };
}

/** A believable equity curve for the preview chart: one point per 5 minutes. */
export function sampleHistory(accountId: string, from: string, to: string) {
  const start = Date.parse(from);
  const end = Date.parse(to);
  const step = 5 * 60_000;
  const seed = accountId.charCodeAt(accountId.length - 1);
  // Anchored to the same account's balance in sampleBrokerData, so the curve
  // and the card above it tell the same story.
  const base = sampleBrokerData().accounts.find((a) => a.account_id === accountId)?.balance ?? 100_000;
  const points = [];
  for (let t = start, i = 0; t <= end; t += step, i++) {
    const drift = Math.sin(i / 9 + seed) * (base / 260) + (i * base) / 60_000;
    const equity = Math.round((base + drift) * 100) / 100;
    points.push({ bucket: new Date(t).toISOString(), balance: equity, equity, day_pl: Math.round(drift * 100) / 100 });
  }
  return points;
}
