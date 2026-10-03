import { createHash } from "node:crypto";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import type { NewsArticle, NewsTopic, NewsSourceHealth, DataEnvelope } from "./types";

export interface OfficialFeed { id: string; agency: string; name: string; url: string; topic: NewsTopic }
export const OFFICIAL_FEEDS: OfficialFeed[] = [
  { id: "fed-policy", agency: "Federal Reserve", name: "Monetary policy", url: "https://www.federalreserve.gov/feeds/press_monetary.xml", topic: "Monetary Policy" },
  { id: "fed-speeches", agency: "Federal Reserve", name: "Speeches and testimony", url: "https://www.federalreserve.gov/feeds/speeches_and_testimony.xml", topic: "Monetary Policy" },
  { id: "bls-cpi", agency: "BLS", name: "Consumer prices", url: "https://www.bls.gov/feed/cpi.rss", topic: "Inflation" },
  { id: "bls-ppi", agency: "BLS", name: "Producer prices", url: "https://www.bls.gov/feed/ppi.rss", topic: "Inflation" },
  { id: "bls-employment", agency: "BLS", name: "Employment Situation", url: "https://www.bls.gov/feed/empsit.rss", topic: "Employment" },
  { id: "bls-jolts", agency: "BLS", name: "Job openings", url: "https://www.bls.gov/feed/jolts.rss", topic: "Employment" },
  { id: "eia-press", agency: "EIA", name: "Press releases", url: "https://www.eia.gov/rss/press_rss.xml", topic: "Energy" },
  { id: "eia-energy", agency: "EIA", name: "Today in Energy", url: "https://www.eia.gov/rss/todayinenergy.xml", topic: "Energy" },
];

type Node = Record<string, unknown>;
const node = (input: unknown): Node => input && typeof input === "object" ? input as Node : {};
const array = (input: unknown): unknown[] => input == null ? [] : Array.isArray(input) ? input : [input];
function value(input: unknown): string {
  if (typeof input === "string") return input;
  const text = node(input)["#text"];
  return typeof text === "string" ? text : "";
}

/** Output is plain text, never HTML passed to React. */
export function plainText(input: unknown): string {
  return value(input).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]*>/g, " ")
    .replace(/&(?:amp|lt|gt|quot|apos|nbsp);|&#(?:x[\da-f]+|\d+);/gi, (entity) => {
      const named: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'", "&nbsp;": " " };
      if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
      const num = entity[2].toLowerCase() === "x" ? parseInt(entity.slice(3, -1), 16) : parseInt(entity.slice(2, -1), 10);
      return num > 0 && num <= 0x10ffff ? String.fromCodePoint(num) : "";
    }).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function canonicalUrl(raw: string, base: string): string | null {
  if (!raw.trim()) return null;
  try {
    const url = new URL(raw, base);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return null;
    const host = new URL(base).hostname.replace(/^www\./, "");
    if (url.hostname !== host && !url.hostname.endsWith(`.${host}`)) return null;
    url.protocol = "https:";
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) if (/^utm_|^(fbclid|gclid)$/i.test(key)) url.searchParams.delete(key);
    url.searchParams.sort();
    return url.toString();
  } catch { return null; }
}

export function parseOfficialFeed(xml: string, feed: OfficialFeed): NewsArticle[] {
  if (xml.length > 2_000_000 || /<!DOCTYPE|<!ENTITY/i.test(xml) || XMLValidator.validate(xml) !== true) throw new Error("Invalid feed XML");
  const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, parseTagValue: false, trimValues: true });
  const doc = node(parser.parse(xml));
  const channel = node(node(doc.rss).channel);
  const atom = node(doc.feed);
  if (!doc.rss && !doc.feed) throw new Error("Expected RSS or Atom");
  const entries = array(doc.feed ? atom.entry : channel.item);
  const articles: NewsArticle[] = [];
  for (const raw of entries) {
    const item = node(raw);
    const title = plainText(item.title);
    const link = array(item.link).find((entry) => !node(entry)["@_rel"] || node(entry)["@_rel"] === "alternate");
    const url = canonicalUrl(value(node(link)["@_href"]) || value(link), feed.url);
    // updated is not a publication date. Missing publication dates are omitted.
    const published = value(item.pubDate || item.published || item.date);
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(published);
    const date = Date.parse(published);
    if (!title || !url || !published || !Number.isFinite(date)) continue;
    const publishedAt = new Date(date).toISOString();
    articles.push({
      id: createHash("sha256").update(`${url}|${publishedAt}`).digest("hex").slice(0, 24),
      title, url, source: feed.agency, publishedAt,
      snippet: plainText(item.description || item.summary || item.content).slice(0, 2000),
      topic: feed.topic, category: feed.topic, publishedPrecision: dateOnly ? "date" : "time",
      assets: [], sentimentScore: null,
    });
  }
  if (entries.length && !articles.length) throw new Error("Feed has no usable entries");
  return articles;
}

export interface FeedSnapshot { articles: NewsArticle[]; checkedAt: string }
export const NEWS_REVALIDATE_SECONDS = 15 * 60;

export function assembleOfficialNews(results: PromiseSettledResult<FeedSnapshot>[], feeds = OFFICIAL_FEEDS, now = Date.now()): DataEnvelope<NewsArticle[]> {
  const sources: NewsSourceHealth[] = feeds.map((feed, index) => {
    const result = results[index];
    const checkedAt = result?.status === "fulfilled" ? result.value.checkedAt : null;
    return { id: feed.id, name: feed.name, agency: feed.agency, checkedAt,
      status: !checkedAt ? "unavailable" : now - Date.parse(checkedAt) >= NEWS_REVALIDATE_SECONDS * 1000 ? "stale" : "ok" };
  });
  const urls = new Set<string>();
  const titles = new Set<string>();
  const data = results.flatMap((r) => r.status === "fulfilled" ? r.value.articles : [])
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .filter((article) => {
      const key = `${article.source}|${article.title.toLowerCase().replace(/\s+/g, " ")}|${article.publishedAt.slice(0, 10)}`;
      if (urls.has(article.url) || titles.has(key)) return false;
      urls.add(article.url); titles.add(key); return true;
    });
  const available = sources.some((source) => source.status !== "unavailable");
  return { data: available ? data : null, source: "Official releases", freshness: "delayed",
    asOf: data[0]?.publishedAt ?? null, fetchedAt: new Date(now).toISOString(), sources,
    status: !available ? "unavailable" : sources.some((s) => s.status !== "ok") ? "stale" : "ok" };
}
