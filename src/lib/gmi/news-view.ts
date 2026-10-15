import type { NewsArticle, NewsTopic } from "./types";
import type { CalendarEvent } from "./calendar";

export function upcomingReleases(events: CalendarEvent[], from: string, until: string): CalendarEvent[] {
  const seen = new Set<string>();
  return events.filter((event) => event.date >= from && event.date < until)
    .sort((a, b) => a.date.localeCompare(b.date) || a.label.localeCompare(b.label))
    .filter((event) => { if (seen.has(event.id)) return false; seen.add(event.id); return true; });
}

export const NEWS_TOPICS: ("All" | NewsTopic)[] = ["All", "Monetary Policy", "Inflation", "Employment", "Energy"];
export interface NewsFilters { query: string; topic: string; agency: string; days: number }
export function filterNews(articles: NewsArticle[], filters: NewsFilters, now: number): NewsArticle[] {
  const query = filters.query.trim().toLowerCase();
  const cutoff = now - filters.days * 86_400_000;
  return articles.filter((article) => {
    const date = Date.parse(article.publishedAt);
    return Number.isFinite(date) && date >= cutoff && date <= now
      && (filters.topic === "All" || article.topic === filters.topic)
      && (filters.agency === "All" || article.source === filters.agency)
      && (!query || `${article.title} ${article.snippet} ${article.source} ${article.topic ?? ""}`.toLowerCase().includes(query));
  }).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export type MarketsSection = "news" | "calendar" | "markets" | "positioning";
export function marketsSection(raw: string | null, calendarOnly: boolean): MarketsSection {
  const aliases: Record<string, MarketsSection> = { briefing: "news", overview: "news", futures: "markets", flow: "positioning", "option-flow": "positioning", options: "positioning" };
  if (!raw) return calendarOnly ? "calendar" : "news";
  const result = aliases[raw] ?? raw;
  return ["news", "calendar", "markets", "positioning"].includes(result) ? result as MarketsSection : calendarOnly ? "calendar" : "news";
}

export function publicationLabel(article: NewsArticle, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    ...(article.publishedPrecision !== "date" ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: article.publishedPrecision === "date" ? "UTC" : timeZone,
  }).format(new Date(article.publishedAt));
}

/**
 * How market-moving an official release is. Deliberately conservative: the
 * scheduled prints (CPI, PPI, payrolls, JOLTS) and Fed policy actions are
 * "high"; the Chair's words and the energy outlooks are "high" too; other Fed
 * speeches and energy analysis that touches oil or gas are "medium"; the rest
 * (agency housekeeping, general energy explainers) is "low" and not shown.
 */
export type NewsImportance = "high" | "medium" | "low";

const HIGH_FEEDS = new Set(["fed-policy", "bls-cpi", "bls-ppi", "bls-employment", "bls-jolts"]);
const CHAIR = /\b(chair|vice chair)\b|testimony|semiannual monetary policy report/i;
const POLICY = /\bFOMC\b|federal open market committee|federal funds|discount rate|policy statement|minutes|interest on reserve|balance sheet/i;
const ENERGY_HIGH = /short-term energy outlook|\bSTEO\b|weekly petroleum|petroleum status|natural gas storage|annual energy outlook/i;
const ENERGY_MARKET = /\b(crude|oil|gasoline|diesel|distillate|natural gas|LNG|OPEC|refiner|brent|WTI|propane|jet fuel)\b|prices?/i;

export function newsImportance(article: NewsArticle): NewsImportance {
  const text = `${article.title} ${article.snippet}`;
  const feed = article.feedId;
  if (feed ? HIGH_FEEDS.has(feed) : article.source === "BLS") return "high";
  if (article.topic === "Monetary Policy") {
    if (feed === "fed-speeches") return CHAIR.test(article.title) ? "high" : "medium";
    return POLICY.test(text) || CHAIR.test(article.title) ? "high" : "medium";
  }
  if (article.topic === "Energy") {
    if (ENERGY_HIGH.test(text)) return "high";
    return ENERGY_MARKET.test(article.title) ? "medium" : "low";
  }
  return "medium";
}

export const NEWS_WINDOWS = [
  { key: "24h", label: "24h", hours: 24 },
  { key: "72h", label: "72h", hours: 72 },
  { key: "7d", label: "7 days", hours: 168 },
] as const;
export type NewsWindow = (typeof NEWS_WINDOWS)[number]["key"];

export interface RankedArticle { article: NewsArticle; importance: Exclude<NewsImportance, "low">; fresh: boolean }

/** Only what is new and matters: inside the window, never "low", newest first with high-impact leading ties. */
export function importantNews(articles: NewsArticle[], now: number, hours: number, topic: string = "All"): RankedArticle[] {
  const cutoff = now - hours * 3_600_000;
  return articles.flatMap((article) => {
    const date = Date.parse(article.publishedAt);
    if (!Number.isFinite(date) || date < cutoff || date > now) return [];
    if (topic !== "All" && article.topic !== topic) return [];
    const importance = newsImportance(article);
    if (importance === "low") return [];
    return [{ article, importance, fresh: now - date < 24 * 3_600_000 }];
  }).sort((x, y) => {
    const day = (r: RankedArticle) => r.article.publishedAt.slice(0, 10);
    return day(y).localeCompare(day(x)) || (x.importance === y.importance ? 0 : x.importance === "high" ? -1 : 1) || y.article.publishedAt.localeCompare(x.article.publishedAt);
  });
}
