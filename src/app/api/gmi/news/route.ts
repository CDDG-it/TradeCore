import { NextResponse } from "next/server";
import { cached } from "@/lib/gmi/cache";
import { fetchNews } from "@/lib/gmi/news";
import type { DataEnvelope, NewsArticle } from "@/lib/gmi/types";

// Marketaux financial news. Free tier is 100 req/day, so we cache for an hour
// and let the client filter the cached batch — never per-filter refetches.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const TTL_MS = 60 * 60_000;

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
    return NextResponse.json(env);
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
    return NextResponse.json(env);
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
    return NextResponse.json(env);
  }
}
