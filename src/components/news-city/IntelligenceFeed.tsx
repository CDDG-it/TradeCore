"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowUpRight, ArrowDownRight, Minus, Radar, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NEWS_CATEGORY_META, NEWS_IMPACT_META, SIGNAL_TAG_META } from "@/lib/news-city/ui";
import type { NewsItem, NewsCategory, NewsImpact } from "@/lib/news-city/types";

type CategoryFilter = "all" | NewsCategory;
type ImpactFilter = "all" | NewsImpact;

const CATEGORY_FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "central-bank", label: "Central Banks" },
  { value: "commodity", label: "Commodities" },
  { value: "macro", label: "Macro" },
  { value: "earnings", label: "Earnings" },
  { value: "markets", label: "Markets" },
  { value: "geopolitics", label: "Geopolitics" },
];

const IMPACT_FILTERS: { value: ImpactFilter; label: string }[] = [
  { value: "all", label: "Any impact" },
  { value: "very-high", label: "Very high" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const DIRECTION_META = {
  up: { Icon: ArrowUpRight, label: "Bullish", text: "text-success", chip: "bg-success/10 text-success border-success/25" },
  down: { Icon: ArrowDownRight, label: "Bearish", text: "text-destructive", chip: "bg-destructive/10 text-destructive border-destructive/25" },
  neutral: { Icon: Minus, label: "Neutral", text: "text-gold", chip: "bg-gold/10 text-gold border-gold/25" },
} as const;

const IMPACT_STRENGTH: Record<NewsImpact, number> = { low: 1, medium: 2, high: 3, "very-high": 4 };

/** Four-segment strength meter — a glance-readable stand-in for the impact label. */
function ImpactMeter({ impact }: { impact: NewsImpact }) {
  const strength = IMPACT_STRENGTH[impact];
  const tone = impact === "very-high" || impact === "high" ? "bg-destructive" : impact === "medium" ? "bg-gold" : "bg-muted-foreground";
  return (
    <span className="flex items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4].map((n) => (
        <span key={n} className={cn("h-3 w-1 rounded-full transition-colors", n <= strength ? tone : "bg-border")} />
      ))}
    </span>
  );
}

/** Thin confidence bar — visual weight for the read on a signal. */
function ConfidenceBar({ value }: { value: number }) {
  const tone = value >= 75 ? "bg-primary" : value >= 50 ? "bg-gold" : "bg-muted-foreground";
  return (
    <span className="relative h-1 w-full overflow-hidden rounded-full bg-border/60">
      <span className={cn("absolute inset-y-0 left-0 rounded-full", tone)} style={{ width: `${value}%` }} />
    </span>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold transition-colors border whitespace-nowrap",
        active
          ? "bg-primary/10 border-primary/30 text-primary"
          : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
      )}
    >
      {children}
    </button>
  );
}

export function IntelligenceFeed({
  news,
  onSelect,
}: {
  news: NewsItem[];
  onSelect: (eventId: string) => void;
}) {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [impact, setImpact] = useState<ImpactFilter>("all");

  const filtered = useMemo(() => {
    return news
      .filter((n) => (category === "all" || n.category === category) && (impact === "all" || n.impact === impact))
      .sort((a, b) => a.minutesAgo - b.minutesAgo);
  }, [news, category, impact]);

  return (
    <div className="space-y-4">
      {/* Scanner header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <Radar className="w-4 h-4 text-primary" />
          <p className="font-body text-sm font-semibold text-foreground">Live intelligence signals</p>
        </div>
        <p className="font-body text-xs text-muted-foreground tabular-nums">
          {filtered.length} of {news.length} signals
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_FILTERS.map((f) => (
            <FilterChip key={f.value} active={category === f.value} onClick={() => setCategory(f.value)}>
              {f.label}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {IMPACT_FILTERS.map((f) => (
            <FilterChip key={f.value} active={impact === f.value} onClick={() => setImpact(f.value)}>
              {f.label}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* Feed */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="font-body text-sm text-muted-foreground">No signals match these filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item, i) => {
            const cat = NEWS_CATEGORY_META[item.category];
            const imp = NEWS_IMPACT_META[item.impact];
            const tag = SIGNAL_TAG_META[item.tag];
            const dir = DIRECTION_META[item.direction];
            return (
              <motion.button
                type="button"
                key={item.id}
                onClick={() => onSelect(item.id)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: Math.min(i * 0.03, 0.3), ease: [0.22, 1, 0.36, 1] }}
                className="group relative flex w-full overflow-hidden rounded-xl border border-border bg-card/60 text-left transition-all hover:-translate-y-px hover:border-primary/30 hover:bg-muted/30 hover:shadow-[0_8px_28px_-16px_rgba(0,0,0,0.55)]"
              >
                {/* Category colour rail — glows on hover so the whole card reads as one signal */}
                <span
                  className="w-1 shrink-0 self-stretch"
                  style={{ background: `linear-gradient(to bottom, ${cat.hex}, ${cat.hex}55)` }}
                />

                <div className="min-w-0 flex-1 p-3.5 pl-4">
                  {/* Meta row */}
                  <div className="flex items-center gap-2">
                    <span className={cn("font-mono text-[10px] font-bold uppercase tracking-wider rounded border px-1.5 py-0.5", tag.className)}>
                      {tag.label}
                    </span>
                    <span
                      className="font-body text-[11px] font-semibold uppercase tracking-wide"
                      style={{ color: cat.hex }}
                    >
                      {cat.short}
                    </span>
                    <span className="ml-auto inline-flex items-center gap-1 font-body text-[11px] text-muted-foreground tabular-nums">
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                      {item.time}
                    </span>
                  </div>

                  {/* Headline + direction */}
                  <div className="mt-2 flex items-start gap-2">
                    <p className="font-body text-sm font-semibold text-foreground leading-snug flex-1">{item.title}</p>
                    <span className={cn("shrink-0 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", dir.chip)}>
                      <dir.Icon className="w-3 h-3" />
                      {dir.label}
                    </span>
                  </div>

                  {/* Source + market impact */}
                  <p className="mt-1.5 font-body text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground/70">{item.source}</span>
                    <span className="mx-1.5 text-muted-foreground/40">·</span>
                    {item.marketImpact}
                  </p>

                  {/* Meters: impact strength + confidence */}
                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <ImpactMeter impact={item.impact} />
                      <span className={cn("font-body text-[10px] font-semibold uppercase tracking-wide", imp.className.split(" ")[0])}>
                        {item.impact === "very-high" ? "Very high" : item.impact}
                      </span>
                    </div>
                    <div className="flex flex-1 items-center gap-2">
                      <span className="font-body text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">Conf</span>
                      <ConfidenceBar value={item.confidence} />
                      <span className="font-body text-[11px] font-bold tabular-nums text-foreground/80">{item.confidence}%</span>
                    </div>
                  </div>

                  {/* Tickers */}
                  {item.tickers.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      {item.tickers.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 font-mono text-[10px] font-bold tabular-nums text-foreground/70 rounded px-1.5 py-0.5 bg-muted/60 border border-border/60"
                        >
                          <span className="text-primary/70">$</span>{t}
                        </span>
                      ))}
                      <span className="ml-auto inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                        Expand
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
