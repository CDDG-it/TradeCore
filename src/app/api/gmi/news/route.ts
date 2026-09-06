import { NextResponse } from "next/server";
import { cached } from "@/lib/gmi/cache";
import { fetchNews } from "@/lib/gmi/news";
import type { DataEnvelope, NewsArticle } from "@/lib/gmi/types";

// Marketaux financial news. Free tier is 100 req/day, so we cache for an hour
// and let the client filter the cached batch — never per-filter refetches.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const TTL_MS = 60 * 60_000;

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
