import { NextResponse } from "next/server";
import { rateLimit, tooManyRequests } from "@/lib/security/rate-limit";
import { NO_STORE, publicCache, upstreamFailure } from "@/lib/security/public-api";
import { cached } from "@/lib/gmi/cache";
import { fetchCrossHistory, type HistoryPayload } from "@/lib/gmi/history";
import type { DataEnvelope } from "@/lib/gmi/types";

// Date-aligned daily closes for the cross-asset set (Yahoo). Used for normalised
// performance and the correlation matrix. Cached per range.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const ALLOWED = new Set(["1mo", "3mo", "6mo", "1y"]);
const TTL_MS = 30 * 60_000;

// Daily closes: half an hour in the shared cache is well inside one bar.
const CACHE = publicCache(1_800, 7_200);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = rateLimit(req, "gmi:history", 60, 60_000);
  if (!limit.ok) return tooManyRequests(limit);

  const range = searchParams.get("range") ?? "3mo";
  const safeRange = ALLOWED.has(range) ? range : "3mo";
  try {
    const { value, storedAt, stale } = await cached(`gmi:history:${safeRange}`, TTL_MS, () => fetchCrossHistory(safeRange));
    const env: DataEnvelope<HistoryPayload> = {
      data: value, source: "Yahoo Finance", freshness: "daily",
      asOf: value.dates[value.dates.length - 1] ?? null,
      fetchedAt: new Date(storedAt).toISOString(), status: stale ? "stale" : "ok",
    };
    return NextResponse.json(env, { headers: { "Cache-Control": stale ? NO_STORE : CACHE } });
  } catch (err) {
    const env: DataEnvelope<HistoryPayload> = {
      data: null, source: "Yahoo Finance", freshness: "daily", asOf: null,
      fetchedAt: new Date().toISOString(), status: "unavailable",
      error: upstreamFailure("gmi:history", err),
    };
    return NextResponse.json(env, { headers: { "Cache-Control": NO_STORE } });
  }
}
