import { NextResponse } from "next/server";
import { rateLimit, tooManyRequests } from "@/lib/security/rate-limit";
import { NO_STORE, publicCache, upstreamFailure } from "@/lib/security/public-api";
import { cached } from "@/lib/gmi/cache";
import { fetchAllQuotes, fetchQuoteSeries } from "@/lib/gmi/quotes";
import type { DataEnvelope, Quote } from "@/lib/gmi/types";

// Delayed market quotes from Yahoo. Server-side (CORS) with a short TTL cache so
// many polling clients collapse onto one upstream call. Never mock: on failure
// the cache serves the last real snapshot, flagged stale.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const TTL_MS = 30_000; // quotes are ~15-min delayed; 30s polling is plenty

// The same delayed quotes for every reader: the shared cache collapses a
// whole desk of pollers onto one upstream call per window.
const CACHE = publicCache(30, 120);

// The route is public (it sits in front of a login-free API prefix), so what
// reaches Yahoo, and what gets a cache slot, is only ever one of these: the
// chart timeframes the futures tab offers. Anything else is answered as
// unavailable without an upstream call.
const INTERVALS = new Set(["5m", "15m", "60m", "1d"]);
const RANGES = new Set(["2d", "5d", "1mo", "3mo", "1y"]);

export async function GET(req: Request) {
  // The futures tab polls this and the ticker reads it too, so the ceiling has
  // to sit above a busy page while still stopping a script.
  const limit = rateLimit(req, "gmi:quotes", 120, 60_000);
  if (!limit.ok) return tooManyRequests(limit);

  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");
  const interval = searchParams.get("interval") ?? "5m";
  const range = searchParams.get("range") ?? "2d";

  // Single-instrument detail (chart timeframe) path.
  if (symbol) {
    if (!INTERVALS.has(interval) || !RANGES.has(range) || !/^[A-Z0-9]{1,8}$/.test(symbol)) {
      const env: DataEnvelope<Quote> = {
        data: null, source: "Yahoo Finance", freshness: "delayed", asOf: null,
        fetchedAt: new Date().toISOString(), status: "unavailable", error: "invalid request",
      };
      return NextResponse.json(env, { status: 400, headers: { "Cache-Control": NO_STORE } });
    }
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
      return NextResponse.json(env, { headers: { "Cache-Control": stale ? NO_STORE : CACHE } });
    } catch (err) {
      const env: DataEnvelope<Quote> = {
        data: null,
        source: "Yahoo Finance",
        freshness: "delayed",
        asOf: null,
        fetchedAt: new Date().toISOString(),
        status: "unavailable",
        error: upstreamFailure("gmi:quotes", err),
      };
      return NextResponse.json(env, { headers: { "Cache-Control": NO_STORE } });
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
    return NextResponse.json(env, { headers: { "Cache-Control": stale ? NO_STORE : CACHE } });
  } catch (err) {
    const env: DataEnvelope<Quote[]> = {
      data: null,
      source: "Yahoo Finance",
      freshness: "delayed",
      asOf: null,
      fetchedAt: new Date().toISOString(),
      status: "unavailable",
      error: upstreamFailure("gmi:quotes", err),
    };
    return NextResponse.json(env, { headers: { "Cache-Control": NO_STORE } });
  }
}
