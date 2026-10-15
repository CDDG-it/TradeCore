import { NextResponse } from "next/server";
import { fetchNews } from "@/lib/gmi/news";
import { fetchCalendar, fetchCalendarMonth } from "@/lib/gmi/calendar";
import { fetchGlobalYields } from "@/lib/gmi/global-yields";
import { fetchCrossHistory } from "@/lib/gmi/history";
import { fetchMacro } from "@/lib/gmi/macro";
import { fetchAllQuotes, fetchQuoteSeries } from "@/lib/gmi/quotes";
import { fetchCotSnapshot } from "@/lib/cot/live";
import type { DataEnvelope } from "@/lib/gmi/types";

/**
 * Development only: the Global Markets feeds for /preview/markets, so the desk
 * can be looked at without a Supabase session. It calls the same providers the
 * real /api/gmi routes do, minus their auth, cache and rate limit. The
 * middleware only lets `/preview/*` through outside production, and this
 * handler 404s in production on its own as well.
 */
export const dynamic = "force-dynamic";

const envelope = <T,>(data: T | null, source: string, freshness: DataEnvelope<T>["freshness"], asOf: string | null = null): DataEnvelope<T> => ({
  data, source, freshness, asOf, fetchedAt: new Date().toISOString(), status: data == null ? "unavailable" : "ok",
});

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (process.env.NODE_ENV === "production") return new NextResponse(null, { status: 404 });
  const [group, name] = (await params).path;
  const url = new URL(req.url);
  const key = process.env.FRED_API_KEY ?? "";
  try {
    if (group === "cot") return NextResponse.json({ snapshot: await fetchCotSnapshot(), live: true });
    switch (name) {
      case "news": return NextResponse.json(await fetchNews());
      case "calendar": {
        const month = url.searchParams.get("month");
        return NextResponse.json(month ? envelope(await fetchCalendarMonth(key, month), "FRED", "daily") : envelope(await fetchCalendar(key), "FRED", "daily"));
      }
      case "global-yields": return NextResponse.json(envelope(await fetchGlobalYields(key), "FRED · OECD", "monthly"));
      case "history": return NextResponse.json(envelope(await fetchCrossHistory(url.searchParams.get("range") ?? "3mo"), "Yahoo Finance", "daily"));
      case "macro": return NextResponse.json(envelope(await fetchMacro(key), "FRED", "daily"));
      case "quotes": {
        const symbol = url.searchParams.get("symbol");
        if (symbol) return NextResponse.json(envelope(await fetchQuoteSeries(symbol, url.searchParams.get("interval") ?? "5m", url.searchParams.get("range") ?? "2d"), "Yahoo Finance", "delayed"));
        return NextResponse.json(envelope(await fetchAllQuotes(), "Yahoo Finance", "delayed"));
      }
    }
  } catch (error) {
    return NextResponse.json({ ...envelope(null, "preview", "daily"), error: String(error) });
  }
  return new NextResponse(null, { status: 404 });
}
