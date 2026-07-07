import type { Direction, TrendDirection, Sentiment, RiskLevel } from "./types";

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
