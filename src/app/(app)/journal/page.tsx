"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay,
  eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, addWeeks, subWeeks,
  getDay, isToday,
} from "date-fns";
import { Plus, TrendingUp, TrendingDown, Calendar, List, CalendarCheck,
  ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTrades, getProfile, getBestTradesOfDay } from "@/lib/supabase/queries";
import { BestTradeDayDialog } from "@/components/journal/best-trade-day";
import type { TradeJournalEntry, BestTradeOfDay } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { TradeResult, Direction } from "@/lib/types";
import { tradeR, formatTotalR } from "@/lib/journal/weeks";

type ViewMode = "list" | "calendar";
type PeriodFilter = "all" | "day" | "week" | "month";
type CalendarPeriod = "month" | "week";
type ExecutionQualityFilter = "all" | "good" | "bad";

// Expand short tickers to the names traders recognise at a glance.
const INSTRUMENT_NAMES: Record<string, string> = {
  NQ: "Nasdaq", MNQ: "Nasdaq",
  ES: "SP500", MES: "SP500",
  GOLD: "Gold", GC: "Gold", XAUUSD: "Gold",
  CL: "Crude Oil",
  EURUSD: "EUR/USD", GBPUSD: "GBP/USD",
  BTC: "Bitcoin",
};
function instrumentName(symbol: string): string {
  return INSTRUMENT_NAMES[(symbol ?? "").toUpperCase()] ?? symbol;
}

function ResultBadge({ result }: { result: TradeResult }) {
  const config = {
    win: "bg-success/15 text-success border-success/20",
    loss: "bg-destructive/15 text-destructive border-destructive/20",
    "break-even": "bg-warning/15 text-warning border-warning/20",
  };
  const labels = { win: "W", loss: "L", "break-even": "BE" };
  return <Badge className={cn("text-xs px-1.5", config[result])}>{labels[result]}</Badge>;
}

