import { NextResponse } from "next/server";

// Live futures quotes for the dashboard price box. Fetched server-side to avoid
// browser CORS against Yahoo, with a last-good cache so a transient upstream
// hiccup doesn't blank the box.
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Quote = { symbol: string; label: string; price: number; change: number; changePct: number; spark: number[] };

// Yahoo Finance continuous futures symbols → the labels traders use here.
const SYMBOLS: { yahoo: string; symbol: string; label: string }[] = [
  { yahoo: "ES=F", symbol: "ES", label: "S&P 500 E-mini" },
  { yahoo: "NQ=F", symbol: "NQ", label: "Nasdaq 100 E-mini" },
  { yahoo: "GC=F", symbol: "GOLD", label: "Gold" },
];

let _lastGood: Quote[] | null = null;

async function fetchQuote(y: { yahoo: string; symbol: string; label: string }): Promise<Quote | null> {
  // 5-minute bars over the last 2 days give both a fresh last price and enough
  // points for an intraday sparkline.
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(y.yahoo)}?interval=5m&range=2d`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; TradingMC/1.0)" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  const meta = result?.meta;
  if (!meta) return null;
  const price: number = meta.regularMarketPrice;
  const prev: number = meta.chartPreviousClose ?? meta.previousClose ?? price;
  if (typeof price !== "number") return null;
  const change = price - prev;
  const changePct = prev ? (change / prev) * 100 : 0;

  // Downsample the intraday closes to ~40 points for a lightweight sparkline.
  const closes: number[] = (result?.indicators?.quote?.[0]?.close ?? []).filter(
    (v: number | null): v is number => typeof v === "number"
  );
  const recent = closes.slice(-160);
  const stride = Math.max(1, Math.floor(recent.length / 40));
  const spark = recent.filter((_, i) => i % stride === 0);

  return { symbol: y.symbol, label: y.label, price, change, changePct, spark };
}

export async function GET() {
  try {
    const results = await Promise.all(SYMBOLS.map(fetchQuote));
    const prices = results.filter((q): q is Quote => q !== null);
    if (prices.length === SYMBOLS.length) {
      _lastGood = prices;
      return NextResponse.json({ prices, live: true });
    }
    // Partial failure — merge fresh values over the last good snapshot.
    if (_lastGood) {
      const merged = _lastGood.map((old) => prices.find((p) => p.symbol === old.symbol) ?? old);
      return NextResponse.json({ prices: merged, live: true, stale: true });
    }
    return NextResponse.json({ prices, live: prices.length > 0 });
  } catch (err) {
    console.error("[prices] fetch failed:", err);
    if (_lastGood) return NextResponse.json({ prices: _lastGood, live: true, stale: true });
    return NextResponse.json({ prices: [], live: false, error: err instanceof Error ? err.message : "unknown" });
  }
}
