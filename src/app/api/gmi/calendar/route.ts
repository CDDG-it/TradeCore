import { NextResponse } from "next/server";
import { cached } from "@/lib/gmi/cache";
import { fetchCalendar, type CalendarEntry } from "@/lib/gmi/calendar";
import type { DataEnvelope } from "@/lib/gmi/types";

// Recent US economic releases (actual + prior) from FRED. Consensus is not
// available on the free tier and is returned as null.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const TTL_MS = 30 * 60_000;

export async function GET() {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    const env: DataEnvelope<CalendarEntry[]> = {
      data: null, source: "FRED", freshness: "daily", asOf: null,
      fetchedAt: new Date().toISOString(), status: "unavailable", error: "FRED_API_KEY not configured",
    };
    return NextResponse.json(env);
  }
  try {
    const { value, storedAt, stale } = await cached("gmi:calendar", TTL_MS, () => fetchCalendar(apiKey));
    const env: DataEnvelope<CalendarEntry[]> = {
      data: value, source: "FRED", freshness: "daily",
      asOf: value.find((e) => e.referenceDate)?.referenceDate ?? null,
      fetchedAt: new Date(storedAt).toISOString(), status: stale ? "stale" : "ok",
    };
    return NextResponse.json(env);
  } catch (err) {
    const env: DataEnvelope<CalendarEntry[]> = {
      data: null, source: "FRED", freshness: "daily", asOf: null,
      fetchedAt: new Date().toISOString(), status: "unavailable",
      error: err instanceof Error ? err.message : "unknown",
    };
    return NextResponse.json(env);
  }
}
