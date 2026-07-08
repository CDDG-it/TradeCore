import type { Direction, TrendDirection, Sentiment, RiskLevel, NewsCategory, NewsImpact } from "./types";

/** Shared color mapping so the 3D scene and the info panels agree on what
 *  "bullish/bearish/neutral" looks like, reusing the site's existing tokens. */
export const DIRECTION_META: Record<Direction, { label: string; className: string; hex: string }> = {
  hawkish: { label: "Hawkish", className: "text-destructive bg-destructive/10 border-destructive/30", hex: "#e0533d" },
  dovish: { label: "Dovish", className: "text-success bg-success/10 border-success/30", hex: "#4ea672" },
  neutral: { label: "Neutral", className: "text-gold bg-gold/10 border-gold/30", hex: "#d9a441" },
};

export const TREND_META: Record<TrendDirection, { label: string; className: string; hex: string }> = {
  rising: { label: "Rising", className: "text-success bg-success/10 border-success/30", hex: "#4ea672" },
  falling: { label: "Falling", className: "text-destructive bg-destructive/10 border-destructive/30", hex: "#e0533d" },
  flat: { label: "Flat", className: "text-gold bg-gold/10 border-gold/30", hex: "#d9a441" },
};

export const SENTIMENT_META: Record<Sentiment, { label: string; className: string; hex: string }> = {
  "risk-on": { label: "Risk-On", className: "text-success bg-success/10 border-success/30", hex: "#4ea672" },
  "risk-off": { label: "Risk-Off", className: "text-destructive bg-destructive/10 border-destructive/30", hex: "#e0533d" },
  neutral: { label: "Neutral", className: "text-gold bg-gold/10 border-gold/30", hex: "#d9a441" },
};

export const RISK_META: Record<RiskLevel, { label: string; className: string; hex: string }> = {
  low: { label: "Low", className: "text-success bg-success/10 border-success/30", hex: "#4ea672" },
  moderate: { label: "Moderate", className: "text-gold bg-gold/10 border-gold/30", hex: "#d9a441" },
  elevated: { label: "Elevated", className: "text-primary bg-primary/10 border-primary/30", hex: "#e8862e" },
  high: { label: "High", className: "text-destructive bg-destructive/10 border-destructive/30", hex: "#e0533d" },
};

/** News-feed category styling — the rail/badge colour matches each district
 *  colour used in the 3D city so the two views stay visually linked. */
export const NEWS_CATEGORY_META: Record<NewsCategory, { label: string; className: string; hex: string }> = {
  "central-bank": { label: "Central Banks", className: "text-gold bg-gold/10 border-gold/30", hex: "#d9a441" },
  commodity: { label: "Commodities", className: "text-[#2b93b4] bg-[#2b93b4]/10 border-[#2b93b4]/30", hex: "#2b93b4" },
  macro: { label: "Macro", className: "text-destructive bg-destructive/10 border-destructive/30", hex: "#c9573a" },
  markets: { label: "Markets", className: "text-primary bg-primary/10 border-primary/30", hex: "#f97316" },
  geopolitics: { label: "Geopolitics", className: "text-muted-foreground bg-muted/60 border-border", hex: "#8b96a2" },
};

export const NEWS_IMPACT_META: Record<NewsImpact, { label: string; className: string }> = {
  high: { label: "High impact", className: "text-destructive bg-destructive/10 border-destructive/30" },
  medium: { label: "Medium", className: "text-gold bg-gold/10 border-gold/30" },
  low: { label: "Low", className: "text-muted-foreground bg-muted/60 border-border" },
};
