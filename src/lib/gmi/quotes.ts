/**
 * Quotes provider — Yahoo Finance (free, no key, ~15-min delayed).
 *
 * One catalogue drives the ticker header, the Overview pulse cards, the Futures
 * grid, FX, volatility and the cross-asset tools. Fetched server-side (Yahoo
 * blocks browser CORS) and cached briefly so polling clients don't multiply the
 * upstream load. Delayed data is always labelled delayed — never "realtime".
 */
import { fetchJson } from "./cache";
import type { Quote } from "./types";

export interface Instrument {
  yahoo: string;
  symbol: string;
  label: string;
  kind: Quote["kind"];
  unit?: string;
}

/** The full instrument universe, grouped by role. Order matters for display. */
export const INSTRUMENTS: Instrument[] = [
  // Equity-index futures
  { yahoo: "NQ=F", symbol: "NQ", label: "Nasdaq 100 E-mini", kind: "future" },
  { yahoo: "ES=F", symbol: "ES", label: "S&P 500 E-mini", kind: "future" },
  { yahoo: "YM=F", symbol: "YM", label: "Dow E-mini", kind: "future" },
  { yahoo: "RTY=F", symbol: "RTY", label: "Russell 2000 E-mini", kind: "future" },
  // Commodities
  { yahoo: "GC=F", symbol: "GC", label: "Gold", kind: "commodity" },
  { yahoo: "SI=F", symbol: "SI", label: "Silver", kind: "commodity" },
  { yahoo: "CL=F", symbol: "CL", label: "Crude Oil (WTI)", kind: "commodity" },
  { yahoo: "NG=F", symbol: "NG", label: "Natural Gas", kind: "commodity" },
  // Volatility
  { yahoo: "^VIX", symbol: "VIX", label: "CBOE Volatility Index", kind: "vol" },
  { yahoo: "^VIX1D", symbol: "VIX1D", label: "1-Day Volatility", kind: "vol" },
  { yahoo: "^VVIX", symbol: "VVIX", label: "Vol of Vol", kind: "vol" },
  // Rates (quoted as yields, in %)
  { yahoo: "^IRX", symbol: "US3M", label: "US 3-Month", kind: "rate", unit: "%" },
  { yahoo: "^FVX", symbol: "US5Y", label: "US 5-Year", kind: "rate", unit: "%" },
  { yahoo: "^TNX", symbol: "US10Y", label: "US 10-Year", kind: "rate", unit: "%" },
  { yahoo: "^TYX", symbol: "US30Y", label: "US 30-Year", kind: "rate", unit: "%" },
  // Dollar + FX
  { yahoo: "DX-Y.NYB", symbol: "DXY", label: "US Dollar Index", kind: "fx" },
  { yahoo: "EURUSD=X", symbol: "EURUSD", label: "Euro / Dollar", kind: "fx" },
  { yahoo: "USDJPY=X", symbol: "USDJPY", label: "Dollar / Yen", kind: "fx" },
  { yahoo: "GBPUSD=X", symbol: "GBPUSD", label: "Pound / Dollar", kind: "fx" },
  { yahoo: "AUDUSD=X", symbol: "AUDUSD", label: "Aussie / Dollar", kind: "fx" },
  { yahoo: "USDCAD=X", symbol: "USDCAD", label: "Dollar / Loonie", kind: "fx" },
  { yahoo: "USDCHF=X", symbol: "USDCHF", label: "Dollar / Franc", kind: "fx" },
  { yahoo: "CNH=X", symbol: "USDCNH", label: "Dollar / Offshore Yuan", kind: "fx" },
  // Crypto (cross-asset context)
  { yahoo: "BTC-USD", symbol: "BTC", label: "Bitcoin", kind: "crypto" },
];

const BY_SYMBOL = new Map(INSTRUMENTS.map((i) => [i.symbol, i]));
export const instrumentBySymbol = (s: string) => BY_SYMBOL.get(s) ?? null;

interface YahooResult {
  meta?: {
    regularMarketPrice?: number;
    chartPreviousClose?: number;
    previousClose?: number;
    regularMarketDayHigh?: number;
    regularMarketDayLow?: number;
    regularMarketVolume?: number;
    regularMarketTime?: number;
  };
  indicators?: { quote?: { close?: (number | null)[] }[] };
}

async function fetchOne(inst: Instrument, interval: string, range: string): Promise<Quote | null> {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(inst.yahoo)}` +
    `?interval=${interval}&range=${range}`;
  try {
    const json = await fetchJson<{ chart?: { result?: YahooResult[] } }>(url, {
      timeoutMs: 7000,
      retries: 1,
    });
    const result = json?.chart?.result?.[0];
    const meta = result?.meta;
    const price = meta?.regularMarketPrice;
    if (!meta || typeof price !== "number") return null;

    const prev = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - prev;
    const changePct = prev ? (change / prev) * 100 : 0;

    const closes = (result?.indicators?.quote?.[0]?.close ?? []).filter(
      (v): v is number => typeof v === "number"
    );
    const recent = closes.slice(-160);
    const stride = Math.max(1, Math.floor(recent.length / 40));
    const spark = recent.filter((_, i) => i % stride === 0);

    return {
      symbol: inst.symbol,
      label: inst.label,
      kind: inst.kind,
      price,
      change,
      changePct,
      prevClose: prev,
      dayHigh: meta.regularMarketDayHigh ?? null,
      dayLow: meta.regularMarketDayLow ?? null,
      volume: meta.regularMarketVolume ?? null,
      spark,
      unit: inst.unit ?? "",
      asOf: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : null,
    };
  } catch {
    return null;
  }
}

/** Fetch every instrument (intraday sparkline). Missing symbols are dropped, not faked. */
export async function fetchAllQuotes(): Promise<Quote[]> {
  const results = await Promise.all(INSTRUMENTS.map((i) => fetchOne(i, "5m", "2d")));
  return results.filter((q): q is Quote => q !== null);
}

/** Fetch a single instrument at a chosen timeframe, for the detail panel/chart. */
export async function fetchQuoteSeries(symbol: string, interval: string, range: string): Promise<Quote | null> {
  const inst = instrumentBySymbol(symbol);
  if (!inst) return null;
  return fetchOne(inst, interval, range);
}
