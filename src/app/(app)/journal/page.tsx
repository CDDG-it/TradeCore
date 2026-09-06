"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameMonth, addMonths, subMonths, addWeeks, subWeeks,
  getDay, isToday,
} from "date-fns";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getTrades, getProfile, getBestTradesOfDay } from "@/lib/supabase/queries";
import { BestTradeDayDialog } from "@/components/journal/best-trade-day";
import { MonthAnalytics } from "@/components/journal/month-analytics";
import { DayTradesDialog } from "@/components/journal/day-trades-dialog";
import type { TradeJournalEntry, BestTradeOfDay } from "@/lib/types";
import { cn } from "@/lib/utils";
import { tradeR, formatTotalR, instrumentName } from "@/lib/journal/weeks";
import {
  inOrder, resultColor, resultBands, netRColor, alpha,
  WIN_COLOR, LOSS_COLOR, BE_COLOR,
} from "@/lib/journal/colors";

type CalendarPeriod = "month" | "week";

/** Footer control on each week-view day cell — opens the Best-trade-of-the-day
 *  dialog and reflects whether that day already has an entry. */
function BestTradeCellButton({ best, onClick }: { best?: BestTradeOfDay; onClick: () => void }) {
  const taken = best?.taken_was_best;
  const logged = best && !taken;
  return (
    <button
      type="button"
      onClick={onClick}
      title="Best trade of the day"
      className={cn(
        "mt-auto w-full inline-flex items-center justify-center rounded-lg px-1.5 py-1.5 text-[10px] font-semibold transition-colors border",
        taken
          ? "border-success/40 bg-success/12 text-success"
          : logged
            ? "border-primary/40 bg-primary/12 text-primary"
            : "border-transparent bg-muted/40 text-muted-foreground/70 hover:text-foreground hover:bg-muted"
      )}
    >
      <span className="truncate">{taken ? "Best taken" : logged ? "Best logged" : "Best trade"}</span>
    </button>
  );
}

