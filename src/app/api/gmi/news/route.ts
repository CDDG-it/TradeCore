import { NextResponse } from "next/server";
import { cached } from "@/lib/gmi/cache";
import { fetchNews } from "@/lib/gmi/news";
import type { DataEnvelope, NewsArticle } from "@/lib/gmi/types";

// Marketaux financial news. The client filters the cached batch rather than
// refetching per filter, so one batch serves every view of the wire.
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Two hours, not one — the free tier allows 100 requests a day and a refresh
 * spends four of them (one per page). Hourly meant 96 a day for a single warm
 * instance, so a second instance would push the desk over the limit and the
 * wire would start coming back stale. Two hours halves that to 48 and leaves
 * real headroom; the desk labels this feed delayed either way.
 */
const TTL_MS = 2 * 60 * 60_000;

/**
 * The wire is the same for every reader, so a good answer is worth sharing.
 * The in-process cache above only covers one warm instance; this lets the edge
 * hold the payload for fifteen minutes and keep serving it for an hour while it
 * refreshes behind the reader — so a cold instance is not a cold page, and the
 * upstream quota is spent once per window instead of once per instance.
 */
const CACHE_OK = "public, max-age=0, s-maxage=900, stale-while-revalidate=3600";
// A failure must never be the thing that gets cached for fifteen minutes.
const CACHE_FAIL = "no-store";

export async function GET() {
  const apiKey = process.env.MARKETAUX_API_KEY;
  if (!apiKey) {
    const env: DataEnvelope<NewsArticle[]> = {
      data: null,
      source: "Marketaux",
      freshness: "delayed",
      asOf: null,
      fetchedAt: new Date().toISOString(),
      status: "unavailable",
      error: "MARKETAUX_API_KEY not configured",
    };
    return NextResponse.json(env, { headers: { "Cache-Control": CACHE_FAIL } });
  }

  try {
    const { value, storedAt, stale } = await cached("gmi:news", TTL_MS, () => fetchNews(apiKey));
    const env: DataEnvelope<NewsArticle[]> = {
      data: value,
      source: "Marketaux",
      freshness: "delayed",
      asOf: value[0]?.publishedAt ?? null,
      fetchedAt: new Date(storedAt).toISOString(),
      status: stale ? "stale" : "ok",
    };
    return NextResponse.json(env, {
      headers: { "Cache-Control": stale ? CACHE_FAIL : CACHE_OK },
    });
  } catch (err) {
    const env: DataEnvelope<NewsArticle[]> = {
      data: null,
      source: "Marketaux",
      freshness: "delayed",
      asOf: null,
      fetchedAt: new Date().toISOString(),
      status: "unavailable",
      error: err instanceof Error ? err.message : "unknown",
    };
    return NextResponse.json(env, { headers: { "Cache-Control": CACHE_FAIL } });
  }
}
