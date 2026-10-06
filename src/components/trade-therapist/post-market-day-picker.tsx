"use client";

import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { addWeeks, eachDayOfInterval, endOfWeek, format, startOfWeek, subWeeks } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { tradeR, formatTotalR } from "@/lib/journal/weeks";
import { netRColor } from "@/lib/journal/colors";
import type { BestTradeListRow } from "@/lib/supabase/queries";
import type { TradeJournalEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

function isReviewed(row?: BestTradeListRow) {
  return Boolean(row && (row.review_step === "complete" || (row.review_step === null && (row.taken_was_best || row.notes.trim() || row.post_market_analysis.trim()))));
}

/** The earlier week chooser, reduced to one compact anchored popover. */
export function PostMarketDayPicker({
  date,
  tradesByDay,
  reviews,
  onSelect,
  disabled,
}: {
  date: string;
  tradesByDay: Record<string, TradeJournalEntry[]>;
  reviews: Record<string, BestTradeListRow>;
  onSelect: (date: string) => Promise<boolean>;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [week, setWeek] = useState(() => new Date(`${date}T12:00:00`));
  const start = startOfWeek(week, { weekStartsOn: 1 });
  const end = endOfWeek(week, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });
  const today = format(new Date(), "yyyy-MM-dd");
  const canAdvance = format(addWeeks(start, 1), "yyyy-MM-dd") <= today;

  async function choose(next: string) {
    if (await onSelect(next)) setOpen(false);
  }

  return (
    <Popover.Root open={open} onOpenChange={(next) => {
      setOpen(next);
      if (next) setWeek(new Date(`${date}T12:00:00`));
    }}>
      <Popover.Trigger
        disabled={disabled}
        aria-label="Choose Post Market day"
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border/70 bg-card/70 px-2.5 text-[11px] font-semibold text-muted-foreground transition-[border-color,color] duration-150 hover:border-primary/40 hover:text-foreground disabled:opacity-50"
      >
        <CalendarDays aria-hidden className="size-3.5 text-primary" />
        <span>Change day</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={8} className="z-50 outline-none">
          <Popover.Popup className="w-[min(19rem,calc(100vw-1.5rem))] origin-(--transform-origin) rounded-xl border border-border/70 bg-popover p-2.5 text-popover-foreground shadow-[0_20px_50px_rgba(0,0,0,.38)] outline-none transition-[opacity,transform] duration-200 ease-[var(--ease-out-strong)] data-[starting-style]:-translate-y-1 data-[starting-style]:scale-[.97] data-[starting-style]:opacity-0 data-[ending-style]:-translate-y-1 data-[ending-style]:scale-[.97] data-[ending-style]:opacity-0 motion-reduce:transition-opacity motion-reduce:data-[starting-style]:translate-y-0 motion-reduce:data-[starting-style]:scale-100 motion-reduce:data-[ending-style]:translate-y-0 motion-reduce:data-[ending-style]:scale-100">
            <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
              <div className="min-w-0">
                <Popover.Title className="text-xs font-semibold">Choose day</Popover.Title>
                <p className="text-[10px] text-muted-foreground">{format(start, "MMM d")} – {format(end, "MMM d, yyyy")}</p>
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => setWeek(subWeeks(week, 1))} aria-label="Previous week" className="flex size-7 items-center justify-center rounded-md border border-border/60 text-muted-foreground hover:text-primary"><ChevronLeft className="size-3.5" /></button>
                <button type="button" onClick={() => setWeek(addWeeks(week, 1))} disabled={!canAdvance} aria-label="Next week" className="flex size-7 items-center justify-center rounded-md border border-border/60 text-muted-foreground hover:text-primary disabled:opacity-30"><ChevronRight className="size-3.5" /></button>
              </div>
            </div>
            <div className="mt-1.5 space-y-0.5">
              {days.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const entries = tradesByDay[key] ?? [];
                const net = entries.reduce((total, trade) => total + tradeR(trade), 0);
                const reviewed = isReviewed(reviews[key]);
                return <button
                  key={key}
                  type="button"
                  disabled={key > today}
                  onClick={() => void choose(key)}
                  aria-current={key === date ? "date" : undefined}
                  className={cn("flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-left text-[11px] transition-colors disabled:opacity-30", key === date ? "bg-primary/10 text-primary" : "hover:bg-white/[.05]")}
                >
                  <span className="w-11 shrink-0 font-semibold">{format(day, "EEE d")}</span>
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{entries.length ? `${entries.length} trade${entries.length === 1 ? "" : "s"}` : "No trades"}</span>
                  {entries.length > 0 && <span className="shrink-0 font-semibold tabular-nums" style={{ color: netRColor(net) }}>{formatTotalR(net)}</span>}
                  <span aria-label={reviewed ? "Reviewed" : "Not reviewed"} title={reviewed ? "Reviewed" : "Not reviewed"} className={cn("size-1.5 shrink-0 rounded-full", reviewed ? "bg-primary" : "bg-border")} />
                </button>;
              })}
            </div>
            <div className="mt-1.5 flex justify-end border-t border-border/60 pt-1.5">
              <button type="button" onClick={() => void choose(today)} className="rounded-md px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary/10">Today</button>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
