"use client";

/**
 * CALENDAR — a real month calendar of US macro releases.
 *
 * Every scheduled release sits on its own date, taken from FRED's published
 * release calendar, so the forward half is a genuine schedule rather than an
 * estimate. A past date carries the print that actually landed on it (actual
 * and prior); a future one carries nothing but the appointment — what a number
 * will be is never guessed, and market consensus (a paid dataset) is absent
 * rather than invented. FRED publishes no clock times, so none are shown.
 */
import { useMemo, useState } from "react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  addMonths, isSameMonth, isToday, isBefore, startOfDay, parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useGmi, toneFor } from "@/lib/gmi/client";
import type { CalendarMonth, CalendarEvent } from "@/lib/gmi/calendar";
import { Panel, Unavailable, a } from "../panel";

const IMPORTANCE: Record<string, { label: string; color: string }> = {
  high: { label: "High", color: "var(--destructive)" },
  medium: { label: "Medium", color: "var(--warning)" },
  low: { label: "Low", color: "var(--muted-foreground)" },
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
  if (unit === "kpersons") return `${s}${v.toFixed(0)}k`; // FRED already in thousands
  if (unit === "count") return `${s}${Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(v)}`;
  return `${s}${fmtVal(v, unit)}`;
}

/** Direction mark for a change — an icon, never a glyph. */
function Delta({ value, unit }: { value: number; unit: string }) {
  const Icon = value > 0 ? ArrowUp : value < 0 ? ArrowDown : Minus;
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold tabular-nums" style={{ color: toneFor(value) }}>
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {fmtDelta(value, unit)} vs prior
    </span>
  );
}

export function CalendarTab() {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const monthKey = format(cursor, "yyyy-MM");
  const { env } = useGmi<CalendarMonth>(`/api/gmi/calendar?month=${monthKey}`, 30 * 60_000);
  const [selected, setSelected] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));

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

  const selectedEvents = byDate.get(selected) ?? [];
  const today = startOfDay(new Date());
  const monthEvents = env?.data?.events ?? [];
  const upcoming = monthEvents.filter((e) => !e.released).length;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.75fr_1fr]">
      <Panel
        eyebrow="Macro"
        title={format(cursor, "MMMM yyyy")}
        subtitle={
          env?.status === "unavailable"
            ? undefined
            : `${monthEvents.length} release${monthEvents.length !== 1 ? "s" : ""} · ${upcoming} still scheduled`
        }
        env={env}
        action={
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCursor((c) => addMonths(c, -1))}
              aria-label="Previous month"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCursor((c) => addMonths(c, 1))}
              aria-label="Next month"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            {!isSameMonth(cursor, new Date()) && (
              <button
                onClick={() => { setCursor(startOfMonth(new Date())); setSelected(format(new Date(), "yyyy-MM-dd")); }}
                className="rounded-lg border border-primary/40 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary transition-colors hover:bg-primary/10"
              >
                Today
              </button>
            )}
          </div>
        }
      >
        {env?.status === "unavailable" ? (
          <Unavailable hint="FRED is temporarily unavailable." />
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 pb-1.5">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/60">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {grid.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const events = byDate.get(key) ?? [];
                const outside = !isSameMonth(day, cursor);
                const past = isBefore(day, today);
                const isSelected = key === selected;
                return (
                  <button
                    key={key}
                    onClick={() => setSelected(key)}
                    className={`group relative flex min-h-[76px] flex-col gap-1 rounded-lg border p-1.5 text-left transition-colors ${
                      isSelected
                        ? "border-primary/70 bg-primary/[0.07]"
                        : isToday(day)
                        ? "border-primary/40 hover:border-primary/60"
                        : "border-border/40 hover:border-border hover:bg-muted/15"
                    } ${outside ? "opacity-35" : past ? "opacity-80" : ""}`}
                  >
                    <span
                      className={`text-[11px] font-bold tabular-nums leading-none ${
                        isToday(day) ? "text-primary" : "text-foreground/70"
                      }`}
                    >
                      {format(day, "d")}
                    </span>

                    <span className="flex flex-col gap-0.5">
                      {events.slice(0, 3).map((e) => {
                        const c = IMPORTANCE[e.importance].color;
                        return (
                          <span
                            key={e.id}
                            // Filled = the print has landed. Outlined = an
                            // appointment, nothing published yet.
                            // Phone widths can't hold a legible label, so a day
                            // reads as its coloured marks there and the detail
                            // panel below spells the releases out.
                            className={`flex h-1.5 items-center gap-1 truncate rounded text-[9px] font-medium leading-tight sm:h-auto sm:px-1 sm:py-0.5 ${
                              e.released ? "text-foreground/85" : "border border-dashed text-foreground/70"
                            }`}
                            style={
                              e.released
                                ? { background: a(c, 14), boxShadow: `inset 2px 0 0 ${c}` }
                                : { borderColor: a(c, 45) }
                            }
                          >
                            <span className="hidden truncate sm:inline">{e.label}</span>
                          </span>
                        );
                      })}
                      {events.length > 3 && (
                        <span className="hidden pl-1 text-[9px] text-muted-foreground/60 sm:block">+{events.length - 3} more</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/40 pt-2.5 text-[10px] text-muted-foreground/70">
              {Object.entries(IMPORTANCE).slice(0, 2).map(([k, v]) => (
                <span key={k} className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm" style={{ background: v.color }} /> {v.label} impact
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-3 rounded-sm border border-dashed border-muted-foreground/60" /> Scheduled
              </span>
              <span className="ml-auto">Schedule from FRED · no clock times published</span>
            </div>
          </>
        )}
      </Panel>

      {/* The selected day */}
      <Panel
        eyebrow={isToday(parseISO(selected)) ? "Today" : "Selected day"}
        title={format(parseISO(selected), "EEEE, d MMMM")}
        accent="cyan"
      >
        {selectedEvents.length === 0 ? (
          <Unavailable label="No releases" hint="Nothing on the US macro schedule for this day." />
        ) : (
          <ul className="space-y-2">
            {selectedEvents.map((e) => {
              const cfg = IMPORTANCE[e.importance];
              const delta = e.actual != null && e.previous != null ? e.actual - e.previous : null;
              return (
                <li key={e.id} className="relative overflow-hidden rounded-xl border border-border/50 bg-muted/[0.06] p-3 pl-4">
                  <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ background: cfg.color }} />
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">{e.label}</p>
                      <p className="mt-0.5 truncate text-[10px] text-muted-foreground/70">{e.releaseName}</p>
                    </div>
                    <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider" style={{ color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </div>

                  {e.released && e.actual != null ? (
                    <div className="mt-2.5">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-xl font-bold leading-none tabular-nums text-foreground">
                          {fmtVal(e.actual, e.unit)}
                        </span>
                        {e.referenceDate && (
                          <span className="text-[10px] text-muted-foreground/70">
                            {format(parseISO(e.referenceDate), "MMM yyyy")}
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex items-center gap-3">
                        {delta != null && <Delta value={delta} unit={e.unit} />}
                        <span className="text-[10px] text-muted-foreground/60">
                          Prior <span className="font-mono tabular-nums">{fmtVal(e.previous, e.unit)}</span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2.5 text-[11px] text-muted-foreground/70">
                      {e.released ? "Released — print not yet in the FRED vintage." : "Scheduled. No consensus on the free tier."}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
