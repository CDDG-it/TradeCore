"use client";

import { useState } from "react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  addMonths, subMonths, addWeeks, subWeeks, getDay, isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { frequencyApplies } from "@/lib/habits";
import { HabitGlyph } from "@/components/habit-glyph";
import type { Habit, HabitCompletion } from "@/lib/types";

/**
 * A navigable habit calendar. Page back through earlier weeks/months, see the
 * completion rate per day, and click any day to check habits off for that date
 * (so you can backfill history, not just today).
 */
export function HabitCalendar({
  habits,
  completions,
  onToggle,
}: {
  habits: Habit[];
  completions: HabitCompletion[];
  onToggle: (habitId: string, date: string) => void;
}) {
  const [period, setPeriod] = useState<"month" | "week">("month");
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  const doneSet = new Set(completions.filter((c) => c.completed).map((c) => `${c.habit_id}|${c.date}`));
  const key = (d: Date) => format(d, "yyyy-MM-dd");

  function stat(d: Date) {
    const wd = d.getDay();
    let exp = 0;
    let done = 0;
    for (const h of habits) {
      if (!frequencyApplies(h.frequency, wd)) continue;
      exp += 1;
      if (doneSet.has(`${h.id}|${key(d)}`)) done += 1;
    }
    return { exp, done, pct: exp > 0 ? done / exp : 0 };
  }

  const monthStart = startOfMonth(cursor);
  const monthDays = eachDayOfInterval({ start: monthStart, end: endOfMonth(cursor) });
  const startPad = (getDay(monthStart) + 6) % 7;
  const weekStart = startOfWeek(cursor, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(cursor, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const title = period === "month"
    ? format(cursor, "MMMM yyyy")
    : `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
  const prev = () => setCursor(period === "month" ? subMonths(cursor, 1) : subWeeks(cursor, 1));
  const next = () => setCursor(period === "month" ? addMonths(cursor, 1) : addWeeks(cursor, 1));

  const selDate = new Date(selected + "T12:00:00");
  const selApplicable = habits.filter((h) => frequencyApplies(h.frequency, selDate.getDay()));

  function renderCell(d: Date) {
    const s = stat(d);
    const k = key(d);
    const isSel = k === selected;
    const filled = s.exp > 0 && s.pct > 0;
    // Turquoise "heat" — more habits done = brighter & more saturated tile.
    // Lightness climbs and alpha climbs together so the ramp reads clearly in
    // both dark and light mode. Empty days stay a flat muted panel.
    const light = 0.55 + s.pct * 0.24;
    const chroma = 0.06 + s.pct * 0.09;
    const alpha = 0.22 + s.pct * 0.66;
    const complete = s.exp > 0 && s.pct >= 1;
    return (
      <button
        key={k}
        onClick={() => setSelected(k)}
        title={s.exp > 0 ? `${s.done} of ${s.exp} habits` : undefined}
        className={cn(
          "relative aspect-square rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-colors",
          isSel ? "border-primary/70 ring-1 ring-primary/40"
            : complete ? "border-primary/50"
            : isToday(d) ? "border-primary/40" : "border-border/50 hover:border-primary/30"
        )}
        style={{ background: filled ? `oklch(${light.toFixed(3)} ${chroma.toFixed(3)} 185 / ${alpha.toFixed(2)})` : "var(--muted)" }}
      >
        {complete && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-primary" />}
        <span className={cn("text-xs font-bold leading-none", (filled && s.pct > 0.5) ? "text-white" : isToday(d) ? "text-primary" : "text-foreground")}>{format(d, "d")}</span>
        {s.exp > 0 && (
          <span className={cn("text-[9px] tabular-nums leading-none", (filled && s.pct > 0.5) ? "text-white/80" : "text-muted-foreground")}>{s.done}/{s.exp}</span>
        )}
      </button>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] items-start">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Nav */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/60">
          <button onClick={prev} aria-label="Previous"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-semibold">{title}</p>
            <div className="flex rounded-lg bg-muted/60 p-0.5">
              {(["month", "week"] as const).map((p) => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={cn("rounded-md px-3 py-1 text-xs font-medium capitalize transition-all",
                    period === p ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <button onClick={next} aria-label="Next"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-7 mb-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {period === "month" && Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
            {(period === "month" ? monthDays : weekDays).map((d) => renderCell(d))}
          </div>
        </div>
      </div>

      {/* Selected day - check habits off for any date */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3 lg:sticky lg:top-4">
        <div className="flex items-end justify-between gap-2 border-b border-border/50 pb-3">
          <div>
            <p className="text-sm font-semibold leading-tight">{format(selDate, "EEEE")}</p>
            <p className="text-xs text-muted-foreground">{format(selDate, "MMMM d, yyyy")}</p>
          </div>
          {selApplicable.length > 0 && (
            <span className="text-xs font-bold tabular-nums text-primary">
              {selApplicable.filter((h) => doneSet.has(`${h.id}|${selected}`)).length}/{selApplicable.length}
            </span>
          )}
        </div>
        {selApplicable.length === 0 ? (
          <p className="text-xs text-muted-foreground">No habits scheduled for this day.</p>
        ) : (
          selApplicable.map((h) => {
            const done = doneSet.has(`${h.id}|${selected}`);
            return (
              <button key={h.id} onClick={() => onToggle(h.id, selected)}
                className={cn("w-full flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                  done ? "" : "hover:border-primary/30")}
                style={{
                  background: done ? h.color.replace(")", " / 0.10)") : "var(--secondary)",
                  borderColor: done ? h.color.replace(")", " / 0.35)") : "var(--border)",
                }}>
                <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                  style={{ background: done ? h.color.replace(")", " / 0.20)") : "var(--card)", border: `1px solid ${done ? h.color : "var(--border)"}` }}>
                  {done ? <Check className="w-3.5 h-3.5" style={{ color: h.color }} /> : <HabitGlyph icon={h.icon} className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />}
                </span>
                <span className="flex-1 text-sm truncate">{h.name}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
