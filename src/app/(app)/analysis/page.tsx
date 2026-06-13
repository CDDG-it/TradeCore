"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import {
  format,
  getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek,
  addWeeks, subWeeks,
} from "date-fns";
import {
  Plus, TrendingUp, TrendingDown, Minus, ArrowRight,
  LinkIcon, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAnalyses } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";
import type { Bias, PreTradeAnalysis } from "@/lib/types";

function BiasBadge({ bias }: { bias: Bias }) {
  if (bias === "bullish")
    return (
      <span className="flex items-center gap-1.5 text-success text-sm font-semibold">
        <TrendingUp className="w-4 h-4" /> Bullish
      </span>
    );
  if (bias === "bearish")
    return (
      <span className="flex items-center gap-1.5 text-destructive text-sm font-semibold">
        <TrendingDown className="w-4 h-4" /> Bearish
      </span>
    );
  return (
    <span className="flex items-center gap-1.5 text-warning text-sm font-semibold">
      <Minus className="w-4 h-4" /> Choppy
    </span>
  );
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AnalysisPage() {
  const [allAnalyses, setAllAnalyses] = useState<PreTradeAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [listWeekDate, setListWeekDate] = useState(new Date());

  useEffect(() => {
    getAnalyses().then(setAllAnalyses).finally(() => setLoading(false));
  }, []);

  const now = new Date();

  // Week navigation, Mon→Sun
  const listWeekStart = startOfISOWeek(listWeekDate);
  const listWeekEnd = endOfISOWeek(listWeekDate);
  const listWeekNum = getISOWeek(listWeekDate);

  const listWeekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(listWeekStart);
    d.setDate(listWeekStart.getDate() + i);
    return format(d, "yyyy-MM-dd");
  });

  // Day map — used by the week navigation indicators and the day groups
  const analysesByDay = useMemo(() => {
    const map: Record<string, PreTradeAnalysis[]> = {};
    allAnalyses.forEach((a) => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    return map;
  }, [allAnalyses]);

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

        {/* Week navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setListWeekDate(subWeeks(listWeekDate, 1))}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>

          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2.5">
              <span
                className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                style={{
                  background: "oklch(0.72 0.22 45 / 0.12)",
                  color: "oklch(0.72 0.22 45)",
                }}
              >
                W{listWeekNum}
              </span>
              <span className="text-base font-semibold">
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
                const isTodayDay = d === format(now, "yyyy-MM-dd");
                return (
                  <span
                    key={d}
                    title={`${DAY_NAMES[i]} ${format(new Date(d + "T12:00:00"), "MMM d")}`}
                    className={cn(
                      "inline-flex items-center justify-center w-7 h-7 rounded-lg text-[10px] font-semibold",
                      isTodayDay ? "ring-1 ring-primary/40" : ""
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
            className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
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

        {listWeekDays.filter((d) => (analysesByDay[d] ?? []).length > 0).length === 0 ? (
          <div
            className="rounded-xl p-12 text-center"
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
          <div className="space-y-5">
            {listWeekDays
              .filter((d) => (analysesByDay[d] ?? []).length > 0)
              .map((d) => {
                const dayAnalyses = analysesByDay[d]!;
                const dayDate = new Date(d + "T12:00:00");
                const isTodayDay = d === format(now, "yyyy-MM-dd");
                return (
                  <div key={d} className="space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className={cn("text-sm font-bold", isTodayDay ? "text-primary" : "text-foreground/80")}>
                        {format(dayDate, "EEEE")}
                      </span>
                      <span className="text-sm text-muted-foreground/60">
                        {format(dayDate, "MMMM d")}
                      </span>
                      {isTodayDay && (
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
                            className="flex items-center gap-5 px-6 py-5 hover:bg-muted/30 border-l-2 border-transparent hover:border-primary/50 transition-all group"
                          >
                            <div className="w-28 shrink-0">
                              <p className="text-base font-bold group-hover:text-primary transition-colors">
                                {analysis.instrument}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize mt-0.5">{analysis.market}</p>
                            </div>
                            <div className="w-24 shrink-0">
                              <BiasBadge bias={analysis.bias} />
                            </div>
                            <p className="flex-1 text-sm text-foreground/70 line-clamp-2 hidden sm:block leading-relaxed">
                              {analysis.thesis}
                            </p>
                            <div className="flex items-center gap-3 shrink-0">
                              {analysis.used_for_trade && (
                                <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                                  <LinkIcon className="w-2.5 h-2.5 mr-1" />
                                  Traded
                                </Badge>
                              )}
                              <span className="text-sm text-muted-foreground capitalize hidden md:block">{analysis.session}</span>
                              <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary/60 transition-all group-hover:translate-x-0.5" />
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
