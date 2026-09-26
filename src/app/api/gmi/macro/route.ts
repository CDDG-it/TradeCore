import { NextResponse } from "next/server";
import { rateLimit, tooManyRequests } from "@/lib/security/rate-limit";
import { NO_STORE, publicCache, upstreamFailure } from "@/lib/security/public-api";
import { cached } from "@/lib/gmi/cache";
import { fetchMacro } from "@/lib/gmi/macro";
import type { DataEnvelope, MacroSeries } from "@/lib/gmi/types";

// FRED macro series (rates, real yields, spreads, Fed & liquidity, money).
// Rates are daily and liquidity weekly, so a 10-minute cache is ample and keeps
// us well inside FRED's rate limits.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const TTL_MS = 10 * 60_000;

// The same series for every reader, so the shared cache carries the desk and
// FRED sees one call per window instead of one per instance.
const CACHE = publicCache(600, 3600);

export async function GET(req: Request) {
  const limit = rateLimit(req, "gmi:macro", 60, 60_000);
  if (!limit.ok) return tooManyRequests(limit);

  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    const env: DataEnvelope<MacroSeries[]> = {
      data: null,
      source: "FRED",
      freshness: "daily",
      asOf: null,
      fetchedAt: new Date().toISOString(),
      status: "unavailable",
      error: "FRED_API_KEY not configured",
    };
    return NextResponse.json(env, { headers: { "Cache-Control": NO_STORE } });
  }

  try {
    const { value, storedAt, stale } = await cached("gmi:macro", TTL_MS, () => fetchMacro(apiKey));
    const asOf = value.reduce<string | null>((a, s) => (s.asOf && (!a || s.asOf > a) ? s.asOf : a), null);
    const env: DataEnvelope<MacroSeries[]> = {
      data: value,
      source: "FRED",
      freshness: "daily",
      asOf,
      fetchedAt: new Date(storedAt).toISOString(),
      status: stale ? "stale" : "ok",
    };
    // A stale answer is the last good one, not a fresh one: do not let the
    // shared cache hold it for the full window.
    return NextResponse.json(env, { headers: { "Cache-Control": stale ? NO_STORE : CACHE } });
  } catch (err) {
    const env: DataEnvelope<MacroSeries[]> = {
      data: null,
      source: "FRED",
      freshness: "daily",
      asOf: null,
      fetchedAt: new Date().toISOString(),
      status: "unavailable",
      error: upstreamFailure("gmi:macro", err),
    };
    return NextResponse.json(env, { headers: { "Cache-Control": NO_STORE } });
  }
}
