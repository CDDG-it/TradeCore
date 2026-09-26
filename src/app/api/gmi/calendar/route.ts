import { NextResponse } from "next/server";
import { rateLimit, tooManyRequests } from "@/lib/security/rate-limit";
import { NO_STORE, publicCache, upstreamFailure } from "@/lib/security/public-api";
import { cached } from "@/lib/gmi/cache";
import { fetchCalendar, fetchCalendarMonth, type CalendarEntry, type CalendarMonth } from "@/lib/gmi/calendar";
import type { DataEnvelope } from "@/lib/gmi/types";

// US economic releases from FRED. Two modes:
//   • no params:      the most recent prints (actual + prior + trend).
//   • ?month=YYYY-MM: the release calendar for that month, FRED's own
//                     schedule, with the print attached where one has landed.
// Consensus is not available on the free tier and is returned as null.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const LATEST_TTL_MS = 30 * 60_000;
const MONTH_TTL_MS = 3 * 60 * 60_000;

// The latest prints move on release days; a month schedule barely moves at
// all, so it is worth holding much longer in the shared cache.
const LATEST_CACHE = publicCache(1_800, 7_200);
const MONTH_CACHE = publicCache(10_800, 43_200);

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function unavailable<T>(error: string): DataEnvelope<T> {
  return {
    data: null, source: "FRED", freshness: "daily", asOf: null,
    fetchedAt: new Date().toISOString(), status: "unavailable", error,
  };
}

/** Anything unavailable is answered fresh every time, never held by a cache. */
function fail(error: string) {
  return NextResponse.json(unavailable(error), { headers: { "Cache-Control": NO_STORE } });
}

export async function GET(req: Request) {
  // Each distinct month is a fan-out of FRED calls, so this one is worth a
  // tighter ceiling than the single-payload routes.
  const limit = rateLimit(req, "gmi:calendar", 40, 60_000);
  if (!limit.ok) return tooManyRequests(limit);

  const apiKey = process.env.FRED_API_KEY;
  const month = new URL(req.url).searchParams.get("month");

  if (!apiKey) return fail("FRED_API_KEY not configured");
  if (month && !MONTH_RE.test(month)) return fail("invalid month");
  // A schedule is only useful around now. Each distinct month costs a fan-out
  // of FRED calls, so the route is not a free way to page through history.
  if (month) {
    const y = Number(month.slice(0, 4));
    const thisYear = new Date().getUTCFullYear();
    if (y < thisYear - 2 || y > thisYear + 1) return fail("month out of range");
  }

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
      return NextResponse.json(env, { headers: { "Cache-Control": stale ? NO_STORE : MONTH_CACHE } });
    }

    const { value, storedAt, stale } = await cached("gmi:calendar", LATEST_TTL_MS, () => fetchCalendar(apiKey));
    const env: DataEnvelope<CalendarEntry[]> = {
      data: value, source: "FRED", freshness: "daily",
      asOf: value.find((e) => e.referenceDate)?.referenceDate ?? null,
      fetchedAt: new Date(storedAt).toISOString(), status: stale ? "stale" : "ok",
    };
    return NextResponse.json(env, { headers: { "Cache-Control": stale ? NO_STORE : LATEST_CACHE } });
  } catch (err) {
    return fail(upstreamFailure("gmi:calendar", err));
  }
}
