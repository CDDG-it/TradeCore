"use client";

import { useMemo } from "react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, isFuture,
} from "date-fns";
import { ChevronLeft, ChevronRight, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { tradeR, formatTotalR } from "@/lib/journal/weeks";
import type { TradeJournalEntry, BestTradeOfDay } from "@/lib/types";

/**
 * Trade calendar — a month of taken trades and their outcomes, one tile per day.
 * A tile is tinted by the day's net R, notes whether a post-market analysis was
 * written, and opens that day's analysis when clicked.
 */
export function TradeCalendar({
  month, onMonthChange, trades, analysed, onSelectDay,
}: {
  month: Date;
  onMonthChange: (d: Date) => void;
  trades: TradeJournalEntry[];
  /** Set of yyyy-MM-dd that already have a post-market / best-trade entry. */
  analysed: Set<string>;
  onSelectDay: (date: string) => void;
}) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = (getDay(monthStart) + 6) % 7; // Monday-first

  const byDay = useMemo(() => {
    const map = new Map<string, TradeJournalEntry[]>();
    trades.forEach((t) => {
      const k = t.date_time.slice(0, 10);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    });
    return map;
  }, [trades]);

  const monthR = useMemo(() => {
    let r = 0;
    for (const [k, list] of byDay) {
      const d = new Date(k + "T12:00:00");
      if (d >= monthStart && d <= monthEnd) r += list.reduce((s, t) => s + tradeR(t), 0);
    }
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byDay, month]);

  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border/40 bg-gradient-to-b from-muted/25 to-transparent">
        <button onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <p className="text-sm font-semibold tracking-tight">{format(month, "MMMM yyyy")}</p>
          <div className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/20 px-2 py-1">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/80">Month R</span>
            <span className={cn("text-xs font-bold tabular-nums",
              monthR > 0 ? "text-success" : monthR < 0 ? "text-destructive" : "text-muted-foreground")}>
              {formatTotalR(monthR)}
            </span>
          </div>
        </div>
        <button onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="text-center text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayTrades = byDay.get(key) ?? [];
            const has = dayTrades.length > 0;
            const dayR = dayTrades.reduce((s, t) => s + tradeR(t), 0);
            const inMonth = isSameMonth(day, month);
            const future = isFuture(day) && !isToday(day);
            const tone = !has
              ? { text: "", bg: "", ring: "" }
              : dayR > 0
              ? { text: "text-success", bg: "bg-success/10", ring: "border-success/25 hover:border-success/45" }
              : dayR < 0
              ? { text: "text-destructive", bg: "bg-destructive/10", ring: "border-destructive/25 hover:border-destructive/45" }
              : { text: "text-warning", bg: "bg-warning/10", ring: "border-warning/25 hover:border-warning/45" };
            return (
              <button
                key={key}
                type="button"
                disabled={future}
                onClick={() => onSelectDay(key)}
                title={`Open ${format(day, "MMM d")} analysis`}
                className={cn(
                  "relative h-[52px] rounded-md px-1 py-0.5 flex flex-col border text-left transition-all",
                  isToday(day) ? "border-primary/50 bg-primary/8"
                    : has ? cn(tone.bg, tone.ring)
                    : "border-border/25 bg-muted/5",
                  future ? "opacity-30 cursor-default" : "cursor-pointer hover:-translate-y-px"
                )}
              >
                <div className="flex items-start justify-between leading-none">
                  <span className={cn("text-[10px] font-bold",
                    isToday(day) ? "text-primary" : inMonth ? "text-foreground/75" : "text-muted-foreground/30")}>
                    {format(day, "d")}
                  </span>
                  {analysed.has(key) && <PenLine className="w-2.5 h-2.5 text-primary/70" />}
                </div>
                {has && (
                  <div className="flex-1 flex flex-col items-center justify-center min-h-0">
                    <span className={cn("text-[13px] font-black tabular-nums leading-none", tone.text)}>
                      {formatTotalR(dayR)}
                    </span>
                    <span className="text-[8px] text-muted-foreground/60 leading-none mt-0.5">{dayTrades.length}t</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-2.5 flex items-center gap-3 text-[10px] text-muted-foreground/70">
          <span className="inline-flex items-center gap-1"><PenLine className="w-2.5 h-2.5 text-primary/70" /> analysed</span>
          <span>Click any day to open its post-market analysis</span>
        </div>
      </div>
    </div>
  );
}
