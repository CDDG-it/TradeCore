"use client";

/**
 * 05 CALENDAR: a real month of US macro releases.
 *
 * Every scheduled release sits on its own date, taken from FRED's published
 * release calendar, so the forward half is a genuine schedule rather than an
 * estimate. A past date carries the print that actually landed on it: matched
 * through FRED's vintage data, not inferred. A future one carries the
 * appointment and nothing else: what a number will be is never guessed, and
 * market consensus (a paid dataset) is absent rather than invented. FRED
 * publishes no clock times, so none are shown.
 *
 * Alongside the releases sit the days the market itself is shut: US and UK
 * exchange holidays and half days, computed from the published rules, so a
 * thin or absent session is visible before it is traded rather than after.
 */
import { useMemo, useState } from "react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  addMonths, isSameMonth, isToday, isBefore, startOfDay, parseISO,
} from "date-fns";
import { useGmi } from "@/lib/gmi/client";
import type { CalendarMonth, CalendarEvent } from "@/lib/gmi/calendar";
import { holidaysByDate, holidayChips, type MarketHoliday } from "@/lib/gmi/holidays";
import { fedEventsByDate } from "@/lib/gmi/fed-events";
import { Pane, Empty, Label, a } from "../pane";

import { releaseValue as fmtVal, releaseUnit } from "../news-context";

const IMPORTANCE: Record<string, string> = {
  high: "var(--destructive)",
  medium: "var(--warning)",
  low: "var(--muted-foreground)",
};

// Fed events ride their own colour, not the red/amber data scale: an FOMC day
// is a different kind of event from a data print, and the cyan accent (the
// desk's "policy / rates" colour) says so at a glance.
const FED_COLOR = "var(--ice)";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// A closure is not an event with an impact rating, so it is deliberately kept
// out of the red/amber importance scale: a hatched, colourless ground reads as
// "no session here" without competing with the releases for attention.
const hatch = (pct: number) =>
  `repeating-linear-gradient(135deg, color-mix(in oklch, var(--muted-foreground) ${pct}%, transparent) 0 1px, transparent 1px 6px)`;
