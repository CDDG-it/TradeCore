/**
 * Earnings provider — Twelve Data `/earnings` (per symbol, EPS only on free tier).
 *
 * The free tier allows 8 requests/minute and only single-symbol earnings calls,
 * so we cache each symbol for 12h and refresh at most a handful per request,
 * cycling through the universe across polls. Revenue estimates/actuals are not
 * available on the free tier — those fields stay null and the UI shows them as
 * unavailable rather than inventing numbers.
 */
import { cached, fetchJson } from "./cache";
import type { EarningsRow } from "./types";

/** Index-heavyweight universe. Objective selection by index weight, not a call. */
export const EARNINGS_UNIVERSE: { symbol: string; name: string }[] = [
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "META", name: "Meta Platforms" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "AVGO", name: "Broadcom" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "AMD", name: "Adv. Micro Devices" },
  { symbol: "NFLX", name: "Netflix" },
];

const SYMBOL_TTL_MS = 12 * 60 * 60_000; // 12h — earnings change only around reports
const MAX_REFRESH_PER_CALL = 5; // stay under the 8 req/min free-tier limit

interface TDEarning {
  date: string;
  time?: string;
  eps_estimate?: number | null;
  eps_actual?: number | null;
  difference?: number | null;
  surprise_prc?: number | null;
}
interface TDResponse {
  meta?: { symbol?: string; name?: string };
  earnings?: TDEarning[];
  status?: string;
  code?: number;
}

async function fetchSymbolEarnings(symbol: string, name: string, apiKey: string): Promise<EarningsRow[]> {
  const url = `https://api.twelvedata.com/earnings?symbol=${symbol}&apikey=${apiKey}&outputsize=6`;
  const json = await fetchJson<TDResponse>(url, { timeoutMs: 8000, retries: 1 });
  if (json.status === "error" || !json.earnings) throw new Error(json?.["code"] === 429 ? "rate-limited" : "no data");
  return json.earnings.map((e) => ({
    symbol,
    name: json.meta?.name || name,
    date: e.date,
    time: e.time || null,
    epsEstimate: e.eps_estimate ?? null,
    epsActual: e.eps_actual ?? null,
    epsSurprisePct: e.surprise_prc ?? null,
    revenueEstimate: null, // not available on free tier
    revenueActual: null,
    revenueSurprisePct: null,
  }));
}

export interface EarningsResult {
  rows: EarningsRow[];
  /** Symbols we could not populate this pass (rate limit / no data). */
  missing: string[];
}

/**
 * Return the latest known earnings per universe symbol. Uses per-symbol caching;
 * only a few uncached symbols are refreshed per call so we never breach the
 * free-tier minute limit. Partial results are expected and surfaced honestly.
 */
export async function fetchEarnings(apiKey: string): Promise<EarningsResult> {
  const rows: EarningsRow[] = [];
  const missing: string[] = [];
  let refreshed = 0;

  for (const { symbol, name } of EARNINGS_UNIVERSE) {
    try {
      // Only allow a live fetch for the first few misses this call.
      const allowFetch = refreshed < MAX_REFRESH_PER_CALL;
      let didFetch = false;
      const { value } = await cached(`gmi:earn:${symbol}`, SYMBOL_TTL_MS, async () => {
        if (!allowFetch) throw new Error("deferred");
        didFetch = true;
        return fetchSymbolEarnings(symbol, name, apiKey);
      });
      if (didFetch) refreshed++;
      // Most recent report first.
      const sorted = [...value].sort((a, b) => b.date.localeCompare(a.date));
      if (sorted[0]) rows.push(sorted[0]);
    } catch {
      missing.push(symbol);
    }
  }
  if (rows.length === 0) throw new Error("no earnings data");
  rows.sort((a, b) => b.date.localeCompare(a.date));
  return { rows, missing };
}
