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
