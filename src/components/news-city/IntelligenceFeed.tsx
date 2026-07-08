"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowUpRight, ArrowDownRight, Minus, Radar, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

function DirectionIcon({ direction, className }: { direction: NewsItem["direction"]; className?: string }) {
  if (direction === "up") return <ArrowUpRight className={cn("text-success", className)} />;
  if (direction === "down") return <ArrowDownRight className={cn("text-destructive", className)} />;
  return <Minus className={cn("text-gold", className)} />;
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
  onOpenInHub,
}: {
  news: NewsItem[];
  onOpenInHub: (eventId: string) => void;
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
            return (
              <motion.button
                type="button"
                key={item.id}
                onClick={() => onOpenInHub(item.id)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: Math.min(i * 0.03, 0.3), ease: [0.22, 1, 0.36, 1] }}
                className="group relative flex w-full gap-3 rounded-xl border border-border bg-card/60 p-3 pl-4 text-left transition-colors hover:border-primary/30 hover:bg-muted/40"
              >
                {/* Category colour rail */}
                <span
                  className="absolute left-0 top-2 bottom-2 w-1 rounded-full"
                  style={{ background: cat.hex }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("font-mono text-[10px] font-bold uppercase tracking-wider rounded border px-1.5 py-0.5", tag.className)}>
                      {tag.label}
                    </span>
                    <span className="font-body text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {item.source}
                    </span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="font-body text-[11px] text-muted-foreground tabular-nums">{item.time}</span>
                    <DirectionIcon direction={item.direction} className="w-3.5 h-3.5" />
                  </div>
                  <p className="font-body text-sm font-semibold text-foreground leading-snug">{item.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="font-body text-xs text-muted-foreground">
                      Market impact: <span className="font-semibold text-foreground/90">{item.marketImpact}</span>
                    </p>
                    <p className="font-body text-xs text-muted-foreground tabular-nums">
                      Confidence: <span className="font-semibold text-foreground/90">{item.confidence}%</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <Badge variant="outline" className={cn("border", cat.className)}>
                      {cat.short}
                    </Badge>
                    <Badge variant="outline" className={cn("border", imp.className)}>
                      {imp.label}
                    </Badge>
                    {item.tickers.map((t) => (
                      <span
                        key={t}
                        className="font-body text-[10px] font-semibold tabular-nums text-muted-foreground rounded px-1.5 py-0.5 bg-muted/60"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="shrink-0 self-center inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary border border-primary/20 bg-primary/5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  Expand
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
