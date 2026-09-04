import { NextResponse } from "next/server";
import { cached } from "@/lib/gmi/cache";
import { fetchCalendar, fetchCalendarMonth, type CalendarEntry, type CalendarMonth } from "@/lib/gmi/calendar";
import type { DataEnvelope } from "@/lib/gmi/types";

// US economic releases from FRED. Two modes:
//   • no params      — the most recent prints (actual + prior + trend).
//   • ?month=YYYY-MM — the release calendar for that month, FRED's own
//                      schedule, with the print attached where one has landed.
// Consensus is not available on the free tier and is returned as null.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const LATEST_TTL_MS = 30 * 60_000;
const MONTH_TTL_MS = 3 * 60 * 60_000;

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function unavailable<T>(error: string): DataEnvelope<T> {
  return {
    data: null, source: "FRED", freshness: "daily", asOf: null,
    fetchedAt: new Date().toISOString(), status: "unavailable", error,
  };
}

export async function GET(req: Request) {
  const apiKey = process.env.FRED_API_KEY;
  const month = new URL(req.url).searchParams.get("month");

  if (!apiKey) return NextResponse.json(unavailable("FRED_API_KEY not configured"));
  if (month && !MONTH_RE.test(month)) return NextResponse.json(unavailable("invalid month"));

  try {
    if (month) {
      const { value, storedAt, stale } = await cached(
        `gmi:calendar:month:${month}`, MONTH_TTL_MS, () => fetchCalendarMonth(apiKey, month)
      );
      const env: DataEnvelope<CalendarMonth> = {
        data: value, source: "FRED", freshness: "daily",
        asOf: value.events.filter((e) => e.released).at(-1)?.date ?? null,
        fetchedAt: new Date(storedAt).toISOString(), status: stale ? "stale" : "ok",
      };
      return NextResponse.json(env);
    }

    const { value, storedAt, stale } = await cached("gmi:calendar", LATEST_TTL_MS, () => fetchCalendar(apiKey));
    const env: DataEnvelope<CalendarEntry[]> = {
      data: value, source: "FRED", freshness: "daily",
      asOf: value.find((e) => e.referenceDate)?.referenceDate ?? null,
      fetchedAt: new Date(storedAt).toISOString(), status: stale ? "stale" : "ok",
    };
    return NextResponse.json(env);
  } catch (err) {
    return NextResponse.json(unavailable(err instanceof Error ? err.message : "unknown"));
  }
}
