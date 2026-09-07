"use client";

import { format } from "date-fns";
import { TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { ScreenshotUpload } from "@/components/screenshot-upload";
import { cn } from "@/lib/utils";
import { instrumentName } from "@/lib/journal/weeks";
import type { TradeJournalEntry } from "@/lib/types";

/** R for a single trade, formatted the way the rest of the journal shows it. */
function tradeRLabel(t: TradeJournalEntry): string {
  return t.result === "win" ? `+${t.rr}R` : t.result === "loss" ? "-1R" : "0R";
}

/**
 * A trade's log entry, read-only, in place. Used wherever the trader is in the
 * middle of writing something (the pre-market drill, a review) and needs to see
 * what actually happened on a trade: the mistakes, the lessons, the charts.
 * Deliberately a dialog rather than a link, so unsaved work is never lost by
 * navigating to the Journal and back.
 */
export function TradeDetailDialog({
  trade, open, onOpenChange,
}: {
  trade: TradeJournalEntry | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const t = trade;

  const notes = t
    ? ([
        { label: "Mistake", text: t.mistakes, tone: "loss" as const },
        { label: "Lesson", text: t.lessons, tone: "neutral" as const },
        { label: "Execution", text: t.execution_notes, tone: "neutral" as const },
        { label: "Mindset", text: t.psychology_notes, tone: "neutral" as const },
      ].filter((n) => n.text?.trim()))
    : [];
  const groups = (t?.screenshot_groups ?? []).filter((g) => g.urls.length > 0);
  const isWin = t?.result === "win";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[86dvh] gap-4 overflow-y-auto sm:max-w-2xl">
        {t && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5 pr-8">
                {t.direction === "long"
                  ? <TrendingUp className="h-4 w-4 shrink-0 text-success" />
                  : <TrendingDown className="h-4 w-4 shrink-0 text-destructive" />}
                <span className="truncate">{instrumentName(t.instrument)}</span>
                <span className={cn(
                  "ml-auto shrink-0 rounded-lg px-2.5 py-1 text-sm font-black tabular-nums",
                  isWin ? "bg-success/12 text-success"
                    : t.result === "loss" ? "bg-destructive/12 text-destructive"
                    : "bg-warning/12 text-warning"
                )}>
                  {tradeRLabel(t)}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                {format(new Date(t.date_time.slice(0, 10) + "T12:00:00"), "EEEE, MMM d")}
                {" · "}{t.session} session
                {t.timeframe ? ` · ${t.timeframe}` : ""}
                {t.execution_time ? ` · ${t.execution_time}${t.execution_end_time ? ` → ${t.execution_end_time}` : ""}` : ""}
              </DialogDescription>
            </DialogHeader>

            {t.confluences?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {t.confluences.map((c) => (
                  <span key={c} className="rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground/80">
                    {c}
                  </span>
                ))}
              </div>
            )}

            {notes.length > 0 ? (
              <div className="space-y-3">
                {notes.map((n) => (
                  <div key={n.label}>
                    <p className={cn(
                      "mb-1 text-[10px] font-bold uppercase tracking-[0.14em]",
                      n.tone === "loss" ? "text-destructive/80" : "text-muted-foreground/80"
                    )}>
                      {n.label}
                    </p>
                    <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/85">
                      {n.text.trim()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] italic text-muted-foreground/70">
                No notes were logged on this trade.
              </p>
            )}

            {groups.length > 0 && (
              <div className="border-t border-border/50 pt-4">
                <ScreenshotUpload groups={groups} onChange={() => {}} readOnly />
              </div>
            )}

            <div className="flex justify-end border-t border-border/50 pt-3">
              <a
                href={`/journal/${t.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
              >
                Open the full entry in a new tab <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