// Compact building blocks for the filters popover.
function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-colors border",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-muted/40 text-muted-foreground border-transparent hover:text-foreground hover:bg-muted")}>
      {children}
    </button>
  );
}

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
  const [filterResult, setFilterResult] = useState<TradeResult | "all">("all");
  const [filterExecution, setFilterExecution] = useState<ExecutionQualityFilter>("all");

  const [userId, setUserId] = useState<string | null>(null);
  const [bestTrades, setBestTrades] = useState<Record<string, BestTradeOfDay>>({});
  const [btdDate, setBtdDate] = useState<string | null>(null); // open dialog for this date

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
  const [filterDirection, setFilterDirection] = useState<Direction | "all">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarPeriod, setCalendarPeriod] = useState<CalendarPeriod>("week");
  const [calendarWeekDate, setCalendarWeekDate] = useState(new Date());
  const [showFilters, setShowFilters] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  // Close the filters popover on outside click / Escape.
  useEffect(() => {
    if (!showFilters) return;
    function onClick(e: MouseEvent) {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) setShowFilters(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setShowFilters(false); }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [showFilters]);

  const activeFilterCount =
    (periodFilter !== "all" ? 1 : 0) +
    (filterResult !== "all" ? 1 : 0) +
    (filterDirection !== "all" ? 1 : 0) +
    (filterExecution !== "all" ? 1 : 0);

  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const filtered = useMemo(() => allTrades.filter((t) => {
    const tradeDate = new Date(t.date_time.slice(0, 10) + "T12:00:00");
    const matchResult = filterResult === "all" || t.result === filterResult;
    const matchDir = filterDirection === "all" || t.direction === filterDirection;
    const matchExecution = filterExecution === "all" || t.execution_quality === filterExecution;
    let matchPeriod = true;
    if (periodFilter === "day") matchPeriod = tradeDate >= dayStart && tradeDate <= dayEnd;
    if (periodFilter === "week") matchPeriod = tradeDate >= weekStart && tradeDate <= weekEnd;
    if (periodFilter === "month") matchPeriod = tradeDate >= monthStart && tradeDate <= monthEnd;
    return matchResult && matchDir && matchPeriod && matchExecution;
  }), [allTrades, filterResult, filterDirection, filterExecution, periodFilter]);

  const winTrades = filtered.filter((t) => t.result === "win");
  const wins = winTrades.length;
  const losses = filtered.filter((t) => t.result === "loss").length;
  const bes = filtered.filter((t) => t.result === "break-even").length;
  // Avg R:R only over winning trades — losses are always -1R so excluding them keeps this metric meaningful
  const avgRR = winTrades.length > 0
    ? (winTrades.reduce((s, t) => s + t.rr, 0) / winTrades.length).toFixed(1)
    : "—";

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

  // Total R for the currently displayed calendar period (matches what's on screen).
  // Wins count their R:R, losses -1R, break-even 0R — via the shared tradeR helper,
  // so calendar and list/weekly views can never disagree.
  const calendarR = useMemo(() => {
    const start = calendarPeriod === "month" ? calMonthStart : calWeekStart;
    const end = calendarPeriod === "month" ? calMonthEnd : calWeekEnd;
    return allTrades.reduce((sum, t) => {
      const d = new Date(t.date_time.slice(0, 10) + "T12:00:00");
      return d >= start && d <= end ? sum + tradeR(t) : sum;
    }, 0);
  }, [allTrades, calendarPeriod, calMonthStart, calMonthEnd, calWeekStart, calWeekEnd]);

  const periodLabel = periodFilter === "day"
    ? format(now, "EEEE, MMM d")
    : periodFilter === "week"
    ? `Week of ${format(weekStart, "MMM d")}`
    : periodFilter === "month"
    ? format(now, "MMMM yyyy")
    : "All time";

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

  // Review is now contextual to the calendar: week view → this week's review,
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
      {/* Compact stats strip — list mode only; the calendar speaks for itself */}
      {viewMode === "list" && (
        <div className="inline-flex items-center rounded-lg border border-border/50 bg-card px-1 py-1">
          {[
            { label: "W", value: wins.toString(), color: "text-success" },
            { label: "L", value: losses.toString(), color: "text-destructive" },
            { label: "BE", value: bes.toString(), color: "text-warning" },
            { label: "Avg R:R", value: avgRR, color: "text-primary" },
          ].map(({ label, value, color }, i) => (
            <div key={label} className={cn("flex items-baseline gap-1.5 px-3 py-1", i > 0 && "border-l border-border/40")}>
              <span className={cn("text-lg font-bold tabular-nums", color)}>{value}</span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Primary view toggle — Calendar first, then List */}
        <div className="flex rounded-lg border border-border/50 overflow-hidden">
          <button onClick={() => setViewMode("calendar")}
            className={cn("px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5",
              viewMode === "calendar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
            <Calendar className="w-3.5 h-3.5" /> Calendar
          </button>
          <button onClick={() => setViewMode("list")}
            className={cn("px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5",
              viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
            <List className="w-3.5 h-3.5" /> List
          </button>
        </div>

        {/* Filters — list mode only, tucked into a compact popover menu */}
        {viewMode === "list" && (
          <div className="relative ml-auto" ref={filtersRef}>
            <button onClick={() => setShowFilters((v) => !v)}
              className={cn("inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold shadow-sm transition-all hover:-translate-y-px",
                showFilters || activeFilterCount > 0
                  ? "bg-primary/15 text-primary border-primary/50"
                  : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-muted/40")}>
              <SlidersHorizontal className={cn("w-4 h-4", showFilters || activeFilterCount > 0 ? "text-primary" : "text-primary/80")} />
              Filters
              {activeFilterCount > 0 && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground tabular-nums">
                  {activeFilterCount}
                </span>
              )}
              <ChevronRight className={cn("w-3.5 h-3.5 transition-transform opacity-70", showFilters ? "-rotate-90" : "rotate-90")} />
            </button>

            {showFilters && (
              <div className="absolute right-0 top-full z-40 mt-2 w-72 rounded-xl border border-border/60 bg-card p-3.5 shadow-xl shadow-black/20">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground/80">Filter trades</span>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => { setPeriodFilter("all"); setFilterResult("all"); setFilterDirection("all"); setFilterExecution("all"); }}
                      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground">
                      <X className="w-3 h-3" /> Reset
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <FilterGroup label="Period">
                    {(["all", "day", "week", "month"] as const).map((p) => (
                      <FilterChip key={p} active={periodFilter === p} onClick={() => setPeriodFilter(p)}>
                        {p === "all" ? "All time" : p === "day" ? "Today" : p === "week" ? "This week" : "This month"}
                      </FilterChip>
                    ))}
                  </FilterGroup>

                  <FilterGroup label="Result">
                    {(["all", "win", "loss", "break-even"] as const).map((r) => (
                      <FilterChip key={r} active={filterResult === r} onClick={() => setFilterResult(r)}>
                        {r === "break-even" ? "B/E" : r === "all" ? "All" : r.charAt(0).toUpperCase() + r.slice(1)}
                      </FilterChip>
                    ))}
                  </FilterGroup>

                  <FilterGroup label="Direction">
                    {(["all", "long", "short"] as const).map((d) => (
                      <FilterChip key={d} active={filterDirection === d} onClick={() => setFilterDirection(d)}>
                        <span className="capitalize">{d}</span>
                      </FilterChip>
                    ))}
                  </FilterGroup>

                  <FilterGroup label="Execution">
                    {(["all", "good", "bad"] as const).map((e) => (
                      <FilterChip key={e} active={filterExecution === e} onClick={() => setFilterExecution(e)}>
                        {e === "all" ? "All" : e === "good" ? "✓ Good" : "✗ Bad"}
                      </FilterChip>
                    ))}
                  </FilterGroup>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {periodFilter !== "all" && viewMode === "list" && (
        <p className="text-xs text-muted-foreground -mt-2">
          Showing {filtered.length} trade{filtered.length !== 1 ? "s" : ""} · {periodLabel}
        </p>
      )}

      {/* CALENDAR VIEW */}
      {viewMode === "calendar" && (
        <div className="space-y-4">
          {/* ── Calendar panel: navigation header + grid in one cohesive card ── */}
          <Card className="bg-card border-border/50 overflow-hidden">
            {/* Navigation + period toggle */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/40 bg-gradient-to-b from-muted/25 to-transparent">
              <button onClick={prevCalendar} aria-label="Previous"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm font-semibold tracking-tight">{calendarTitle}</p>
                <div className="flex rounded-lg bg-muted/40 p-0.5">
                  {(["month", "week"] as const).map((p) => (
                    <button key={p} onClick={() => setCalendarPeriod(p)}
                      className={cn("rounded-md px-3 py-1 text-xs font-medium capitalize transition-all",
                        calendarPeriod === p
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground")}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Contextual review — weekly in week view, monthly in month view */}
                <Link href={reviewHref} title={reviewLabel}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15">
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{reviewLabel}</span>
                </Link>
                {/* Period R summary — subtle, top-right of the calendar section */}
                <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                    {calendarPeriod === "month" ? "Month R" : "Week R"}
                  </span>
                  <span className={cn("text-sm font-bold tabular-nums",
                    calendarR > 0 ? "text-success" : calendarR < 0 ? "text-destructive" : "text-muted-foreground")}>
                    {formatTotalR(calendarR)}
                  </span>
                </div>
                <button onClick={nextCalendar} aria-label="Next"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Compact R summary for narrow screens — kept visible, just below the nav */}
            <div className="flex sm:hidden items-center justify-end gap-2 px-4 pb-2 -mt-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                {calendarPeriod === "month" ? "Month R" : "Week R"}
              </span>
              <span className={cn("text-sm font-bold tabular-nums",
                calendarR > 0 ? "text-success" : calendarR < 0 ? "text-destructive" : "text-muted-foreground")}>
                {formatTotalR(calendarR)}
              </span>
            </div>

            <CardContent className="p-4">
              {/* ── MONTH VIEW ── */}
              {calendarPeriod === "month" && (
                <>
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 py-1">{d}</div>
                  ))}
                </div>
                {/* Calendar grid — compact cells, same chip style as the week view */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: startPad }).map((_, i) => (
                    <div key={`pad-${i}`} />
                  ))}
                  {calDays.map((day) => {
                    const key = format(day, "yyyy-MM-dd");
                    const dayTrades = tradesByDay[key] || [];
                    const isCurrentMonth = isSameMonth(day, calendarMonth);
                    return (
                      <div key={key}
                        className={cn("min-h-[64px] sm:min-h-[72px] rounded-lg p-1.5 flex flex-col gap-1 border transition-colors",
                          isToday(day)
                            ? "border-primary/40 bg-primary/8"
                            : dayTrades.length > 0
                            ? "border-border/50 bg-muted/20 hover:border-primary/30"
                            : "border-border/25 bg-muted/5")}>
                        <p className={cn("text-xs font-bold text-center shrink-0 leading-none",
                          isToday(day) ? "text-primary" : isCurrentMonth ? "text-foreground/75" : "text-muted-foreground/30")}>
                          {format(day, "d")}
                        </p>
                        {dayTrades.length > 0 && (
                          <div className="flex flex-col gap-1 flex-1 min-h-0">
                            {dayTrades.map((t) => (
                              <Link key={t.id} href={`/journal/${t.id}`}
                                title={t.execution_quality ? `${instrumentName(t.instrument)} · ${t.execution_quality} execution` : instrumentName(t.instrument)}
                                className={cn(
                                  "flex-1 flex flex-col items-center justify-center gap-0.5 rounded-md px-1 py-1 leading-none transition-colors min-h-0",
                                  t.result === "win" ? "bg-success/15 hover:bg-success/25"
                                    : t.result === "loss" ? "bg-destructive/15 hover:bg-destructive/25"
                                    : "bg-warning/15 hover:bg-warning/25"
                                )}>
                                <span className={cn("text-[11px] font-extrabold text-center leading-tight tracking-tight",
                                  t.result === "win" ? "text-success"
                                    : t.result === "loss" ? "text-destructive"
                                    : "text-warning")}>
                                  {instrumentName(t.instrument)}
                                </span>
                                {t.execution_quality && (
                                  <span className={cn(
                                    "hidden sm:inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none",
                                    t.execution_quality === "good"
                                      ? "bg-success/20 text-success"
                                      : "bg-destructive/20 text-destructive"
                                  )}>
                                    {t.execution_quality === "good" ? "✓ Good" : "✗ Bad"}
                                  </span>
                                )}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                </>
              )}

              {/* ── WEEK VIEW ── */}
              {calendarPeriod === "week" && (
                <>
                {/* Day headers with full date */}
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
                {/* Week day columns — taller cells */}
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
                                {/* Trade pair — full name, prominent */}
                                <p className={cn("text-base font-extrabold text-center leading-tight tracking-tight",
                                  t.result === "win" ? "text-success"
                                    : t.result === "loss" ? "text-destructive"
                                    : "text-warning")}>
                                  {instrumentName(t.instrument)}
                                </p>
                                {/* Execution quality — directly under the pair */}
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
                                {/* R multiple */}
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
                </>
              )}
            </CardContent>
          </Card>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-success/40" />Win</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-destructive/40" />Loss</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-warning/40" />B/E</span>
            <span className="text-muted-foreground/60">✓ good execution · ✗ bad execution</span>
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === "list" && (
        <>
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              {allTrades.length === 0 ? (
                <div className="space-y-2">
                  <p>No trades logged yet.</p>
                  <Link href="/journal/new" className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Log your first trade
                  </Link>
                </div>
              ) : "No trades match your filters."}
            </div>
          ) : (
            <Card className="bg-card border-border/50">
              <div className="divide-y divide-border/40">
                {filtered.map((trade) => (
                  <Link key={trade.id} href={`/journal/${trade.id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 border-l-2 border-transparent hover:border-primary/40 transition-all group">
                    <div className="flex items-center gap-2 shrink-0">
                      {trade.direction === "long"
                        ? <TrendingUp className="w-3.5 h-3.5 text-success" />
                        : <TrendingDown className="w-3.5 h-3.5 text-destructive" />}
                      <ResultBadge result={trade.result} />
                      {trade.execution_quality && (
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none",
                          trade.execution_quality === "good"
                            ? "bg-success/15 text-success"
                            : "bg-destructive/15 text-destructive"
                        )}>
                          {trade.execution_quality === "good" ? "✓" : "✗"}
                        </span>
                      )}
                    </div>
                    <div className="w-14 shrink-0">
                      <p className="text-sm font-bold group-hover:text-primary transition-colors">{trade.instrument}</p>
                      <p className="text-xs text-muted-foreground capitalize">{trade.market}</p>
                    </div>
                    <div className="flex-1 min-w-0 hidden sm:block">
                      <div className="flex flex-wrap gap-1">
                        {trade.confluences.slice(0, 3).map((c) => (
                          <span key={c} className="text-xs bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded">
                            {c}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{trade.session} session</p>
                    </div>
                    <div className="text-center w-14 shrink-0 hidden md:block">
                      <p className={cn("text-base font-bold tabular-nums",
                        trade.result === "win" ? "text-success"
                        : trade.result === "loss" ? "text-destructive"
                        : "text-warning")}>
                        {trade.result === "win" ? `+${trade.rr}R` : trade.result === "loss" ? "-1R" : "0R"}
                      </p>
                      <p className="text-xs text-muted-foreground">R:R</p>
                    </div>
                    <div className="text-right shrink-0 ml-auto">
                      <p className="text-sm font-medium text-foreground/70">
                        {format(new Date(trade.date_time.slice(0, 10) + "T12:00:00"), "MMM d")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(trade.date_time.slice(0, 10) + "T12:00:00"), "yyyy")}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </>
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
