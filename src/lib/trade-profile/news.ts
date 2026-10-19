import { unstable_cache } from "next/cache";
import { insights } from "@/lib/trade-profile/content/insights";
import type { FocusAreaId } from "@/lib/trade-profile/focus-rules";

/**
 * Live reading for a trader type: recent articles matching the type's theme,
 * from Marketaux (the news API the project holds a key for; Google News feeds
 * are licensed for personal use only, so they are not used). Only the
 * headline, source, date and link are kept; the reader opens the article on
 * the publisher's site.
 *
 * Server only: the API key never leaves the server. Successes are cached per
 * type for six hours, which keeps seven types well inside the daily request
 * allowance; a failure is not cached and simply returns nothing.
 */

export interface ProfileNewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
}

const REVALIDATE_SECONDS = 6 * 60 * 60;
/** Only recent pieces: older ones read as stale in a "news" strip. */
const WINDOW_DAYS = 180;

function cleanText(input: unknown): string {
  return typeof input === "string" ? input.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 220) : "";
}

function safeUrl(input: unknown): string | null {
  if (typeof input !== "string") return null;
  try {
    const url = new URL(input);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

const cachedFor = (type: FocusAreaId) =>
  unstable_cache(
    async (): Promise<ProfileNewsItem[]> => {
      const key = process.env.MARKETAUX_API_KEY?.trim();
      if (!key) throw new Error("MARKETAUX_API_KEY is not set");
      const after = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10);
      const params = new URLSearchParams({
        search: insights[type].newsQuery,
        language: "en",
        limit: "3",
        sort: "relevance_score",
        published_after: after,
        api_token: key,
      });
      const response = await fetch(`https://api.marketaux.com/v1/news/all?${params}`, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
      if (!response.ok) throw new Error(`Marketaux HTTP ${response.status}`);
      const body = (await response.json()) as { data?: Record<string, unknown>[] };
      const items = (body.data ?? []).flatMap((a): ProfileNewsItem[] => {
        const url = safeUrl(a.url);
        const title = cleanText(a.title);
        if (!url || !title) return [];
        return [{ title, url, source: cleanText(a.source) || new URL(url).hostname, publishedAt: typeof a.published_at === "string" ? a.published_at : "" }];
      });
      return items.sort((x, y) => y.publishedAt.localeCompare(x.publishedAt));
    },
    ["trade-profile-news-v1", type],
    { revalidate: REVALIDATE_SECONDS },
  );

/** The type's live reading, or an empty list when it cannot be fetched. Never throws. */
export async function fetchProfileNews(type: FocusAreaId): Promise<{ items: ProfileNewsItem[]; status: "ok" | "unavailable" }> {
  try {
    return { items: await cachedFor(type)(), status: "ok" };
  } catch (err) {
    // The URL carries the key: log the message only, never return it.
    console.error("[trade-profile-news] upstream failed:", err instanceof Error ? err.message.replace(/api_token=[^&\s]+/g, "api_token=***") : err);
    return { items: [], status: "unavailable" };
  }
}
