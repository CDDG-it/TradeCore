"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameMonth, addMonths, subMonths, addWeeks, subWeeks,
  getDay, isToday,
} from "date-fns";
import { Plus, CalendarCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getTrades, getProfile, getBestTradesOfDay } from "@/lib/supabase/queries";
import { BestTradeDayDialog } from "@/components/journal/best-trade-day";
import { MonthAnalytics } from "@/components/journal/month-analytics";
import type { TradeJournalEntry, BestTradeOfDay } from "@/lib/types";
import { cn } from "@/lib/utils";
import { tradeR, formatTotalR, instrumentName } from "@/lib/journal/weeks";

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
  const [allTrades, setAllTrades] = useState<TradeJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [userId, setUserId] = useState<string | null>(null);
  const [bestTrades, setBestTrades] = useState<Record<string, BestTradeOfDay>>({});
  const [btdDate, setBtdDate] = useState<string | null>(null); // open dialog for this date

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

  // Review is contextual to the calendar: week view → this week's review,
  // month view → the monthly review. Navigate prev/next first to review a past period.
  const reviewHref = calendarPeriod === "month"
    ? `/journal/review/month/${format(calendarMonth, "yyyy-MM")}`
    : `/journal/review/${format(calWeekStart, "yyyy-MM-dd")}`;
  const reviewLabel = calendarPeriod === "month" ? "Monthly review" : "Weekly review";

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
          {/* Contextual review — weekly in week view, monthly in month view */}
          <Link href={reviewHref} title={reviewLabel}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/15">
            <CalendarCheck className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{reviewLabel}</span>
          </Link>
          {/* Period R summary */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/20 px-2 py-1">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              {calendarPeriod === "month" ? "Month R" : "Week R"}
            </span>
            <span className={cn("text-xs font-bold tabular-nums",
              calendarR > 0 ? "text-success" : calendarR < 0 ? "text-destructive" : "text-muted-foreground")}>
              {formatTotalR(calendarR)}
            </span>
          </div>
          <button onClick={nextCalendar} aria-label="Next"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* Compact R summary for narrow screens */}
      <div className="flex sm:hidden items-center justify-end gap-2 px-4 pt-1.5">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/80">
          {calendarPeriod === "month" ? "Month R" : "Week R"}
        </span>
        <span className={cn("text-xs font-bold tabular-nums",
          calendarR > 0 ? "text-success" : calendarR < 0 ? "text-destructive" : "text-muted-foreground")}>
          {formatTotalR(calendarR)}
        </span>
      </div>
    </>
  );

  /** Month grid — compact day tiles, each summarising its net R. */
  const monthGrid = (
    <CardContent className="p-3">
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="text-center text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {calDays.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayTrades = tradesByDay[key] || [];
          const isCurrentMonth = isSameMonth(day, calendarMonth);
          const has = dayTrades.length > 0;
          const dayR = dayTrades.reduce((s, t) => s + tradeR(t), 0);
          const goodCount = dayTrades.filter((t) => t.execution_quality === "good").length;
          const badCount = dayTrades.filter((t) => t.execution_quality === "bad").length;
          // Tile tint + R colour follow the day's net R: green up, red down, amber flat.
          const tone = !has
            ? { text: "", bg: "", ring: "" }
            : dayR > 0
            ? { text: "text-success", bg: "bg-success/10", ring: "border-success/25 hover:border-success/45" }
            : dayR < 0
            ? { text: "text-destructive", bg: "bg-destructive/10", ring: "border-destructive/25 hover:border-destructive/45" }
            : { text: "text-warning", bg: "bg-warning/10", ring: "border-warning/25 hover:border-warning/45" };
          return (
            <div key={key}
              className={cn("h-[46px] rounded-md px-1 py-0.5 flex flex-col border transition-colors",
                isToday(day)
                  ? "border-primary/50 bg-primary/8"
                  : has
                  ? cn(tone.bg, tone.ring)
                  : "border-border/25 bg-muted/5")}>
              <div className="flex items-start justify-between leading-none">
                <span className={cn("text-[10px] font-bold",
                  isToday(day) ? "text-primary" : isCurrentMonth ? "text-foreground/75" : "text-muted-foreground/30")}>
                  {format(day, "d")}
                </span>
                {has && (goodCount > 0 || badCount > 0) && (
                  <span className="flex items-center gap-0.5 text-[8px] font-bold tabular-nums">
                    {goodCount > 0 && <span className="text-success/80">✓{goodCount}</span>}
                    {badCount > 0 && <span className="text-destructive/80">✗{badCount}</span>}
                  </span>
                )}
              </div>
              {has && (
                <div className="flex-1 flex flex-col items-center justify-center min-h-0">
                  <span className={cn("text-[13px] font-black tabular-nums leading-none", tone.text)}>
                    {formatTotalR(dayR)}
                  </span>
                  <span className="text-[8px] text-muted-foreground/60 leading-none mt-0.5">
                    {dayTrades.length}t
                  </span>
                </div>
              )}
            </div>
          );
        })}
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
              background: "#14B8A6",
              color: "oklch(0.07 0.003 28)",
              boxShadow: "0 4px 14px rgba(20,184,166,0.30)",
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
          /* Week: full width, room for each trade */
          <div className="space-y-4">
            <Card className="bg-card border-border/50 overflow-hidden">
              {calendarNav}
              <CardContent className="p-4">
                <div className="grid grid-cols-7 gap-2 mb-3">
                  {calWeekDays.map((day) => (
                    <div key={day.toISOString()} className={cn(
                      "text-center rounded-lg py-2 border",
                      isToday(day) ? "bg-primary/8 border-primary/40" : "border-transparent"
                    )}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{format(day, "EEE")}</p>
                      <p className={cn("text-xl font-extrabold mt-0.5 leading-none",
                        isToday(day) ? "text-primary" : "text-foreground/85")}>
                        {format(day, "d")}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {calWeekDays.map((day) => {
                    const key = format(day, "yyyy-MM-dd");
                    const dayTrades = tradesByDay[key] || [];
                    const best = bestTrades[key];
                    return (
                      <div key={key}
                        className={cn("min-h-[160px] rounded-xl p-1.5 flex flex-col gap-1 transition-colors",
                          isToday(day) ? "bg-primary/4 ring-1 ring-primary/20" : "bg-muted/20"
                        )}>
                        <div className={cn("flex-1 flex flex-col gap-1 min-h-0",
                          dayTrades.length === 0 && "items-center justify-center")}>
                          {dayTrades.length === 0 ? (
                            <span className="text-[10px] text-muted-foreground/30 text-center">—</span>
                          ) : (
                            dayTrades.map((t) => (
                              <Link key={t.id} href={`/journal/${t.id}`}
                                className={cn("flex-1 flex flex-col items-center justify-center gap-1.5 rounded-lg px-1.5 py-2.5 transition-colors min-h-0",
                                  t.result === "win" ? "bg-success/15 hover:bg-success/25"
                                    : t.result === "loss" ? "bg-destructive/15 hover:bg-destructive/25"
                                    : "bg-warning/15 hover:bg-warning/25")}>
                                <p className={cn("text-base font-extrabold text-center leading-tight tracking-tight",
                                  t.result === "win" ? "text-success"
                                    : t.result === "loss" ? "text-destructive"
                                    : "text-warning")}>
                                  {instrumentName(t.instrument)}
                                </p>
                                {t.execution_quality && (
                                  <span className={cn(
                                    "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold leading-none",
                                    t.execution_quality === "good"
                                      ? "bg-success/20 text-success"
                                      : "bg-destructive/20 text-destructive"
                                  )}>
                                    {t.execution_quality === "good" ? "✓ Good" : "✗ Bad"}
                                  </span>
                                )}
                                <p className="text-xs font-semibold text-muted-foreground/80 text-center leading-none">
                                  {t.result === "win" ? `+${t.rr}R` : t.result === "loss" ? "-1R" : "0R"}
                                </p>
                              </Link>
                            ))
                          )}
                        </div>

                        {/* Best trade of the day — available on every day */}
                        <BestTradeCellButton
                          best={best}
                          onClick={() => setBtdDate(key)}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Legend — week view only; the month grid is R-based and self-explanatory */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-success/40" />Win</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-destructive/40" />Loss</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-warning/40" />B/E</span>
              <span className="text-muted-foreground/60">✓ good execution · ✗ bad execution</span>
            </div>
          </div>
        )}
      </PageWrapper>

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
