"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  format, startOfWeek, subWeeks, endOfWeek, startOfDay, subMonths, startOfMonth,
} from "date-fns";
import { Loader2, ArrowRight, CheckCircle2, Circle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTrades, getWeeklyTradeReviews } from "@/lib/supabase/queries";
import { getWeekGroup, formatTotalR } from "@/lib/journal/weeks";
import type { TradeJournalEntry, WeeklyTradeReview } from "@/lib/types";

/**
 * Reviews — the entry point to the weekly and monthly write-ups. Weeks are
 * listed newest first with their result and whether the reflection is done;
 * a review only becomes due once its week has ended, and only a completed one
 * counts toward the MC Mindscore.
 */
export function ReviewsList() {
  const [trades, setTrades] = useState<TradeJournalEntry[] | null>(null);
  const [reviews, setReviews] = useState<WeeklyTradeReview[]>([]);

  useEffect(() => {
    Promise.all([getTrades(), getWeeklyTradeReviews()]).then(([t, r]) => { setTrades(t); setReviews(r); });
  }, []);

  const reviewed = useMemo(
    () => new Set(reviews.filter((r) => r.lessons || r.mistakes || r.prevention_plan).map((r) => r.week_start)),
    [reviews]
  );

  const weeks = useMemo(() => {
    if (!trades) return [];
    const now = new Date();
    return Array.from({ length: 8 }).map((_, i) => {
      const monday = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
      const ws = format(monday, "yyyy-MM-dd");
      const group = getWeekGroup(trades, ws);
      const ended = endOfWeek(monday, { weekStartsOn: 1 }) < startOfDay(now);
      return { ws, group, ended, current: i === 0 };
    });
  }, [trades]);

  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 4 }).map((_, i) => {
      const m = startOfMonth(subMonths(now, i));
      return { key: format(m, "yyyy-MM"), label: format(m, "MMMM yyyy") };
    });
  }, []);

  if (!trades) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  const completedDue = weeks.filter((w) => w.ended);
  const doneCount = completedDue.filter((w) => reviewed.has(w.ws)).length;

  return (
    <div className="grid gap-4 lg:grid-cols-3 items-start">
      {/* Weeks */}
      <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card p-4">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-semibold">Weekly reviews</p>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {doneCount}/{completedDue.length} closed weeks reviewed
          </span>
        </div>
        <div className="mt-3 space-y-1.5">
          {weeks.map(({ ws, group, ended, current }) => {
            const done = reviewed.has(ws);
            return (
              <Link
                key={ws}
                href={`/trade-therapist/review/${ws}`}
                className="group flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/30"
              >
                {!ended ? <Lock className="w-4 h-4 shrink-0 text-primary/70" />
                  : done ? <CheckCircle2 className="w-4 h-4 shrink-0 text-success" />
                  : <Circle className="w-4 h-4 shrink-0 text-muted-foreground/40" />}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold leading-none transition-colors group-hover:text-primary">
                    Week {group.weekNum}
                    {current && <span className="ml-1.5 font-normal text-primary">· current</span>}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground leading-none">{group.rangeLabel}</p>
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">{group.wins}W {group.losses}L</span>
                <span className={cn("w-12 shrink-0 text-right text-xs font-bold tabular-nums",
                  group.totalR > 0 ? "text-success" : group.totalR < 0 ? "text-destructive" : "text-warning")}>
                  {formatTotalR(group.totalR)}
                </span>
                <span className="w-16 shrink-0 text-right text-[10px] font-semibold">
                  {!ended ? <span className="text-primary">Live</span>
                    : done ? <span className="text-success">Done</span>
                    : <span className="text-muted-foreground">To write</span>}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Months */}
      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <p className="text-sm font-semibold">Monthly reviews</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">A rollup of each month&apos;s weeks.</p>
        <div className="mt-3 space-y-1.5">
          {months.map(({ key, label }) => (
            <Link
              key={key}
              href={`/trade-therapist/review/month/${key}`}
              className="group flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/30"
            >
              <span className="flex-1 text-xs font-semibold transition-colors group-hover:text-primary">{label}</span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
