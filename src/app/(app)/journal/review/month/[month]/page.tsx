"use client";

import { use, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  format, startOfMonth, endOfMonth, startOfISOWeek, addMonths, subMonths,
} from "date-fns";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getTrades } from "@/lib/supabase/queries";
import { getWeekGroup, tradeR, formatTotalR } from "@/lib/journal/weeks";
import type { TradeJournalEntry } from "@/lib/types";

export default function MonthlyReviewPage({ params }: { params: Promise<{ month: string }> }) {
  const { month } = use(params);
  const [trades, setTrades] = useState<TradeJournalEntry[] | null>(null);

  useEffect(() => {
    getTrades().then(setTrades);
  }, []);

  const isValid = /^\d{4}-\d{2}$/.test(month);
  const monthDate = useMemo(() => (isValid ? new Date(month + "-01T12:00:00") : new Date()), [month, isValid]);

  const { monthTrades, weeks, wins, losses, bes, totalR } = useMemo(() => {
    const all = trades ?? [];
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    const inMonth = all.filter((t) => {
      const d = new Date(t.date_time.slice(0, 10) + "T12:00:00");
      return d >= start && d <= end;
    });
    // Which ISO weeks does this month touch? Derive from the month's trades.
    const weekStarts = [...new Set(
      inMonth.map((t) =>
        format(startOfISOWeek(new Date(t.date_time.slice(0, 10) + "T12:00:00")), "yyyy-MM-dd")
      )
    )].sort();
    return {
      monthTrades: inMonth,
      weeks: weekStarts.map((ws) => getWeekGroup(all, ws)),
      wins: inMonth.filter((t) => t.result === "win").length,
      losses: inMonth.filter((t) => t.result === "loss").length,
      bes: inMonth.filter((t) => t.result === "break-even").length,
      totalR: inMonth.reduce((s, t) => s + tradeR(t), 0),
    };
  }, [trades, monthDate]);

  if (!isValid) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-sm">Invalid month.</p>
        <Link href="/journal" className="text-primary text-sm hover:underline mt-2 inline-block">← Back to journal</Link>
      </div>
    );
  }

  if (trades === null) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  const rColor = totalR > 0 ? "text-success" : totalR < 0 ? "text-destructive" : "text-warning";
  const prevMonth = format(subMonths(monthDate, 1), "yyyy-MM");
  const nextMonth = format(addMonths(monthDate, 1), "yyyy-MM");

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <Link href="/journal" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Journal
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Link href={`/journal/review/month/${prevMonth}`} aria-label="Previous month"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
                <ChevronLeft className="w-3.5 h-3.5" />
              </Link>
              <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                {format(monthDate, "MMMM yyyy")}
              </span>
              <Link href={`/journal/review/month/${nextMonth}`} aria-label="Next month"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-2">Monthly Review</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {monthTrades.length} trade{monthTrades.length !== 1 ? "s" : ""} across {weeks.length} week{weeks.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3 text-sm font-bold">
              <span className="text-success">{wins}W</span>
              <span className="text-destructive">{losses}L</span>
              <span className="text-warning">{bes}BE</span>
            </div>
            <div className="text-right pl-4 border-l border-border/50">
              <p className={cn("text-3xl font-black leading-none", rColor)}>{formatTotalR(totalR)}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mt-1">Month R</p>
            </div>
          </div>
        </div>
      </div>

      {/* Weeks in this month — drill into each week's review */}
      {weeks.length === 0 ? (
        <Card className="bg-card border-border/50">
          <CardContent className="p-12 text-center">
            <p className="text-sm text-muted-foreground">No trades logged this month.</p>
            <Link href="/journal/new" className="text-xs text-primary hover:underline mt-2 inline-block">
              Log a trade
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div>
          <p className="text-sm font-semibold mb-3">Weeks this month</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {weeks.map((week) => {
              const wColor = week.totalR > 0 ? "text-success" : week.totalR < 0 ? "text-destructive" : "text-warning";
              return (
                <Link key={week.weekStart} href={`/journal/review/${week.weekStart}`} className="block">
                  <Card className={cn(
                    "h-full border-2 card-hover",
                    week.totalR > 0 ? "border-success/30" : week.totalR < 0 ? "border-destructive/30" : "border-border/60"
                  )}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                          W{week.weekNum} · {week.year}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                      </div>
                      <p className="text-xs text-muted-foreground">{week.rangeLabel}</p>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2.5 text-sm font-bold">
                          <span className="text-success">{week.wins}W</span>
                          <span className="text-destructive">{week.losses}L</span>
                          <span className="text-warning">{week.bes}BE</span>
                        </div>
                        <span className={cn("text-xl font-black tabular-nums", wColor)}>{formatTotalR(week.totalR)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
