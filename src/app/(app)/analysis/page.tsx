"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import {
  format, startOfDay, endOfDay,
  getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek,
  addWeeks, subWeeks,
} from "date-fns";
import {
  Plus, TrendingUp, TrendingDown, Minus, ArrowRight,
  LinkIcon, LayoutGrid, List, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export default function AnalysisPage() {
  const [allAnalyses, setAllAnalyses] = useState<PreTradeAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [listWeekDate, setListWeekDate] = useState(new Date());

  useEffect(() => {
    getAnalyses().then(setAllAnalyses).finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  // Filtered for grid view (period filter only)
  const filtered = useMemo(() => allAnalyses.filter((a) => {
    if (periodFilter === "all") return true;
    const d = new Date(a.date + "T12:00:00");
    if (periodFilter === "day") return d >= dayStart && d <= dayEnd;
    if (periodFilter === "week") {
      const w = new Date(now); w.setDate(now.getDate() - 7);
      return d >= w;
    }
    if (periodFilter === "month") {
      const m = new Date(now); m.setMonth(now.getMonth() - 1);
      return d >= m;
    }
    return true;
  }), [allAnalyses, periodFilter]);

  // List view: week navigation
  const listWeekStart = startOfISOWeek(listWeekDate);
  const listWeekEnd = endOfISOWeek(listWeekDate);
  const listWeekNum = getISOWeek(listWeekDate);

  const listWeekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(listWeekStart);
    d.setDate(listWeekStart.getDate() + i);
    return format(d, "yyyy-MM-dd");
  });

  const listWeekAnalyses = useMemo(() => {
    return allAnalyses
      .filter((a) => {
        const d = new Date(a.date + "T12:00:00");
        return d >= listWeekStart && d <= listWeekEnd;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [allAnalyses, listWeekStart.getTime(), listWeekEnd.getTime()]);

  const analysesByDay = useMemo(() => {
    const map: Record<string, PreTradeAnalysis[]> = {};
    listWeekAnalyses.forEach((a) => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    return map;
  }, [listWeekAnalyses]);

  const isCurrentWeek =
    getISOWeek(listWeekDate) === getISOWeek(now) &&
    getISOWeekYear(listWeekDate) === getISOWeekYear(now);

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

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        {/* View toggle */}
        <div className="flex rounded-lg border border-border/50 overflow-hidden">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5",
              viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <List className="w-3.5 h-3.5" /> List
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5",
              viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Grid
          </button>
        </div>

        {/* Period filter — grid only */}
        {viewMode === "grid" && (
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
        )}
      </div>

      {/* LIST VIEW — per week, Mon→Sun */}
      {viewMode === "list" && (
        <div className="space-y-4">
          {/* Week navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setListWeekDate(subWeeks(listWeekDate, 1))}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="text-center space-y-1.5">
              <div className="flex items-center justify-center gap-2">
                <span
                  className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                  style={{
                    background: "oklch(0.72 0.22 45 / 0.12)",
                    color: "oklch(0.72 0.22 45)",
                  }}
                >
                  W{listWeekNum}
                </span>
                <span className="text-sm font-semibold">
                  {format(listWeekStart, "MMM d")} – {format(listWeekEnd, "MMM d, yyyy")}
                </span>
                {isCurrentWeek && (
                  <span className="text-xs text-primary font-medium">This week</span>
                )}
              </div>
              {/* Day indicators */}
              <div className="flex gap-1 justify-center">
                {listWeekDays.map((d, i) => {
                  const hasAnalysis = (analysesByDay[d] ?? []).length > 0;
                  const isToday = d === format(now, "yyyy-MM-dd");
                  return (
                    <span
                      key={d}
                      title={`${DAY_NAMES[i]} ${format(new Date(d + "T12:00:00"), "MMM d")}`}
                      className={cn(
                        "inline-flex items-center justify-center w-7 h-7 rounded-lg text-[10px] font-semibold",
                        isToday ? "ring-1 ring-primary/40" : ""
                      )}
                      style={
                        hasAnalysis
                          ? { background: "oklch(0.72 0.22 45 / 0.15)", color: "oklch(0.72 0.22 45)" }
                          : { color: "oklch(0.38 0.005 28)" }
                      }
                    >
                      {DAY_NAMES[i][0]}
                    </span>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setListWeekDate(addWeeks(listWeekDate, 1))}
              disabled={isCurrentWeek}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {!isCurrentWeek && (
            <div className="flex justify-center">
              <button
                onClick={() => setListWeekDate(new Date())}
                className="text-xs font-medium transition-colors"
                style={{ color: "oklch(0.72 0.22 45)" }}
              >
                → Back to current week
              </button>
            </div>
          )}

          {listWeekAnalyses.length === 0 ? (
            <div
              className="rounded-xl p-10 text-center"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <p className="text-sm text-muted-foreground">No analyses this week.</p>
              <Link
                href="/analysis/new"
                className="inline-flex items-center gap-1 text-xs font-medium mt-2 transition-colors"
                style={{ color: "oklch(0.72 0.22 45)" }}
              >
                <Plus className="w-3 h-3" /> Add an analysis
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {listWeekDays
                .filter((d) => (analysesByDay[d] ?? []).length > 0)
                .map((d) => {
                  const dayAnalyses = analysesByDay[d]!;
                  const dayDate = new Date(d + "T12:00:00");
                  const isToday = d === format(now, "yyyy-MM-dd");
                  return (
                    <div key={d} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-semibold", isToday ? "text-primary" : "text-muted-foreground")}>
                          {format(dayDate, "EEEE")}
                        </span>
                        <span className="text-xs text-muted-foreground/50">
                          {format(dayDate, "MMMM d")}
                        </span>
                        {isToday && (
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: "oklch(0.72 0.22 45 / 0.15)", color: "oklch(0.72 0.22 45)" }}
                          >
                            Today
                          </span>
                        )}
                      </div>
                      <Card className="bg-card border-border/50 overflow-hidden">
                        <div className="divide-y divide-border/40">
                          {dayAnalyses.map((analysis) => (
                            <Link
                              key={analysis.id}
                              href={`/analysis/${analysis.id}`}
                              className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 border-l-2 border-transparent hover:border-primary/40 transition-all group"
                            >
                              <div className="w-24 shrink-0">
                                <p className="text-sm font-bold group-hover:text-primary transition-colors">
                                  {analysis.instrument}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">{analysis.market}</p>
                              </div>
                              <div className="w-20 shrink-0">
                                <BiasBadge bias={analysis.bias} />
                              </div>
                              <p className="flex-1 text-xs text-muted-foreground truncate hidden sm:block leading-relaxed">
                                {analysis.thesis}
                              </p>
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
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === "grid" && (
        <>
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-sm">No analyses found.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((analysis) => (
                <Link key={analysis.id} href={`/analysis/${analysis.id}`}>
                  <Card className="bg-card border border-border/50 card-hover h-full">
                    <CardContent className="p-5">
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
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                        {analysis.thesis}
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t border-border/40">
                        <BiasBadge bias={analysis.bias} />
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">{analysis.session}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(analysis.date + "T12:00:00"), "MMM d")}
                          </span>
                        </div>
                      </div>
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
        </>
      )}

      </PageWrapper>
    </div>
  );
}
