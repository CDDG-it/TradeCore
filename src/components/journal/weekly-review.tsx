"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getTrades } from "@/lib/supabase/queries";
import { buildWeekGroups, formatTotalR } from "@/lib/journal/weeks";
import type { TradeJournalEntry } from "@/lib/types";

export function WeeklyReview() {
  const [trades, setTrades] = useState<TradeJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrades().then((t) => { setTrades(t); setLoading(false); });
  }, []);

  const weeks = useMemo(() => buildWeekGroups(trades), [trades]);

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  if (weeks.length === 0) return (
    <div className="bg-card border border-border/50 rounded-xl p-12 text-center">
      <p className="text-sm text-muted-foreground">No trades to review yet.</p>
      <Link href="/journal/new" className="text-xs text-primary hover:underline mt-2 inline-block">
        Log your first trade
      </Link>
    </div>
  );

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {weeks.map((week) => {
        const rColor = week.totalR > 0 ? "text-success" : week.totalR < 0 ? "text-destructive" : "text-warning";
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
                  <span className={cn("text-xl font-black tabular-nums", rColor)}>{formatTotalR(week.totalR)}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