export default function JournalPage() {
  const router = useRouter();
  const [allTrades, setAllTrades] = useState<TradeJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [userId, setUserId] = useState<string | null>(null);
  const [bestTrades, setBestTrades] = useState<Record<string, BestTradeOfDay>>({});
  const [btdDate, setBtdDate] = useState<string | null>(null); // open dialog for this date
  const [dayTradesDate, setDayTradesDate] = useState<string | null>(null); // month view: inspect a day's trades

  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarPeriod, setCalendarPeriod] = useState<CalendarPeriod>("month");
  const [calendarWeekDate, setCalendarWeekDate] = useState(new Date());

  useEffect(() => {
    getTrades().then(setAllTrades).finally(() => setLoading(false));
    getProfile().then((p) => { if (p?.id) setUserId(p.id); });
    getBestTradesOfDay().then((rows) => {
      setBestTrades(Object.fromEntries(rows.map((r) => [r.date, r])));
    });
  }, []);

  // Deep link from the dashboard: /journal?day=YYYY-MM-DD jumps straight to that
  // day's log — through to the entry when the day holds one trade, to the day
  // picker when it holds several.
  useEffect(() => {
    if (!allTrades.length) return;
    const day = new URLSearchParams(window.location.search).get("day");
    if (!day) return;
    const dayTrades = allTrades.filter((t) => t.date_time.slice(0, 10) === day);
    if (dayTrades.length === 1) router.replace(`/journal/${dayTrades[0].id}`);
    else if (dayTrades.length > 1) {
      setCalendarMonth(new Date(day + "T12:00:00"));
      setDayTradesDate(day);
    }
  }, [allTrades, router]);

  // Reflect a saved/cleared best-trade entry without a full refetch.
  function applyBestTrade(date: string, entry: BestTradeOfDay | null) {
    setBestTrades((prev) => {
      const next = { ...prev };
      if (entry) next[date] = entry;
      else delete next[date];
      return next;
    });
  }

  // Calendar helpers — month view
  const calMonthStart = startOfMonth(calendarMonth);
  const calMonthEnd = endOfMonth(calendarMonth);
  const calDays = eachDayOfInterval({ start: calMonthStart, end: calMonthEnd });
  const startPad = (getDay(calMonthStart) + 6) % 7; // Mon-start

  // Calendar helpers — week view
  const calWeekStart = startOfWeek(calendarWeekDate, { weekStartsOn: 1 });
  const calWeekEnd = endOfWeek(calendarWeekDate, { weekStartsOn: 1 });
  const calWeekDays = eachDayOfInterval({ start: calWeekStart, end: calWeekEnd });

  const tradesByDay = useMemo(() => {
    const map: Record<string, typeof allTrades> = {};
    allTrades.forEach((t) => {
      const key = t.date_time.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    // Earliest trade first, so a day always reads in the order it happened.
    for (const key of Object.keys(map)) map[key] = inOrder(map[key]);
    return map;
  }, [allTrades]);

  /** Trades inside the month on screen — powers the analytics panel. */
  const monthTrades = useMemo(
    () => allTrades.filter((t) => {
      const d = new Date(t.date_time.slice(0, 10) + "T12:00:00");
      return d >= calMonthStart && d <= calMonthEnd;
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allTrades, calendarMonth]
  );

  // Total R for the currently displayed calendar period (matches what's on screen).
  // Wins count their R:R, losses -1R, break-even 0R — via the shared tradeR helper,
  // so calendar and weekly views can never disagree.
  const calendarR = useMemo(() => {
    const start = calendarPeriod === "month" ? calMonthStart : calWeekStart;
    const end = calendarPeriod === "month" ? calMonthEnd : calWeekEnd;
    return allTrades.reduce((sum, t) => {
      const d = new Date(t.date_time.slice(0, 10) + "T12:00:00");
      return d >= start && d <= end ? sum + tradeR(t) : sum;
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTrades, calendarPeriod, calendarMonth, calendarWeekDate]);

  // Calendar navigation
  function prevCalendar() {
    if (calendarPeriod === "month") setCalendarMonth(subMonths(calendarMonth, 1));
    else setCalendarWeekDate(subWeeks(calendarWeekDate, 1));
  }
  function nextCalendar() {
    if (calendarPeriod === "month") setCalendarMonth(addMonths(calendarMonth, 1));
    else setCalendarWeekDate(addWeeks(calendarWeekDate, 1));
  }

  const calendarTitle = calendarPeriod === "month"
    ? format(calendarMonth, "MMMM yyyy")
    : `${format(calWeekStart, "MMM d")} – ${format(calWeekEnd, "MMM d, yyyy")}`;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  /** Navigation header — shared by both calendar periods. */
  const calendarNav = (
    <>
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border/40 bg-gradient-to-b from-muted/25 to-transparent">
        <button onClick={prevCalendar} aria-label="Previous"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <p className="text-sm font-semibold tracking-tight">{calendarTitle}</p>
          <div className="flex rounded-lg bg-muted/40 p-0.5">
            {(["month", "week"] as const).map((p) => (
              <button key={p} onClick={() => setCalendarPeriod(p)}
                className={cn("rounded-md px-2.5 py-0.5 text-[11px] font-medium capitalize transition-all",
                  calendarPeriod === p
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground")}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Period R — week view only; in month view the analytics panel
              beside the grid already carries the month's net R. */}
          {calendarPeriod === "week" && (
            <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/20 px-2 py-1">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/80">Week R</span>
              <span className={cn("text-xs font-bold tabular-nums",
                calendarR > 0 ? "text-success" : calendarR < 0 ? "text-destructive" : "text-muted-foreground")}>
                {formatTotalR(calendarR)}
              </span>
            </div>
          )}
          <button onClick={nextCalendar} aria-label="Next"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* Compact R summary for narrow screens — week view only */}
      {calendarPeriod === "week" && (
        <div className="flex sm:hidden items-center justify-end gap-2 px-4 pt-1.5">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/80">Week R</span>
          <span className={cn("text-xs font-bold tabular-nums",
            calendarR > 0 ? "text-success" : calendarR < 0 ? "text-destructive" : "text-muted-foreground")}>
            {formatTotalR(calendarR)}
          </span>
        </div>
      )}
    </>
  );

  /**
   * Month grid — the same vocabulary the dashboard week strip and the Trade
   * Therapist calendar already speak, so a day reads identically wherever you
   * meet it: the tile is banded once per trade, a 3px rail on top carries each
   * trade's result, and a count pill says how many there were. A day with two
   * trades can never be mistaken for a day with one.
   */
  const monthGrid = (
    <CardContent className="p-2.5 sm:p-3">
      <div className="mb-1.5 grid grid-cols-7 gap-1.5">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            <span className="sm:hidden">{d[0]}</span>
            <span className="hidden sm:inline">{d}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {calDays.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayTrades = inOrder(tradesByDay[key] || []);
          const isCurrentMonth = isSameMonth(day, calendarMonth);
          const has = dayTrades.length > 0;
          const dayR = dayTrades.reduce((s, t) => s + tradeR(t), 0);
          const netColor = netRColor(dayR);
          const goodCount = dayTrades.filter((t) => t.execution_quality === "good").length;
          const badCount = dayTrades.filter((t) => t.execution_quality === "bad").length;
          const today = isToday(day);

          const tileClass = cn(
            "group/day relative flex min-h-[74px] flex-col overflow-hidden rounded-xl border px-1.5 pb-1 pt-1.5 text-left xl:min-h-[96px]",
            "transition-all duration-300 ease-out",
            today ? "border-primary/55" : has ? "border-border/70" : "border-border/25",
            !has && !today && "bg-muted/5",
            has && "cursor-pointer hover:-translate-y-0.5 hover:border-primary/40"
          );

          const tileInner = (
            <>
              {/* Result rail — one full-strength segment per trade, in the order
                  they were taken. */}
              {has && (
                <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 flex h-[3px] gap-px">
                  {dayTrades.map((t) => {
                    const c = resultColor(t);
                    return (
                      <span
                        key={t.id}
                        className="flex-1 transition-[filter] duration-300 group-hover/day:brightness-125"
                        style={{ background: c, boxShadow: `0 0 8px ${alpha(c, 45)}` }}
                      />
                    );
                  })}
                </span>
              )}
              {/* Hairlines between the bands, so two trades read as two halves
                  rather than one blended wash. */}
              {dayTrades.length > 1 && (
                <span aria-hidden className="pointer-events-none absolute inset-0">
                  {dayTrades.slice(1).map((t, i) => (
                    <span
                      key={t.id}
                      className="absolute inset-y-0 w-px"
                      style={{
                        left: `${(((i + 1) / dayTrades.length) * 100).toFixed(3)}%`,
                        background: `linear-gradient(180deg, transparent, ${alpha("var(--foreground)", 12)} 30%, transparent)`,
                      }}
                    />
                  ))}
                </span>
              )}
              {/* Hover floor in the day's net colour. */}
              {has && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/day:opacity-100"
                  style={{ background: `radial-gradient(120% 90% at 50% 100%, ${alpha(netColor, 18)}, transparent 65%)` }}
                />
              )}

              <div className="relative flex items-start justify-between gap-1 leading-none">
                <span className={cn("text-xs font-bold tabular-nums",
                  today ? "text-primary" : isCurrentMonth ? "text-foreground/75" : "text-muted-foreground/30")}>
                  {format(day, "d")}
                </span>
                {/* How many trades that day — the pill only appears when there
                    was more than one, so it reads as an exception. */}
                {dayTrades.length > 1 && (
                  <span className="shrink-0 rounded-full border border-border/70 bg-background/60 px-1 text-[9px] font-bold leading-[14px] text-foreground/70">
                    {dayTrades.length}
                  </span>
                )}
              </div>

              {has && (
                <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center">
                  <span
                    className="text-[15px] font-black leading-none tabular-nums transition-transform duration-300 group-hover/day:scale-105 xl:text-lg"
                    style={{ color: netColor }}
                  >
                    {formatTotalR(dayR)}
                  </span>
                  {(goodCount > 0 || badCount > 0) && (
                    <span className="mt-1 flex items-center gap-1 text-[9px] font-bold leading-none tabular-nums">
                      {goodCount > 0 && <span className="text-success/85">✓{goodCount}</span>}
                      {badCount > 0 && <span className="text-destructive/85">✗{badCount}</span>}
                    </span>
                  )}
                </div>
              )}
            </>
          );

          // A day with trades opens its log: straight through when there is only
          // one, via a picker when the day holds several.
          if (dayTrades.length === 1) {
            const only = dayTrades[0];
            return (
              <Link
                key={key}
                href={`/journal/${only.id}`}
                title={`Open ${instrumentName(only.instrument)} log`}
                className={tileClass}
                style={{ background: resultBands(dayTrades, 12) }}
              >
                {tileInner}
              </Link>
            );
          }
          if (dayTrades.length > 1) {
            return (
              <button
                key={key}
                type="button"
                onClick={() => setDayTradesDate(key)}
                title={`${dayTrades.length} trades — open the day`}
                className={tileClass}
                style={{ background: resultBands(dayTrades, 12) }}
              >
                {tileInner}
              </button>
            );
          }
          return <div key={key} className={tileClass}>{tileInner}</div>;
        })}
      </div>
      {/* Legend — the month grid now carries per-trade colour, so it needs the
          same key the week view has. */}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/40 pt-2 text-[10px] text-muted-foreground/70">
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: WIN_COLOR }} />Win</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: LOSS_COLOR }} />Loss</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: BE_COLOR }} />B/E</span>
        <span className="text-muted-foreground/50">A split tile = several trades that day</span>
      </div>
    </CardContent>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Trading"
        title="Journal"
        subtitle="Your complete trade history"
        action={
          <Link
            href="/journal/new"
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-px shrink-0"
            style={{
              background: "var(--primary)",
              color: "var(--on-brand)",
              boxShadow: "0 4px 14px color-mix(in oklch, var(--primary) 30%, transparent)",
            }}
          >
            <Plus className="w-4 h-4" /> Log trade
          </Link>
        }
      />
      <PageWrapper>
        {calendarPeriod === "month" ? (
          /* Month: compact calendar on the left, this month's analytics on the right */
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_330px] items-stretch">
            <Card className="bg-card border-border/50 overflow-hidden self-start w-full">
              {calendarNav}
              {monthGrid}
            </Card>
            <MonthAnalytics trades={monthTrades} monthLabel={format(calendarMonth, "MMMM yyyy")} />
          </div>
        ) : (
          /* Week: one column per day, each a self-contained card. Same
             vocabulary as the month grid and the dashboard week strip — a
             result rail per trade on top, the day's net R in the header, then
             one compact rail per trade so a four-trade day stays readable. */
          <div className="space-y-4">
            <Card className="bg-card border-border/50 overflow-hidden">
              {calendarNav}
              <CardContent className="p-2.5 sm:p-3">
                {/* Phone: a week is a list of days. Seven columns on a 375px
                    screen leaves ~46px per day, which truncates every
                    instrument name — so the same data is laid out in rows,
                    and days without trades collapse to a single line. */}
                <div className="flex flex-col gap-1.5 sm:hidden">
                  {calWeekDays.map((day) => {
                    const key = format(day, "yyyy-MM-dd");
                    const dayTrades = inOrder(tradesByDay[key] || []);
                    const has = dayTrades.length > 0;
                    const dayR = dayTrades.reduce((sum, t) => sum + tradeR(t), 0);
                    const netColor = netRColor(dayR);
                    const today = isToday(day);
                    return (
                      <div
                        key={key}
                        className={cn(
                          "overflow-hidden rounded-xl border",
                          today ? "border-primary/55" : has ? "border-border/70" : "border-border/30"
                        )}
                        style={has ? { background: alpha(netColor, 7) } : undefined}
                      >
                        <div className={cn(
                          "flex items-center gap-2 px-2.5 py-2",
                          has && "border-b",
                          has && (today ? "border-primary/25" : "border-border/40")
                        )}>
                          <span className={cn("w-16 shrink-0 text-[11px] font-bold uppercase tracking-wide",
                            today ? "text-primary" : "text-foreground/80")}>
                            {format(day, "EEE d")}
                          </span>
                          {has ? (
                            <>
                              <span className="text-sm font-black tabular-nums" style={{ color: netColor }}>
                                {formatTotalR(dayR)}
                              </span>
                              <span className="text-[11px] text-muted-foreground/70">
                                {dayTrades.length} trade{dayTrades.length !== 1 ? "s" : ""}
                              </span>
                            </>
                          ) : (
                            <span className="text-[11px] text-muted-foreground/40">No trades</span>
                          )}
                          <span className="ml-auto w-24 shrink-0">
                            <BestTradeCellButton best={bestTrades[key]} onClick={() => setBtdDate(key)} />
                          </span>
                        </div>

                        {has && (
                          <div className="flex flex-col gap-1 p-1.5">
                            {dayTrades.map((t) => {
                              const c = resultColor(t);
                              return (
                                <Link
                                  key={t.id}
                                  href={`/journal/${t.id}`}
                                  className="flex items-center gap-2 rounded-md border-l-2 bg-background/30 py-1.5 pl-2 pr-2 transition-colors active:bg-background/60"
                                  style={{ borderColor: c }}
                                >
                                  <span className="min-w-0 flex-1 truncate text-xs font-bold text-foreground">
                                    {instrumentName(t.instrument)}
                                  </span>
                                  {t.execution_quality && (
                                    <span
                                      className="shrink-0 text-[10px] font-semibold uppercase tracking-wide"
                                      style={{ color: t.execution_quality === "good" ? WIN_COLOR : LOSS_COLOR }}
                                    >
                                      {t.execution_quality === "good" ? "✓ good exec" : "✗ bad exec"}
                                    </span>
                                  )}
                                  <span className="shrink-0 text-xs font-black tabular-nums" style={{ color: c }}>
                                    {t.result === "win" ? `+${t.rr}R` : t.result === "loss" ? "-1R" : "0R"}
                                  </span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Tablet and up: one column per day. */}
                <div className="hidden grid-cols-7 gap-1.5 sm:grid sm:gap-2">
                  {calWeekDays.map((day) => {
                    const key = format(day, "yyyy-MM-dd");
                    const dayTrades = inOrder(tradesByDay[key] || []);
                    const has = dayTrades.length > 0;
                    const dayR = dayTrades.reduce((sum, t) => sum + tradeR(t), 0);
                    const netColor = netRColor(dayR);
                    const best = bestTrades[key];
                    const today = isToday(day);
                    return (
                      <div
                        key={key}
                        className={cn(
                          "group/day relative flex min-h-[210px] flex-col overflow-hidden rounded-xl border transition-colors lg:min-h-[280px]",
                          today ? "border-primary/55" : has ? "border-border/70" : "border-border/30"
                        )}
                        /* A tall column is stacked, not banded: horizontal
                           bands would run across the trades instead of with
                           them. The day takes one soft tint in its net colour;
                           the per-trade colour lives on the rails below. */
                        style={has ? { background: alpha(netColor, 7) } : undefined}
                      >
                        {/* Result rail — one segment per trade, in order taken. */}
                        {has && (
                          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 flex h-[3px] gap-px">
                            {dayTrades.map((t) => {
                              const c = resultColor(t);
                              return (
                                <span
                                  key={t.id}
                                  className="flex-1"
                                  style={{ background: c, boxShadow: `0 0 8px ${alpha(c, 45)}` }}
                                />
                              );
                            })}
                          </span>
                        )}

                        {/* Day header — lives inside the card, so the date can
                            never drift away from the day it labels. */}
                        <div className={cn(
                          "relative flex flex-col items-center border-b px-1 pb-1.5 pt-2",
                          today ? "border-primary/25" : "border-border/40"
                        )}>
                          <span className={cn("text-[9px] font-semibold uppercase tracking-wider",
                            today ? "text-primary/80" : "text-muted-foreground/60")}>
                            {format(day, "EEE")}
                          </span>
                          <span className={cn("mt-0.5 text-lg font-bold leading-none tabular-nums",
                            today ? "text-primary" : "text-foreground/85")}>
                            {format(day, "d")}
                          </span>
                          {has && (
                            <span className="mt-1 flex items-center gap-1">
                              <span className="text-[11px] font-black leading-none tabular-nums" style={{ color: netColor }}>
                                {formatTotalR(dayR)}
                              </span>
                              {dayTrades.length > 1 && (
                                <span className="rounded-full border border-border/70 bg-background/50 px-1 text-[9px] font-bold leading-[13px] text-muted-foreground/80">
                                  {dayTrades.length}
                                </span>
                              )}
                            </span>
                          )}
                        </div>

                        <div className="relative flex min-h-0 flex-1 flex-col gap-1 p-1.5">
                          {!has ? (
                            <span className="m-auto text-[10px] text-muted-foreground/25">—</span>
                          ) : (
                            dayTrades.map((t) => {
                              const c = resultColor(t);
                              return (
                                <Link
                                  key={t.id}
                                  href={`/journal/${t.id}`}
                                  title={`${instrumentName(t.instrument)} — open log`}
                                  className="rounded-md border-l-2 bg-background/30 py-1.5 pl-1.5 pr-1 leading-tight transition-colors hover:bg-background/60"
                                  style={{ borderColor: c }}
                                >
                                  <div className="flex items-baseline justify-between gap-1">
                                    <p className="truncate text-[11px] font-bold text-foreground">
                                      {instrumentName(t.instrument)}
                                    </p>
                                    <p className="shrink-0 text-[11px] font-black tabular-nums" style={{ color: c }}>
                                      {t.result === "win" ? `+${t.rr}R` : t.result === "loss" ? "-1R" : "0R"}
                                    </p>
                                  </div>
                                  {t.execution_quality && (
                                    <p
                                      className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide"
                                      style={{ color: t.execution_quality === "good" ? WIN_COLOR : LOSS_COLOR }}
                                    >
                                      {t.execution_quality === "good" ? "✓ good exec" : "✗ bad exec"}
                                    </p>
                                  )}
                                </Link>
                              );
                            })
                          )}

                          {/* Best trade of the day — available on every day */}
                          <BestTradeCellButton best={best} onClick={() => setBtdDate(key)} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Legend — matches the month grid's, plus the execution marks the
                per-trade rails carry. */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground/70">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: WIN_COLOR }} />Win</span>
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: LOSS_COLOR }} />Loss</span>
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: BE_COLOR }} />B/E</span>
              <span className="text-muted-foreground/50">✓ good execution · ✗ bad execution</span>
            </div>
          </div>
        )}
      </PageWrapper>

      {dayTradesDate && (
        <DayTradesDialog
          date={dayTradesDate}
          trades={tradesByDay[dayTradesDate] ?? []}
          open={dayTradesDate !== null}
          onOpenChange={(v) => { if (!v) setDayTradesDate(null); }}
        />
      )}

      {btdDate && (
        <BestTradeDayDialog
          date={btdDate}
          userId={userId}
          open={btdDate !== null}
          onOpenChange={(v) => { if (!v) setBtdDate(null); }}
          onSaved={(entry) => applyBestTrade(btdDate, entry)}
        />
      )}
    </div>
  );
}
