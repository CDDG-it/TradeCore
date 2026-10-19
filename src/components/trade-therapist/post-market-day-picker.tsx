"use client";

import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { tradeR, formatTotalR } from "@/lib/journal/weeks";
import { netRColor } from "@/lib/journal/colors";
import type { BestTradeListRow } from "@/lib/supabase/queries";
import type { TradeJournalEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

function isReviewed(row?: BestTradeListRow) {
  return Boolean(row && (row.review_step === "complete" || (row.review_step === null && (row.taken_was_best || row.notes.trim() || row.post_market_analysis.trim()))));
}

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
  const [month, setMonth] = useState(() => startOfMonth(new Date(`${date}T12:00:00`)));
  const today = format(new Date(), "yyyy-MM-dd");
  const selected = new Date(`${date}T12:00:00`);
  const first = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const last = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: first, end: last });
  const canAdvance = format(addMonths(month, 1), "yyyy-MM-dd") <= today;
  const selectedEntries = tradesByDay[date] ?? [];
  const selectedNet = selectedEntries.reduce((total, trade) => total + tradeR(trade), 0);

  async function choose(next: string) {
    if (await onSelect(next)) setOpen(false);
  }

  return (
    <Popover.Root open={open} onOpenChange={(next) => {
      setOpen(next);
      if (next) setMonth(startOfMonth(selected));
    }}>
      <Popover.Trigger
        disabled={disabled}
        aria-label="Choose Post Market day"
        className={cn(
          "group/day inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-primary/25 bg-primary/[.07] px-3 text-[11px] font-semibold text-foreground transition-[border-color,background-color,box-shadow] duration-150 hover:border-primary/55 hover:bg-primary/[.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:opacity-50",
          open && "border-primary/55 bg-primary/[.12] shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_18%,transparent)]"
        )}
      >
        <CalendarDays aria-hidden className="size-3.5 text-primary" />
        <span>Change day</span>
        <ChevronDown aria-hidden className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={10} collisionPadding={12} className="z-50 outline-none">
          <Popover.Popup className="w-[min(21rem,calc(100vw-1.5rem))] origin-(--transform-origin) rounded-2xl border border-primary/20 bg-popover p-4 text-popover-foreground shadow-[0_24px_70px_rgba(0,0,0,.5)] outline-none transition-[opacity,transform] duration-200 ease-[var(--ease-out-strong)] data-[starting-style]:-translate-y-1 data-[starting-style]:scale-[.97] data-[starting-style]:opacity-0 data-[ending-style]:-translate-y-1 data-[ending-style]:scale-[.97] data-[ending-style]:opacity-0 motion-reduce:transition-opacity motion-reduce:data-[starting-style]:translate-y-0 motion-reduce:data-[starting-style]:scale-100 motion-reduce:data-[ending-style]:translate-y-0 motion-reduce:data-[ending-style]:scale-100">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Popover.Title className="text-sm font-semibold">Choose a day</Popover.Title>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Browse your Post Market history</p>
              </div>
              <button type="button" onClick={() => void choose(today)} className="rounded-md border border-primary/25 bg-primary/[.08] px-2.5 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/[.16]">Today</button>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
              <button type="button" onClick={() => setMonth(subMonths(month, 1))} aria-label="Previous month" className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"><ChevronLeft className="size-4" /></button>
              <p className="text-xs font-bold tracking-wide">{format(month, "MMMM yyyy")}</p>
              <button type="button" onClick={() => setMonth(addMonths(month, 1))} disabled={!canAdvance} aria-label="Next month" className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:opacity-25"><ChevronRight className="size-4" /></button>
            </div>

            <div className="mt-2 grid grid-cols-7 gap-1 text-center" aria-hidden="true">
              {["M", "T", "W", "T", "F", "S", "S"].map((label, index) => <span key={index} className="py-1 text-[10px] font-semibold text-muted-foreground/70">{label}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1" role="group" aria-label={format(month, "MMMM yyyy")}>
              {days.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const inMonth = day.getMonth() === month.getMonth();
                const entries = tradesByDay[key] ?? [];
                const net = entries.reduce((total, trade) => total + tradeR(trade), 0);
                const reviewed = isReviewed(reviews[key]);
                const active = key === date;
                if (!inMonth) return <span key={key} aria-hidden className="h-10" />;
                return <button
                  key={key}
                  type="button"
                  disabled={key > today}
                  onClick={() => void choose(key)}
                  aria-current={active ? "date" : undefined}
                  aria-label={`${format(day, "EEEE d MMMM yyyy")}, ${entries.length ? `${entries.length} trade${entries.length === 1 ? "" : "s"}, ${formatTotalR(net)}` : "no trades"}, ${reviewed ? "reviewed" : "not reviewed"}`}
                  className={cn(
                    "flex h-10 flex-col items-center justify-center gap-0.5 rounded-lg border border-transparent text-xs font-semibold tabular-nums transition-[border-color,background-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:opacity-25",
                    active ? "border-primary/60 bg-primary/15 text-primary" : "text-foreground/85 hover:border-border/80 hover:bg-white/[.05]",
                    key === today && !active && "text-primary"
                  )}
                >
                  <span>{format(day, "d")}</span>
                  <span className="flex h-1 items-center gap-0.5" aria-hidden="true">
                    {entries.length > 0 && <span className="size-1 rounded-full" style={{ background: netRColor(net) }} />}
                    {reviewed && <span className="size-1 rounded-full bg-primary" />}
                  </span>
                </button>;
              })}
            </div>
            <div className="mt-2 flex items-center gap-4 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-success" />Trade result</span>
              <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-primary" />Reviewed</span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/60 pt-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Selected day</p>
                <p className="mt-0.5 truncate text-xs font-semibold">{format(selected, "EEEE d MMMM")}</p>
              </div>
              <p className="shrink-0 text-right text-[11px] text-muted-foreground">
                {selectedEntries.length ? `${selectedEntries.length} trade${selectedEntries.length === 1 ? "" : "s"} · ` : "No trades"}
                {selectedEntries.length > 0 && <span className="font-semibold" style={{ color: netRColor(selectedNet) }}>{formatTotalR(selectedNet)}</span>}
                <span className="block">{isReviewed(reviews[date]) ? "Reviewed" : "Not reviewed"}</span>
              </p>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
