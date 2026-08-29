import { NextResponse } from "next/server";
import { cached } from "@/lib/gmi/cache";
import { fetchMacro } from "@/lib/gmi/macro";
import type { DataEnvelope, MacroSeries } from "@/lib/gmi/types";

// FRED macro series (rates, real yields, spreads, Fed & liquidity, money).
// Rates are daily and liquidity weekly, so a 10-minute cache is ample and keeps
// us well inside FRED's rate limits.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const TTL_MS = 10 * 60_000;

export async function GET() {
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
    return NextResponse.json(env);
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
    return NextResponse.json(env);
  } catch (err) {
    const env: DataEnvelope<MacroSeries[]> = {
      data: null,
      source: "FRED",
      freshness: "daily",
      asOf: null,
      fetchedAt: new Date().toISOString(),
      status: "unavailable",
      error: err instanceof Error ? err.message : "unknown",
    };
    return NextResponse.json(env);
  }
}
