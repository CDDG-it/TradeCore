"use client";

/**
 * 05 CALENDAR — a real month of US macro releases.
 *
 * Every scheduled release sits on its own date, taken from FRED's published
 * release calendar, so the forward half is a genuine schedule rather than an
 * estimate. A past date carries the print that actually landed on it — matched
 * through FRED's vintage data, not inferred. A future one carries the
 * appointment and nothing else: what a number will be is never guessed, and
 * market consensus (a paid dataset) is absent rather than invented. FRED
 * publishes no clock times, so none are shown.
 */
import { useMemo, useState } from "react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  addMonths, isSameMonth, isToday, isBefore, startOfDay, parseISO,
} from "date-fns";
import { useGmi, toneFor } from "@/lib/gmi/client";
import type { CalendarMonth, CalendarEvent } from "@/lib/gmi/calendar";
import { Pane, Empty, Label, Meta, Figure, a } from "../pane";

const IMPORTANCE: Record<string, string> = {
  high: "var(--destructive)",
  medium: "var(--warning)",
  low: "var(--muted-foreground)",
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function fmtVal(v: number | null, unit: string): string {
  if (v == null) return "—";
  if (unit === "%") return `${v.toFixed(1)}%`;
  if (unit === "count") return Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(v);
  if (unit === "kpersons") return `${(v / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`;
  if (unit === "$B") return `$${(v / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })}T`;
  if (unit === "$M") return `$${(v / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}B`;
  return v.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function fmtDelta(v: number, unit: string): string {
  const s = v > 0 ? "+" : "";
  if (unit === "%") return `${s}${(v * 100).toFixed(0)}bp`;
  if (unit === "kpersons") return `${s}${v.toFixed(0)}k`;
  if (unit === "count") return `${s}${Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(v)}`;
  return `${s}${fmtVal(v, unit)}`;
}

export function CalendarTab() {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const monthKey = format(cursor, "yyyy-MM");
  const { env } = useGmi<CalendarMonth>(`/api/gmi/calendar?month=${monthKey}`, 30 * 60_000);
  const [selected, setSelected] = useState(() => format(new Date(), "yyyy-MM-dd"));

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of env?.data?.events ?? []) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [env]);

  const grid = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const events = env?.data?.events ?? [];
  const scheduled = events.filter((e) => !e.released).length;
  const selectedEvents = byDate.get(selected) ?? [];
  const today = startOfDay(new Date());
  const weeks = Math.ceil(grid.length / 7);

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-2 lg:grid-cols-12">
      {/* ── Month ─────────────────────────────────────────────────────── */}
      <Pane
        index="01"
        label={format(cursor, "MMMM yyyy")}
        right={
          <span className="flex items-center gap-3">
            <Label className="hidden tracking-[0.18em] md:inline">
              {events.length} releases · {scheduled} scheduled
            </Label>
            <span className="flex items-center gap-1.5">
              <button
                onClick={() => setCursor((c) => addMonths(c, -1))}
                aria-label="Previous month"
                className="border border-border/50 px-2 text-[13px] font-semibold leading-5 text-foreground/80 transition-colors hover:border-primary/50 hover:text-primary"
              >
                &lt;
              </button>
              <button
                onClick={() => setCursor((c) => addMonths(c, 1))}
                aria-label="Next month"
                className="border border-border/50 px-2 text-[13px] font-semibold leading-5 text-foreground/80 transition-colors hover:border-primary/50 hover:text-primary"
              >
                &gt;
              </button>
              {!isSameMonth(cursor, new Date()) && (
                <button
                  onClick={() => { setCursor(startOfMonth(new Date())); setSelected(format(new Date(), "yyyy-MM-dd")); }}
                  className="border-b border-primary pb-px text-[12px] font-semibold uppercase tracking-wider text-primary"
                >
                  Today
                </button>
              )}
            </span>
            <Meta env={env} />
          </span>
        }
        bodyClassName="flex flex-col p-0"
        className="min-h-[420px] lg:col-span-8 xl:col-span-9"
      >
        {env?.status === "unavailable" ? (
          <Empty label="FRED unavailable" />
        ) : (
          <>
            <div className="grid shrink-0 grid-cols-7 border-b border-border/30">
              {WEEKDAYS.map((d) => (
                <div key={d} className="px-2 py-1 text-center text-[11px] font-semibold uppercase tracking-wider text-foreground/65">
                  {d}
                </div>
              ))}
            </div>

            {/* Rows share the height evenly, so the month always fills the pane */}
            <div className="grid min-h-0 flex-1 grid-cols-7" style={{ gridTemplateRows: `repeat(${weeks}, minmax(0, 1fr))` }}>
              {grid.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const dayEvents = byDate.get(key) ?? [];
                const outside = !isSameMonth(day, cursor);
                const past = isBefore(day, today);
                const on = key === selected;
                return (
                  <button
                    key={key}
                    onClick={() => setSelected(key)}
                    className={`relative flex min-h-0 flex-col gap-0.5 overflow-hidden border-b border-r border-border/20 p-1.5 text-left transition-colors ${
                      on ? "bg-primary/[0.1]" : "hover:bg-muted/15"
                    } ${outside ? "opacity-25" : past ? "opacity-75" : ""}`}
                  >
                    {isToday(day) && <span aria-hidden className="absolute inset-x-0 top-0 h-[2px] bg-primary" />}
                    <span className={`text-[12px] font-bold tabular-nums ${isToday(day) ? "text-primary" : "text-foreground/75"}`}>
                      {format(day, "d")}
                    </span>
                    <span className="flex min-h-0 flex-1 flex-col gap-[2px] overflow-hidden">
                      {dayEvents.map((e) => (
                        <span
                          key={e.id}
                          // Filled = the print landed. Hollow = an appointment.
                          className={`truncate border-l-2 pl-1 text-[11px] leading-[13px] ${
                            e.released ? "text-foreground/85" : "text-foreground/80"
                          }`}
                          style={{
                            borderColor: IMPORTANCE[e.importance],
                            background: e.released ? a(IMPORTANCE[e.importance], 12) : "transparent",
                          }}
                          title={`${e.label} · ${e.releaseName}`}
                        >
                          <span className="hidden sm:inline">{e.label}</span>
                        </span>
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex shrink-0 items-center gap-4 border-t border-border/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/65">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2" style={{ background: IMPORTANCE.high }} /> high impact</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2" style={{ background: IMPORTANCE.medium }} /> medium</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-3 border-l-2" style={{ borderColor: IMPORTANCE.high }} /> scheduled, no print yet</span>
              <span className="ml-auto hidden xl:inline">FRED publishes dates, not clock times</span>
            </div>
          </>
        )}
      </Pane>

      {/* ── The selected day ──────────────────────────────────────────── */}
      <Pane
        index="02"
        label={isToday(parseISO(selected)) ? "Today" : format(parseISO(selected), "EEE d MMM")}
        right={<Label className="tracking-[0.18em]">{selectedEvents.length || "no"} releases</Label>}
        scroll
        className="lg:col-span-4 xl:col-span-3"
      >
        {selectedEvents.length === 0 ? (
          <Empty label="Nothing scheduled" hint="No US macro release on this date." />
        ) : (
          <div className="space-y-3">
            {selectedEvents.map((e) => {
              const delta = e.actual != null && e.previous != null ? e.actual - e.previous : null;
              return (
                <div key={e.id} className="border-l-2 pl-2.5" style={{ borderColor: IMPORTANCE[e.importance] }}>
                  <p className="text-[13px] font-semibold leading-tight text-foreground">{e.label}</p>
                  <p className="mt-0.5 truncate text-[11px] font-semibold uppercase tracking-wider text-foreground/65">
                    {e.releaseName}
                  </p>

                  {e.released && e.actual != null ? (
                    <>
                      <div className="mt-2">
                        <Figure
                          size="md"
                          value={fmtVal(e.actual, e.unit)}
                          unit={e.referenceDate ? format(parseISO(e.referenceDate), "MMM yy") : undefined}
                        />
                      </div>
                      <div className="mt-1.5 flex items-baseline gap-3 text-[12px] tabular-nums">
                        {delta != null && (
                          <span style={{ color: toneFor(delta) }}>{fmtDelta(delta, e.unit)} vs prior</span>
                        )}
                        <span className="text-foreground/75">prior {fmtVal(e.previous, e.unit)}</span>
                      </div>
                    </>
                  ) : (
                    <p className="mt-1.5 text-[12px] font-semibold uppercase tracking-wider text-foreground/75">
                      {e.released ? "released · print not yet in the vintage" : "scheduled · no consensus on this tier"}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Pane>
    </div>
  );
}
