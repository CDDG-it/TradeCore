import { NextResponse } from "next/server";
import { cached } from "@/lib/gmi/cache";
import { fetchAllQuotes, fetchQuoteSeries } from "@/lib/gmi/quotes";
import type { DataEnvelope, Quote } from "@/lib/gmi/types";

// Delayed market quotes from Yahoo. Server-side (CORS) with a short TTL cache so
// many polling clients collapse onto one upstream call. Never mock — on failure
// the cache serves the last real snapshot, flagged stale.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const TTL_MS = 30_000; // quotes are ~15-min delayed; 30s polling is plenty

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");
  const interval = searchParams.get("interval") ?? "5m";
  const range = searchParams.get("range") ?? "2d";

  // Single-instrument detail (chart timeframe) path.
  if (symbol) {
    try {
      const { value, storedAt, stale } = await cached(
        `gmi:quote:${symbol}:${interval}:${range}`,
        TTL_MS,
        async () => {
          const q = await fetchQuoteSeries(symbol, interval, range);
          if (!q) throw new Error("no data");
          return q;
        }
      );
      const env: DataEnvelope<Quote> = {
        data: value,
        source: "Yahoo Finance",
        freshness: "delayed",
        asOf: value.asOf,
        fetchedAt: new Date(storedAt).toISOString(),
        status: stale ? "stale" : "ok",
      };
      return NextResponse.json(env);
    } catch (err) {
      const env: DataEnvelope<Quote> = {
        data: null,
        source: "Yahoo Finance",
        freshness: "delayed",
        asOf: null,
        fetchedAt: new Date().toISOString(),
        status: "unavailable",
        error: err instanceof Error ? err.message : "unknown",
      };
      return NextResponse.json(env);
    }
  }

  // Full universe path (ticker + pulse + grids).
  try {
    const { value, storedAt, stale } = await cached("gmi:quotes:all", TTL_MS, async () => {
      const quotes = await fetchAllQuotes();
      if (quotes.length === 0) throw new Error("no data");
      return quotes;
    });
    const env: DataEnvelope<Quote[]> = {
      data: value,
      source: "Yahoo Finance",
      freshness: "delayed",
      asOf: value.reduce<string | null>((a, q) => (q.asOf && (!a || q.asOf > a) ? q.asOf : a), null),
      fetchedAt: new Date(storedAt).toISOString(),
      status: stale ? "stale" : "ok",
    };
    return NextResponse.json(env);
  } catch (err) {
    const env: DataEnvelope<Quote[]> = {
      data: null,
      source: "Yahoo Finance",
      freshness: "delayed",
      asOf: null,
      fetchedAt: new Date().toISOString(),
      status: "unavailable",
      error: err instanceof Error ? err.message : "unknown",
    };
    return NextResponse.json(env);
  }
}