const CLOSED_HATCH = hatch(13);
/** A half day is still a session, so it is marked more lightly than a closure. */
const EARLY_HATCH = hatch(6);

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

  const holidays = useMemo(
    () => holidaysByDate(grid[0], grid[grid.length - 1]),
    [grid]
  );

  const fed = useMemo(
    () => fedEventsByDate(format(grid[0], "yyyy-MM-dd"), format(grid[grid.length - 1], "yyyy-MM-dd")),
    [grid]
  );

  const events = env?.data?.events ?? [];
  const scheduled = events.filter((e) => !e.released).length;
  const selectedEvents = byDate.get(selected) ?? [];
  const selectedHolidays = holidays.get(selected) ?? [];
  const selectedFed = fed.get(selected) ?? [];
  const fomcCount = [...fed.values()].flat().filter((e) => e.kind === "fomc-decision" && isSameMonth(parseISO(e.date), cursor)).length;
  const closures = [...holidays.values()].flat().filter((h) => isSameMonth(parseISO(h.date), cursor)).length;
  const today = startOfDay(new Date());
  const weeks = Math.ceil(grid.length / 7);
  function moveMonth(delta: number) {
    const next = addMonths(cursor, delta);
    setCursor(next);
    setSelected(format(next, "yyyy-MM-dd"));
  }

  return (
    <div className="grid grid-flow-dense grid-cols-1 items-start gap-6 lg:grid-cols-12">
      {/* ── Month ─────────────────────────────────────────────────────── */}
      <Pane
        index="01"
        label={format(cursor, "MMMM yyyy")}
        right={
          <span className="flex flex-wrap items-center gap-3">
            <Label className="hidden tracking-[0.18em] md:inline">
              {events.length} releases · {fomcCount ? `${fomcCount} FOMC · ` : ""}{scheduled} scheduled · {closures} closure{closures === 1 ? "" : "s"}
            </Label>
            <span className="flex items-center gap-1.5">
              <button
                onClick={() => moveMonth(-1)}
                aria-label="Previous month"
                className="min-h-10 rounded-md border border-border/50 px-3 text-xs font-medium text-foreground/80 transition-colors hover:border-primary/50 hover:text-primary"
              >
                Previous
              </button>
              <button
                onClick={() => moveMonth(1)}
                aria-label="Next month"
                className="min-h-10 rounded-md border border-border/50 px-3 text-xs font-medium text-foreground/80 transition-colors hover:border-primary/50 hover:text-primary"
              >
                Next
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
            <span className="text-xs text-muted-foreground">{!env ? "Loading FRED" : env.status === "stale" ? "FRED updates delayed" : env.status === "unavailable" ? "FRED unavailable" : "Source: FRED"}</span>
          </span>
        }
        bodyClassName="flex flex-col p-0"
        className="min-h-[520px] lg:col-span-8"
      >
        {!env ? <Empty label="Loading calendar" /> : env.status === "unavailable" ? (
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
            <div className="grid min-h-0 flex-1 grid-cols-7" style={{ gridTemplateRows: `repeat(${weeks}, minmax(90px, auto))` }}>
              {grid.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const dayEvents = byDate.get(key) ?? [];
                const dayFed = fed.get(key) ?? [];
                const outside = !isSameMonth(day, cursor);
                const past = isBefore(day, today);
                const on = key === selected;
                const dayHolidays = holidays.get(key) ?? [];
                const shut = dayHolidays.some((h) => h.kind === "closed");
                return (
                  <button
                    key={key}
                    onClick={() => { setSelected(key); if (outside) setCursor(startOfMonth(day)); }}
                    aria-label={`${format(day, "EEEE d MMMM yyyy")}, ${dayEvents.length + dayFed.length} releases${dayHolidays.length ? ", market holiday" : ""}`}
                    aria-pressed={on}
                    title={dayHolidays.map((h) => `${h.market}: ${h.name}${h.closes ? ` · closes ${h.closes}` : " · closed"}`).join("\n") || undefined}
                    className={`relative flex min-h-0 flex-col gap-0.5 overflow-hidden border-b border-r border-border/20 p-1.5 text-left transition-colors ${
                      on ? "bg-primary/[0.1]" : "hover:bg-muted/15"
                    } ${outside ? "opacity-25" : past ? "opacity-75" : ""}`}
                  >
                    {dayHolidays.length > 0 && (
                      <span aria-hidden className="absolute inset-0" style={{ background: shut ? CLOSED_HATCH : EARLY_HATCH }} />
                    )}
                    {isToday(day) && <span aria-hidden className="absolute inset-x-0 top-0 h-[2px] bg-primary" />}
                    <span className="relative flex items-baseline gap-1 overflow-hidden">
                      <span className={`text-[12px] font-bold tabular-nums ${isToday(day) ? "text-primary" : "text-foreground/75"}`}>
                        {format(day, "d")}
                      </span>
                      {holidayChips(dayHolidays).map((c) => (
                        <span
                          key={c.key}
                          className={`hidden truncate text-[10px] font-semibold uppercase tracking-wider sm:inline ${
                            c.closed ? "text-foreground/70" : "text-foreground/55"
                          }`}
                        >
                          {c.text}
                        </span>
                      ))}
                    </span>
                    <span className="relative flex min-h-0 flex-1 flex-col gap-[3px] overflow-hidden">
                      {/* Fed events lead the cell: an FOMC day outranks any data
                          print on it. Cyan bar, filled so it reads as its own
                          category, with a small tag on wider screens. */}
                      {dayFed.map((e) => (
                        <span
                          key={`${e.kind}-${e.date}`}
                          className="flex h-[6px] items-center gap-1 truncate border-l-2 pl-1 text-[12px] font-semibold leading-[15px] sm:h-auto sm:py-[1px]"
                          style={{ borderColor: FED_COLOR, background: a(FED_COLOR, e.kind === "fomc-decision" ? 18 : 10), color: FED_COLOR }}
                          title={`${e.title} · ${e.detail}`}
                        >
                          <span className="hidden truncate sm:inline">
                            {e.kind === "fomc-decision" ? "FOMC decision" : "FOMC minutes"}
                          </span>
                        </span>
                      ))}
                      {dayEvents.map((e) => (
                        <span
                          key={e.id}
                          // Filled = the print landed. Hollow = an appointment.
                          // A phone cell is too narrow for the name: the entry
                          // becomes a coloured bar, and the day panel below
                          // spells out what it is.
                          className={`h-[6px] truncate border-l-2 pl-1 text-[12px] leading-[15px] sm:h-auto sm:py-[1px] ${
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

            <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/65">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2" style={{ background: IMPORTANCE.high }} /> high impact</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2" style={{ background: IMPORTANCE.medium }} /> medium</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-3 border-l-2" style={{ borderColor: FED_COLOR, background: a(FED_COLOR, 18) }} /> FOMC / Fed</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-3 border-l-2" style={{ borderColor: IMPORTANCE.high }} /> scheduled, no print yet</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-3 border border-border/60" style={{ background: CLOSED_HATCH }} /> exchange closed</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-3 border border-border/60" style={{ background: EARLY_HATCH }} /> half day</span>
              <span className="ml-auto hidden xl:inline">FRED publishes dates, not clock times</span>
            </div>
          </>
        )}
      </Pane>

      {/* ── The selected day ──────────────────────────────────────────── */}
      <Pane
        index="02"
        label={isToday(parseISO(selected)) ? "Today" : format(parseISO(selected), "EEE d MMM")}
        right={
          <Label className="tracking-[0.18em]">
            {selectedEvents.length + selectedFed.length || "no"} event{selectedEvents.length + selectedFed.length === 1 ? "" : "s"}
          </Label>
        }
        className="min-h-[240px] lg:col-span-4"
      >
        {selectedHolidays.length > 0 && (
          <div className="mb-3 space-y-1.5 border border-border/50 p-2.5" style={{ background: CLOSED_HATCH }}>
            {selectedHolidays.map((h) => (
              <HolidayLine key={`${h.market}-${h.kind}-${h.name}`} holiday={h} />
            ))}
          </div>
        )}

        {/* Fed events sit above the data prints: on a day the FOMC reports,
            that is the headline the desk is reading for. */}
        {selectedFed.length > 0 && (
          <div className="mb-3 space-y-2.5">
            {selectedFed.map((e) => (
              <div key={`${e.kind}-${e.date}`} className="border-l-2 pl-2.5" style={{ borderColor: FED_COLOR }}>
                <div className="flex items-center gap-2">
                  <span className="shrink-0 border px-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ borderColor: a(FED_COLOR, 55), color: FED_COLOR }}>
                    Fed
                  </span>
                  <p className="text-[13px] font-semibold leading-tight text-foreground">{e.title}</p>
                </div>
                <p className="mt-1 text-[12px] leading-snug text-foreground/70">{e.detail}</p>
              </div>
            ))}
          </div>
        )}

        {!env ? <Empty label="Loading releases" /> : env.status === "unavailable" ? <Empty label="Release data unavailable" /> : selectedEvents.length === 0 && selectedFed.length === 0 ? (
          <Empty
            label={selectedHolidays.some((h) => h.kind === "closed") ? "Market closed" : "Nothing scheduled"}
            hint="No U.S. macro release on this date."
          />
        ) : (
          <div className="space-y-3">
            {selectedEvents.map((e) => {
              return (
                <div key={e.id} className="border-l-2 pl-2.5" style={{ borderColor: IMPORTANCE[e.importance] }}>
                  <p className="text-[13px] font-semibold leading-tight text-foreground">{e.label}</p>
                  <p className="mt-0.5 truncate text-[11px] font-semibold uppercase tracking-wider text-foreground/65">
                    {e.releaseName}
                  </p>

                  {e.released && e.actual != null ? (
                    <>
                      <div className="mt-2">
                        <p className="text-xl font-semibold tabular-nums">{fmtVal(e.actual, e.unit)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{e.referenceDate ? format(parseISO(e.referenceDate), "MMM yyyy") : "Period unavailable"} · {releaseUnit(e.unit)}</p>
                      </div>
                      <div className="mt-1.5 flex items-baseline gap-3 text-[12px] tabular-nums">
                        <span className="text-foreground/75">prior {fmtVal(e.previous, e.unit)}</span>
                      </div>
                    </>
                  ) : (
                    <p className="mt-1.5 text-[12px] font-semibold uppercase tracking-wider text-foreground/75">
                      {e.released ? "Released · value not yet available" : "Scheduled · value pending"}
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

/** One closure on the selected day: who is shut, why, and until when. */
function HolidayLine({ holiday }: { holiday: MarketHoliday }) {
  const shut = holiday.kind === "closed";
  return (
    <div className="flex items-baseline gap-2">
      <span className="shrink-0 border border-border/60 px-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground/80">
        {holiday.market}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold leading-tight text-foreground">{holiday.name}</span>
        <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-wider text-foreground/65">
          {shut ? "exchange closed all day" : `half day · closes ${holiday.closes}`}
        </span>
      </span>
    </div>
  );
}
