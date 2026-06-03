"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import {
  format, startOfDay, endOfDay,
  getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek,
} from "date-fns";
import { Plus, Search, TrendingUp, TrendingDown, Minus, ArrowRight, LinkIcon, LayoutGrid, List } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getAnalyses } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";
import type { Bias, Market, PreTradeAnalysis } from "@/lib/types";

function BiasBadge({ bias }: { bias: Bias }) {
  if (bias === "bullish")
    return (
      <span className="flex items-center gap-1 text-success text-xs font-medium">
        <TrendingUp className="w-3 h-3" /> Bullish
      </span>
    );
  if (bias === "bearish")
    return (
      <span className="flex items-center gap-1 text-destructive text-xs font-medium">
        <TrendingDown className="w-3 h-3" /> Bearish
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-warning text-xs font-medium">
      <Minus className="w-3 h-3" /> Choppy
    </span>
  );
}

function MarketBadge({ market }: { market: Market }) {
  const colors: Record<Market, string> = {
    futures: "bg-primary/10 text-primary border-primary/20",
    commodities: "bg-warning/10 text-warning border-warning/20",
  };
  return (
    <Badge className={cn("text-xs capitalize", colors[market])}>
      {market}
    </Badge>
  );
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type PeriodFilter = "all" | "day" | "week" | "month";
type ViewMode = "grid" | "list";

interface WeekGroup {
  key: string;
  weekNum: number;
  weekYear: number;
  start: Date;
  end: Date;
  analyses: PreTradeAnalysis[];
}

export default function AnalysisPage() {
  const [allAnalyses, setAllAnalyses] = useState<PreTradeAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterBias, setFilterBias] = useState<Bias | "all">("all");
  const [filterMarket, setFilterMarket] = useState<Market | "all">("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  useEffect(() => {
    getAnalyses().then(setAllAnalyses).finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  const filtered = useMemo(() => allAnalyses.filter((a) => {
    const matchSearch =
      !search ||
      a.instrument.toLowerCase().includes(search.toLowerCase());
    const matchBias = filterBias === "all" || a.bias === filterBias;
    const matchMarket = filterMarket === "all" || a.market === filterMarket;
    let matchPeriod = true;
    if (periodFilter !== "all") {
      const d = new Date(a.date + "T12:00:00");
      if (periodFilter === "day") matchPeriod = d >= dayStart && d <= dayEnd;
      else if (periodFilter === "week") {
        const w = new Date(now); w.setDate(now.getDate() - 7);
        matchPeriod = d >= w;
      } else if (periodFilter === "month") {
        const m = new Date(now); m.setMonth(now.getMonth() - 1);
        matchPeriod = d >= m;
      }
    }
    return matchSearch && matchBias && matchMarket && matchPeriod;
  }), [allAnalyses, search, filterBias, filterMarket, periodFilter]);

  const weekGroups = useMemo((): WeekGroup[] => {
    const groupMap = new Map<string, WeekGroup>();
    filtered.forEach((a) => {
      const d = new Date(a.date + "T12:00:00");
      const weekNum = getISOWeek(d);
      const weekYear = getISOWeekYear(d);
      const key = `${weekYear}-W${String(weekNum).padStart(2, "0")}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          key,
          weekNum,
          weekYear,
          start: startOfISOWeek(d),
          end: endOfISOWeek(d),
          analyses: [],
        });
      }
      groupMap.get(key)!.analyses.push(a);
    });
    return Array.from(groupMap.values()).sort((a, b) => b.start.getTime() - a.start.getTime());
  }, [filtered]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Trading"
        title="Analysis"
        subtitle="Pre-trade and market analysis"
        action={
          <Link
            href="/analysis/new"
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-px shrink-0"
            style={{
              background: "oklch(0.72 0.22 45)",
              color: "oklch(0.07 0.003 28)",
              boxShadow: "0 4px 14px oklch(0.72 0.22 45 / 0.30)",
            }}
          >
            <Plus className="w-4 h-4" />
            New analysis
          </Link>
        }
      />
      <PageWrapper>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search instrument..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-card border-border/50"
          />
        </div>

        {/* View toggle */}
        <div className="flex rounded-lg border border-border/50 overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5",
              viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Grid
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5",
              viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <List className="w-3.5 h-3.5" /> List
          </button>
        </div>

        {/* Period filter */}
        <div className="flex rounded-lg border border-border/50 overflow-hidden">
          {(["all", "day", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodFilter(p)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors",
                periodFilter === p
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {p === "all" ? "All time" : p === "day" ? "Today" : p === "week" ? "This week" : "This month"}
            </button>
          ))}
        </div>

        {/* Bias filter */}
        <div className="flex rounded-lg border border-border/50 overflow-hidden">
          {(["all", "bullish", "bearish", "choppy"] as const).map((b) => (
            <button
              key={b}
              onClick={() => setFilterBias(b)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors capitalize",
                filterBias === b
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {b}
            </button>
          ))}
        </div>

        {/* Market filter */}
        <div className="flex rounded-lg border border-border/50 overflow-hidden">
          {(["all", "futures", "commodities"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setFilterMarket(m as Market | "all")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors capitalize",
                filterMarket === m
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No analyses found.</p>
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === "grid" && filtered.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((analysis) => (
            <Link key={analysis.id} href={`/analysis/${analysis.id}`}>
              <Card className="bg-card border border-border/50 card-hover h-full">
                <CardContent className="p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold tracking-tight">
                        {analysis.instrument}
                      </span>
                      <MarketBadge market={analysis.market} />
                    </div>
                    {analysis.used_for_trade && (
                      <Badge className="text-xs bg-primary/10 text-primary border-primary/20 shrink-0">
                        <LinkIcon className="w-2.5 h-2.5 mr-1" />
                        Traded
                      </Badge>
                    )}
                  </div>

                  {/* Thesis */}
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                    {analysis.thesis}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/40">
                    <BiasBadge bias={analysis.bias} />
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{analysis.session}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(analysis.date), "MMM d")}
                      </span>
                    </div>
                  </div>

                  {/* Scenario indicators */}
                  {(analysis.long_scenario || analysis.short_scenario) && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {analysis.long_scenario && (
                        <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-md font-medium">↑ Long</span>
                      )}
                      {analysis.short_scenario && (
                        <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-md font-medium">↓ Short</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* LIST VIEW — grouped by week */}
      {viewMode === "list" && filtered.length > 0 && (
        <div className="space-y-8">
          {weekGroups.map((group) => {
            const weekStart = group.start;
            const weekEnd = group.end;
            const dayRange = Array.from({ length: 7 }, (_, i) => {
              const d = new Date(weekStart);
              d.setDate(weekStart.getDate() + i);
              return d;
            });

            return (
              <div key={group.key} className="space-y-3">
                {/* Week header */}
                <div className="flex items-baseline gap-3">
                  <span
                    className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                    style={{
                      background: "oklch(0.72 0.22 45 / 0.12)",
                      color: "oklch(0.72 0.22 45)",
                    }}
                  >
                    W{group.weekNum}
                  </span>
                  <span className="text-sm font-semibold text-foreground/80">
                    {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
                  </span>
                  <div className="flex gap-1 ml-1">
                    {dayRange.map((d, i) => {
                      const key = format(d, "yyyy-MM-dd");
                      const hasAnalysis = group.analyses.some((a) => a.date === key);
                      return (
                        <span
                          key={key}
                          title={`${DAY_NAMES[i]} ${format(d, "MMM d")}`}
                          className={cn(
                            "inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-semibold",
                            hasAnalysis
                              ? "text-primary"
                              : "text-muted-foreground/30"
                          )}
                          style={hasAnalysis ? { background: "oklch(0.72 0.22 45 / 0.12)" } : undefined}
                        >
                          {DAY_NAMES[i][0]}
                        </span>
                      );
                    })}
                  </div>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {group.analyses.length} {group.analyses.length === 1 ? "analysis" : "analyses"}
                  </span>
                </div>

                {/* Analysis rows */}
                <Card className="bg-card border-border/50 overflow-hidden">
                  <div className="divide-y divide-border/40">
                    {group.analyses.map((analysis) => (
                      <Link
                        key={analysis.id}
                        href={`/analysis/${analysis.id}`}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 border-l-2 border-transparent hover:border-primary/40 transition-all group"
                      >
                        {/* Date */}
                        <div className="w-10 shrink-0 text-center">
                          <p className="text-xs font-medium text-muted-foreground">
                            {format(new Date(analysis.date + "T12:00:00"), "EEE")}
                          </p>
                          <p className="text-sm font-bold text-foreground/80">
                            {format(new Date(analysis.date + "T12:00:00"), "d")}
                          </p>
                        </div>

                        {/* Instrument + market */}
                        <div className="w-24 shrink-0">
                          <p className="text-sm font-bold group-hover:text-primary transition-colors">
                            {analysis.instrument}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">{analysis.market}</p>
                        </div>

                        {/* Bias */}
                        <div className="w-20 shrink-0">
                          <BiasBadge bias={analysis.bias} />
                        </div>

                        {/* Thesis */}
                        <p className="flex-1 text-xs text-muted-foreground truncate hidden sm:block leading-relaxed">
                          {analysis.thesis}
                        </p>

                        {/* Session + badges */}
                        <div className="flex items-center gap-2 shrink-0">
                          {analysis.used_for_trade && (
                            <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                              <LinkIcon className="w-2.5 h-2.5 mr-1" />
                              Traded
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground hidden md:block">{analysis.session}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary/60 transition-all group-hover:translate-x-0.5" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}
      </PageWrapper>
    </div>
  );
}
