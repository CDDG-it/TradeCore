import type { NewsItem } from "@/lib/types";

/**
 * The static wire behind /news.
 *
 * These items are written copy, not a feed: nothing here is fetched and
 * nothing is user-specific. They used to live in the mock store alongside
 * sample trades, accounts and habits, which meant opening the news page pulled
 * that whole sample dataset into the browser and let it write placeholder rows
 * into the reader's own localStorage. Keeping the copy in its own module ends
 * both: the page ships the articles and nothing else.
 *
 * The live market feeds are elsewhere: /news-city reads real providers through
 * `src/lib/gmi`. This page is the editorial one.
 */
const ARTICLES: NewsItem[] = [
  {
    id: "news_1",
    title: "Oil futures rise after supply disruption concerns",
    summary: "Energy markets moved higher as traders priced in potential short-term supply constraints following geopolitical tensions in key producing regions.",
    source_name: "Reuters",
    source_url: "#",
    published_at: "2026-04-09T07:30:00Z",
    market_tags: ["futures", "commodities"],
    impact_level: "high",
    asset_tags: ["oil", "energy"],
    is_featured: true,
  },
  {
    id: "news_2",
    title: "Gold hits new highs amid dollar weakness",
    summary: "Gold futures surged past $3,340 as the US dollar index fell to multi-week lows, boosting demand for the precious metal as a safe haven.",
    source_name: "Bloomberg",
    source_url: "#",
    published_at: "2026-04-09T06:15:00Z",
    market_tags: ["commodities"],
    impact_level: "high",
    asset_tags: ["gold", "metals"],
    is_featured: true,
  },
  {
    id: "news_3",
    title: "Fed minutes show split on rate path",
    summary: "Minutes from the latest Federal Reserve meeting revealed a divided committee, with some members favoring a pause while others pushed for further tightening.",
    source_name: "CNBC",
    source_url: "#",
    published_at: "2026-04-08T18:00:00Z",
    market_tags: ["futures"],
    impact_level: "high",
    asset_tags: ["bonds", "indices"],
    is_featured: false,
  },
  {
    id: "news_4",
    title: "Copper demand surges on China infrastructure push",
    summary: "Copper futures rallied as China announced a new round of infrastructure spending, driving expectations for increased industrial metal demand.",
    source_name: "Financial Times",
    source_url: "#",
    published_at: "2026-04-08T14:20:00Z",
    market_tags: ["commodities"],
    impact_level: "medium",
    asset_tags: ["copper", "metals"],
    is_featured: false,
  },
  {
    id: "news_5",
    title: "Natural gas inventory build surprises market",
    summary: "Weekly natural gas storage data showed a larger-than-expected build, putting pressure on futures prices as mild weather forecasts persist.",
    source_name: "EIA",
    source_url: "#",
    published_at: "2026-04-08T10:30:00Z",
    market_tags: ["commodities", "futures"],
    impact_level: "medium",
    asset_tags: ["natural gas", "energy"],
    is_featured: false,
  },
  {
    id: "news_6",
    title: "S&P 500 futures flat ahead of earnings season",
    summary: "US equity index futures traded in a tight range as investors positioned ahead of the Q1 earnings season, with major banks set to report later this week.",
    source_name: "MarketWatch",
    source_url: "#",
    published_at: "2026-04-07T20:00:00Z",
    market_tags: ["futures"],
    impact_level: "low",
    asset_tags: ["indices", "equities"],
    is_featured: false,
  },
  {
    id: "news_7",
    title: "Wheat futures drop on improved crop outlook",
    summary: "Favorable weather conditions across the US plains led to a sharp decline in wheat futures as traders revised production estimates higher.",
    source_name: "Agriculture.com",
    source_url: "#",
    published_at: "2026-04-07T15:45:00Z",
    market_tags: ["commodities"],
    impact_level: "medium",
    asset_tags: ["wheat", "grains"],
    is_featured: false,
  },
];

export interface NewsFilters {
  market?: string;
  impact?: string;
  asset?: string;
}

/** Newest first, narrowed by whichever filters are set. */
export function getNews(filters?: NewsFilters): NewsItem[] {
  let result = ARTICLES;
  if (filters?.market) result = result.filter((n) => n.market_tags.includes(filters.market!));
  if (filters?.impact) result = result.filter((n) => n.impact_level === filters.impact);
  if (filters?.asset) {
    const needle = filters.asset.toLowerCase();
    result = result.filter((n) => n.asset_tags.some((t) => t.toLowerCase().includes(needle)));
  }
  // Copy before sorting: `result` is still the source array when no filter ran.
  return [...result].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
}

export function getFeaturedNews(): NewsItem[] {
  return ARTICLES.filter((n) => n.is_featured);
}
