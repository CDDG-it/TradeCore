import { NextResponse } from "next/server";
import { cached } from "@/lib/gmi/cache";
import { fetchGlobalYields, type GlobalYield } from "@/lib/gmi/global-yields";
import type { DataEnvelope } from "@/lib/gmi/types";

// Global 10Y government bond yields (FRED / OECD, monthly). Cached 6h — these
// series update monthly, so nothing is gained by fetching more often.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const TTL_MS = 6 * 60 * 60_000;

export async function GET() {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    const env: DataEnvelope<GlobalYield[]> = {
      data: null, source: "FRED · OECD", freshness: "monthly", asOf: null,
      fetchedAt: new Date().toISOString(), status: "unavailable", error: "FRED_API_KEY not configured",
    };
    return NextResponse.json(env);
  }
  try {
    const { value, storedAt, stale } = await cached("gmi:global-yields", TTL_MS, () => fetchGlobalYields(apiKey));
    const env: DataEnvelope<GlobalYield[]> = {
      data: value, source: "FRED · OECD", freshness: "monthly",
      asOf: value.reduce<string | null>((a, y) => (y.asOf && (!a || y.asOf > a) ? y.asOf : a), null),
      fetchedAt: new Date(storedAt).toISOString(), status: stale ? "stale" : "ok",
    };
    return NextResponse.json(env);
  } catch (err) {
    const env: DataEnvelope<GlobalYield[]> = {
      data: null, source: "FRED · OECD", freshness: "monthly", asOf: null,
      fetchedAt: new Date().toISOString(), status: "unavailable",
      error: err instanceof Error ? err.message : "unknown",
    };
    return NextResponse.json(env);
  }
}
