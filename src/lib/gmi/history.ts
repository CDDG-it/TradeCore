/**
 * Cross-asset daily history — Yahoo Finance.
 *
 * Returns date-aligned daily closes for a fixed cross-asset set so the client
 * can draw normalised performance and a correlation matrix. Correlation is a
 * descriptive statistic of past co-movement — never a signal.
 */
import { fetchJson } from "./cache";

export interface CrossAsset {
  symbol: string;
  label: string;
  yahoo: string;
}

export const CROSS_ASSETS: CrossAsset[] = [
  { symbol: "NQ", label: "Nasdaq 100", yahoo: "NQ=F" },
  { symbol: "ES", label: "S&P 500", yahoo: "ES=F" },
  { symbol: "VIX", label: "VIX", yahoo: "^VIX" },
  { symbol: "DXY", label: "Dollar Index", yahoo: "DX-Y.NYB" },
  { symbol: "US10Y", label: "US 10Y", yahoo: "^TNX" },
  { symbol: "GC", label: "Gold", yahoo: "GC=F" },
  { symbol: "CL", label: "Crude Oil", yahoo: "CL=F" },
  { symbol: "BTC", label: "Bitcoin", yahoo: "BTC-USD" },
  { symbol: "EURUSD", label: "EUR/USD", yahoo: "EURUSD=X" },
  { symbol: "USDJPY", label: "USD/JPY", yahoo: "USDJPY=X" },
];

interface YahooResult {
  timestamp?: number[];
  indicators?: { quote?: { close?: (number | null)[] }[] };
}

async function fetchDaily(a: CrossAsset, range: string): Promise<Map<string, number>> {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(a.yahoo)}?interval=1d&range=${range}`;
  const json = await fetchJson<{ chart?: { result?: YahooResult[] } }>(url, { timeoutMs: 8000, retries: 1 });
  const r = json?.chart?.result?.[0];
  const ts = r?.timestamp ?? [];
  const closes = r?.indicators?.quote?.[0]?.close ?? [];
  const m = new Map<string, number>();
  for (let i = 0; i < ts.length; i++) {
    const v = closes[i];
    if (typeof v === "number" && Number.isFinite(v)) {
      m.set(new Date(ts[i] * 1000).toISOString().slice(0, 10), v);
    }
  }
  return m;
}

export interface HistoryPayload {
  assets: { symbol: string; label: string }[];
  dates: string[];
  /** symbol → close aligned to `dates` (nulls dropped by intersection). */
  closes: Record<string, number[]>;
}

/** Fetch and date-align the cross-asset set over `range` (e.g. 1mo, 3mo, 1y). */
export async function fetchCrossHistory(range: string): Promise<HistoryPayload> {
  const maps = await Promise.all(CROSS_ASSETS.map((a) => fetchDaily(a, range).catch(() => new Map<string, number>())));
  // Keep only dates present for every asset that returned data.
  const usable = CROSS_ASSETS.map((a, i) => ({ a, m: maps[i] })).filter((x) => x.m.size > 5);
  if (usable.length === 0) throw new Error("no history");

  let common: string[] | null = null;
  for (const { m } of usable) {
    const keys = [...m.keys()];
    common = common === null ? keys : common.filter((d) => m.has(d));
  }
  const dates = (common ?? []).sort();
  const closes: Record<string, number[]> = {};
  for (const { a, m } of usable) closes[a.symbol] = dates.map((d) => m.get(d) as number);

  return {
    assets: usable.map(({ a }) => ({ symbol: a.symbol, label: a.label })),
    dates,
    closes,
  };
}
