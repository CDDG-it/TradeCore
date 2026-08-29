/**
 * News provider — Marketaux (financial news + per-entity sentiment).
 *
 * The free tier returns 3 articles per request and allows 100 requests/day, so
 * we fetch a small batch of pages once and cache it for an hour; all filtering
 * (asset, category, sentiment) happens client-side over that batch. Sentiment
 * is Marketaux's own per-entity score, averaged across an article's entities —
 * we never invent a score, and show "neutral/none" when the provider gives none.
 */
import { fetchJson } from "./cache";
import type { NewsArticle } from "./types";

interface MarketauxEntity {
  symbol?: string;
  name?: string;
  type?: string;
  sentiment_score?: number | null;
}
interface MarketauxArticle {
  uuid: string;
  title: string;
  snippet?: string;
  description?: string;
  url: string;
  source?: string;
  published_at: string;
  entities?: MarketauxEntity[];
}
interface MarketauxResponse {
  data?: MarketauxArticle[];
}

const PAGES = 4; // 3 articles each → ~12 articles per refresh

function mapArticle(a: MarketauxArticle): NewsArticle {
  const ents = a.entities ?? [];
  const scores = ents
    .map((e) => e.sentiment_score)
    .filter((s): s is number => typeof s === "number");
  const sentimentScore =
    scores.length > 0 ? scores.reduce((s, v) => s + v, 0) / scores.length : null;
  const assets = Array.from(
    new Set(ents.map((e) => e.symbol).filter((s): s is string => Boolean(s)))
  ).slice(0, 6);
  // Category from entity types (equity/index/etc.), objective and provider-derived.
  const types = Array.from(new Set(ents.map((e) => e.type).filter(Boolean)));
  return {
    id: a.uuid,
    title: a.title,
    snippet: a.snippet || a.description || "",
    url: a.url,
    source: a.source || "Marketaux",
    publishedAt: a.published_at,
    assets,
    sentimentScore: sentimentScore != null ? Math.round(sentimentScore * 1000) / 1000 : null,
    category: types[0] ?? null,
  };
}

export async function fetchNews(apiKey: string): Promise<NewsArticle[]> {
  const seen = new Set<string>();
  const out: NewsArticle[] = [];
  for (let page = 1; page <= PAGES; page++) {
    const url =
      `https://api.marketaux.com/v1/news/all?filter_entities=true&language=en` +
      `&countries=us&limit=3&page=${page}&api_token=${apiKey}`;
    try {
      const json = await fetchJson<MarketauxResponse>(url, { timeoutMs: 8000, retries: 1 });
      for (const a of json.data ?? []) {
        if (seen.has(a.uuid)) continue;
        seen.add(a.uuid);
        out.push(mapArticle(a));
      }
    } catch {
      // Stop paging on the first failure — serve whatever we already gathered.
      break;
    }
  }
  if (out.length === 0) throw new Error("no articles");
  out.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return out;
}
