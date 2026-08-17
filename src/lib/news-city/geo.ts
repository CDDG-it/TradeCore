/**
 * Geography for the World Map view — the financial centres the news markers sit
 * on, and a heuristic that pins each news item to the city that "owns" it, so
 * the 3D globe reads as: here's where in the world this is happening.
 */

import type { NewsItem } from "./types";

export interface FinancialCenter {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
}

export const FINANCIAL_CENTERS: FinancialCenter[] = [
  { id: "ny", name: "New York", country: "United States", lat: 40.71, lng: -74.01 },
  { id: "ldn", name: "London", country: "United Kingdom", lat: 51.51, lng: -0.13 },
  { id: "ffm", name: "Frankfurt", country: "Germany", lat: 50.11, lng: 8.68 },
  { id: "tyo", name: "Tokyo", country: "Japan", lat: 35.68, lng: 139.69 },
  { id: "hkg", name: "Hong Kong", country: "Hong Kong", lat: 22.32, lng: 114.17 },
  { id: "dxb", name: "Dubai", country: "United Arab Emirates", lat: 25.2, lng: 55.27 },
];

export const CENTER_BY_ID: Record<string, FinancialCenter> = Object.fromEntries(
  FINANCIAL_CENTERS.map((c) => [c.id, c])
);

/** New York is the hub the data-flow arcs radiate from. */
export const HUB_CENTER_ID = "ny";

/** Pin one news item to the financial centre most responsible for it. */
export function centerForNews(item: NewsItem): string {
  const src = item.source.toLowerCase();
  const title = item.title.toLowerCase();
  const hay = `${src} ${title}`;

  if (/ecb|lagarde|euro area|eurozone/.test(hay)) return "ffm";
  if (/boj|bank of japan|nikkei|yen|japan/.test(hay)) return "tyo";
  if (/china|hang seng|hong kong|pboc|asia/.test(hay)) return "hkg";

  if (item.category === "commodity") {
    if (/oil|opec|crude|wti|brent|energy|gas/.test(hay) || item.tickers.some((t) => /CL|WTI|NG/.test(t))) return "dxb";
    return "ldn"; // metals / gold desk
  }
  if (item.category === "geopolitics") return "ldn";

  // Fed, US macro (CPI/BLS), Nasdaq / ES markets, US earnings all sit in NY.
  return "ny";
}

export interface CenterNews {
  center: FinancialCenter;
  items: NewsItem[];
  /** Net tone from the items — colours the marker. */
  tone: "up" | "down" | "neutral";
  /** Highest impact present at this centre. */
  topImpact: NewsItem["impact"];
}

const IMPACT_RANK: Record<NewsItem["impact"], number> = { low: 0, medium: 1, high: 2, "very-high": 3 };

/** Group the feed by financial centre, keeping only centres with news. */
export function groupNewsByCenter(news: NewsItem[]): CenterNews[] {
  const map = new Map<string, NewsItem[]>();
  for (const item of news) {
    const id = centerForNews(item);
    (map.get(id) ?? map.set(id, []).get(id)!).push(item);
  }
  const out: CenterNews[] = [];
  for (const [id, items] of map) {
    const center = CENTER_BY_ID[id];
    if (!center) continue;
    const up = items.filter((i) => i.direction === "up").length;
    const down = items.filter((i) => i.direction === "down").length;
    const tone = up > down ? "up" : down > up ? "down" : "neutral";
    const topImpact = items.reduce<NewsItem["impact"]>(
      (acc, i) => (IMPACT_RANK[i.impact] > IMPACT_RANK[acc] ? i.impact : acc),
      "low"
    );
    out.push({ center, items, tone, topImpact });
  }
  return out.sort((a, b) => IMPACT_RANK[b.topImpact] - IMPACT_RANK[a.topImpact]);
}

/** Latitude/longitude (degrees) → point on a sphere of the given radius. */
export function latLngToVec3(lat: number, lng: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}
