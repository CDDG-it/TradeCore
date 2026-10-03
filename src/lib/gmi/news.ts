import { unstable_cache } from "next/cache";
import { OFFICIAL_FEEDS, NEWS_REVALIDATE_SECONDS, parseOfficialFeed, assembleOfficialNews } from "./official-feeds";

// Cache validated successes only. Next retains the previous successful value
// when background revalidation throws; checkedAt exposes that stale snapshot.
// Authentication and cookies stay outside this shared cache.
const feeds = OFFICIAL_FEEDS.map((feed) => unstable_cache(async () => {
  const response = await fetch(feed.url, {
    cache: "no-store", signal: AbortSignal.timeout(10_000),
    headers: { "User-Agent": "TradingMC/1.0 (official release reader)", Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" },
  });
  if (!response.ok) throw new Error(`${feed.id}: HTTP ${response.status}`);
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > 2_000_000) throw new Error(`${feed.id}: oversized feed`);
  const prefix = new TextDecoder().decode(bytes.slice(0, 150));
  const encoding = prefix.match(/encoding=["']([^"']+)["']/i)?.[1] ?? "utf-8";
  const articles = parseOfficialFeed(new TextDecoder(encoding).decode(bytes), feed);
  return { articles, checkedAt: new Date().toISOString() };
}, ["official-news-v1", feed.id, feed.url], { revalidate: NEWS_REVALIDATE_SECONDS }));

export async function fetchNews() {
  return assembleOfficialNews(await Promise.allSettled(feeds.map((getFeed) => getFeed())));
}
