"use client";

import Link from "next/link";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { tradeR, formatTotalR, instrumentName } from "@/lib/journal/weeks";
import type { TradeJournalEntry } from "@/lib/types";

/** R for a single trade, formatted the way the rest of the journal shows it. */
function tradeRLabel(t: TradeJournalEntry): string {
  return t.result === "win" ? `+${t.rr}R` : t.result === "loss" ? "-1R" : "0R";
}

/**
 * The trades logged on one calendar day, listed so each opens its own log
 * entry. Reached by clicking a day in the month calendar — days with a single
 * trade link straight through, so this only appears when there is a choice.
 */
export function DayTradesDialog({
  date,
  trades,
  open,
  onOpenChange,
}: {
  date: string; // yyyy-MM-dd
  trades: TradeJournalEntry[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const dayR = trades.reduce((s, t) => s + tradeR(t), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-baseline justify-between gap-3 pr-6">
            <span>{format(new Date(date + "T12:00:00"), "EEEE, MMM d")}</span>
            <span
              className={cn(
                "text-base font-black tabular-nums",
                dayR > 0 ? "text-success" : dayR < 0 ? "text-destructive" : "text-warning"
              )}
            >
              {formatTotalR(dayR)}
            </span>
          </DialogTitle>
          <DialogDescription>
            {trades.length} trade{trades.length !== 1 ? "s" : ""} logged — open one to see the full entry.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          {trades.map((t) => (
            <Link
              key={t.id}
              href={`/journal/${t.id}`}
              onClick={() => onOpenChange(false)}
              className="group flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/40"
            >
              {/* Direction */}
              {t.direction === "long"
                ? <TrendingUp className="w-4 h-4 shrink-0 text-success" />
                : <TrendingDown className="w-4 h-4 shrink-0 text-destructive" />}

              {/* Instrument + session */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-none transition-colors group-hover:text-primary">
                  {instrumentName(t.instrument)}
                </p>
                <p className="mt-1 text-[11px] capitalize text-muted-foreground leading-none">
                  {t.session} session
                </p>
              </div>

              {/* Execution quality */}
              {t.execution_quality && (
                <span
                  className={cn(
                    "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                    t.execution_quality === "good"
                      ? "bg-success/15 text-success"
                      : "bg-destructive/15 text-destructive"
                  )}
                >
                  {t.execution_quality === "good" ? "✓" : "✗"}
                </span>
              )}

              {/* R */}
              <span
                className={cn(
                  "w-10 shrink-0 text-right text-sm font-bold tabular-nums",
                  t.result === "win" ? "text-success" : t.result === "loss" ? "text-destructive" : "text-warning"
                )}
              >
                {tradeRLabel(t)}
              </span>

              <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
