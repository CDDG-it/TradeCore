import { NextResponse } from "next/server";
import { cached } from "@/lib/gmi/cache";
import { fetchCrossHistory, type HistoryPayload } from "@/lib/gmi/history";
import type { DataEnvelope } from "@/lib/gmi/types";

// Date-aligned daily closes for the cross-asset set (Yahoo). Used for normalised
// performance and the correlation matrix. Cached per range.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const ALLOWED = new Set(["1mo", "3mo", "6mo", "1y"]);
const TTL_MS = 30 * 60_000;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") ?? "3mo";
  const safeRange = ALLOWED.has(range) ? range : "3mo";
  try {
    const { value, storedAt, stale } = await cached(`gmi:history:${safeRange}`, TTL_MS, () => fetchCrossHistory(safeRange));
    const env: DataEnvelope<HistoryPayload> = {
      data: value, source: "Yahoo Finance", freshness: "daily",
      asOf: value.dates[value.dates.length - 1] ?? null,
      fetchedAt: new Date(storedAt).toISOString(), status: stale ? "stale" : "ok",
    };
    return NextResponse.json(env);
  } catch (err) {
    const env: DataEnvelope<HistoryPayload> = {
      data: null, source: "Yahoo Finance", freshness: "daily", asOf: null,
      fetchedAt: new Date().toISOString(), status: "unavailable",
      error: err instanceof Error ? err.message : "unknown",
    };
    return NextResponse.json(env);
  }
}
