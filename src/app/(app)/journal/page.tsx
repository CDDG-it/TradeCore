"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay,
  eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, addWeeks, subWeeks,
  getDay, isToday,
} from "date-fns";
import { Plus, TrendingUp, TrendingDown, Calendar, List,
  ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTrades } from "@/lib/supabase/queries";
import type { TradeJournalEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { TradeResult, Direction } from "@/lib/types";

type ViewMode = "list" | "calendar";
type PeriodFilter = "all" | "day" | "week" | "month";
type CalendarPeriod = "month" | "week";
type ExecutionQualityFilter = "all" | "good" | "bad";

function ResultBadge({ result }: { result: TradeResult }) {
  const config = {
    win: "bg-success/15 text-success border-success/20",
    loss: "bg-destructive/15 text-destructive border-destructive/20",
    "break-even": "bg-warning/15 text-warning border-warning/20",
  };
  const labels = { win: "W", loss: "L", "break-even": "BE" };
  return <Badge className={cn("text-xs px-1.5", config[result])}>{labels[result]}</Badge>;
}

export default function JournalPage() {
  const [allTrades, setAllTrades] = useState<TradeJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterResult, setFilterResult] = useState<TradeResult | "all">("all");
  const [filterExecution, setFilterExecution] = useState<ExecutionQualityFilter>("all");

  useEffect(() => {
    getTrades().then(setAllTrades).finally(() => setLoading(false));
  }, []);
  const [filterDirection, setFilterDirection] = useState<Direction | "all">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarPeriod, setCalendarPeriod] = useState<CalendarPeriod>("week");
  const [calendarWeekDate, setCalendarWeekDate] = useState(new Date());

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
              background: "oklch(0.72 0.22 45)",
              color: "oklch(0.07 0.003 28)",
              boxShadow: "0 4px 14px oklch(0.72 0.22 45 / 0.30)",
            }}
          >
            <Plus className="w-4 h-4" /> Log trade
          </Link>
        }
      />
      <PageWrapper>
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Wins", value: wins.toString(), color: "text-success" },
          { label: "Losses", value: losses.toString(), color: "text-destructive" },
          { label: "Break-Even", value: bes.toString(), color: "text-warning" },
          { label: "Avg R:R", value: avgRR, color: "text-primary" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border/50 rounded-xl p-4 text-center card-hover">
            <p className={cn("text-xl font-bold", color)}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* View toggle */}
        <div className="flex rounded-lg border border-border/50 overflow-hidden">
          <button onClick={() => setViewMode("list")}
            className={cn("px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5",
              viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
            <List className="w-3.5 h-3.5" /> List
          </button>
          <button onClick={() => setViewMode("calendar")}
            className={cn("px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5",
              viewMode === "calendar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
            <Calendar className="w-3.5 h-3.5" /> Calendar
          </button>
        </div>

        {/* Period filter */}
        <div className="flex rounded-lg border border-border/50 overflow-hidden">
          {(["all", "day", "week", "month"] as const).map((p) => (
            <button key={p} onClick={() => setPeriodFilter(p)}
              className={cn("px-3 py-1.5 text-xs font-medium transition-colors capitalize",
                periodFilter === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
              {p === "all" ? "All time" : p === "day" ? "Today" : p === "week" ? "This week" : "This month"}
            </button>
          ))}
        </div>

        {viewMode === "list" && (
          <>
            <div className="flex rounded-lg border border-border/50 overflow-hidden">
              {(["all", "win", "loss", "break-even"] as const).map((r) => (
                <button key={r} onClick={() => setFilterResult(r)}
                  className={cn("px-3 py-1.5 text-xs font-medium transition-colors",
                    filterResult === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                  {r === "break-even" ? "B/E" : r === "all" ? "All" : r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex rounded-lg border border-border/50 overflow-hidden">
              {(["all", "long", "short"] as const).map((d) => (
                <button key={d} onClick={() => setFilterDirection(d)}
                  className={cn("px-3 py-1.5 text-xs font-medium transition-colors capitalize",
                    filterDirection === d ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                  {d}
                </button>
              ))}
            </div>
            <div className="flex rounded-lg border border-border/50 overflow-hidden">
              {(["all", "good", "bad"] as const).map((e) => (
                <button key={e} onClick={() => setFilterExecution(e)}
                  className={cn("px-3 py-1.5 text-xs font-medium transition-colors",
                    filterExecution === e ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                  {e === "all" ? "All exec" : e === "good" ? "✓ Good" : "✗ Bad"}
                </button>
              ))}
            </div>
          </>
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
          {/* Navigation + period toggle */}
          <div className="flex items-center justify-between">
            <button onClick={prevCalendar}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="text-center space-y-1.5">
              <p className="text-sm font-semibold">{calendarTitle}</p>
              <div className="flex rounded-lg border border-border/50 overflow-hidden mx-auto w-fit">
                <button
                  onClick={() => setCalendarPeriod("month")}
                  className={cn("px-3 py-1 text-xs font-medium transition-colors",
                    calendarPeriod === "month" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                  Month
                </button>
                <button
                  onClick={() => setCalendarPeriod("week")}
                  className={cn("px-3 py-1 text-xs font-medium transition-colors",
                    calendarPeriod === "week" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                  Week
                </button>
              </div>
            </div>
            <button onClick={nextCalendar}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* ── MONTH VIEW ── */}
          {calendarPeriod === "month" && (
            <Card className="bg-card border-border/50">
              <CardContent className="p-4">
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-1">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                  ))}
                </div>
                {/* Calendar grid — square cells */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: startPad }).map((_, i) => (
                    <div key={`pad-${i}`} className="aspect-square" />
                  ))}
                  {calDays.map((day) => {
                    const key = format(day, "yyyy-MM-dd");
                    const dayTrades = tradesByDay[key] || [];
                    const isCurrentMonth = isSameMonth(day, calendarMonth);
                    const fontSize = dayTrades.length === 1 ? "text-xs" : dayTrades.length === 2 ? "text-[10px]" : "text-[9px]";
                    return (
                      <div key={key}
                        className={cn("aspect-square rounded-lg p-1 transition-colors flex flex-col",
                          isToday(day) ? "ring-1 ring-primary/40 bg-primary/3" : "",
                          dayTrades.length > 0 ? "hover:brightness-110" : "")}>
                        <p className={cn("text-[10px] font-semibold text-center shrink-0 leading-none mb-0.5",
                          isToday(day) ? "text-primary" : isCurrentMonth ? "text-foreground/60" : "text-muted-foreground/30")}>
                          {format(day, "d")}
                        </p>
                        {dayTrades.length > 0 && (
                          <div className="flex flex-col gap-0.5 flex-1 min-h-0">
                            {dayTrades.map((t) => (
                              <Link key={t.id} href={`/journal/${t.id}`}
                                title={t.execution_quality ? `${t.instrument} · ${t.execution_quality} execution` : t.instrument}
                                className={cn(
                                  "flex-1 flex items-center justify-center gap-0.5 rounded font-bold text-center leading-none transition-all min-h-0 px-0.5",
                                  fontSize,
                                  t.result === "win" ? "bg-success/20 text-success hover:bg-success/30"
                                    : t.result === "loss" ? "bg-destructive/20 text-destructive hover:bg-destructive/30"
                                    : "bg-warning/20 text-warning hover:bg-warning/30"
                                )}>
                                {t.execution_quality && (
                                  <span className="opacity-75">{t.execution_quality === "good" ? "✓" : "✗"}</span>
                                )}
                                {t.instrument}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── WEEK VIEW ── */}
          {calendarPeriod === "week" && (
            <Card className="bg-card border-border/50">
              <CardContent className="p-4">
                {/* Day headers with full date */}
                <div className="grid grid-cols-7 gap-2 mb-3">
                  {calWeekDays.map((day) => (
                    <div key={day.toISOString()} className={cn(
                      "text-center rounded-lg py-2",
                      isToday(day) ? "bg-primary/8 ring-1 ring-primary/30" : ""
                    )}>
                      <p className="text-xs font-medium text-muted-foreground">{format(day, "EEE")}</p>
                      <p className={cn("text-sm font-bold mt-0.5",
                        isToday(day) ? "text-primary" : "text-foreground/80")}>
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
                    return (
                      <div key={key}
                        className={cn("min-h-[160px] rounded-xl p-1.5 flex flex-col gap-1 transition-colors",
                          isToday(day) ? "bg-primary/4 ring-1 ring-primary/20" : "bg-muted/20",
                          dayTrades.length === 0 ? "items-center justify-center" : ""
                        )}>
                        {dayTrades.length === 0 ? (
                          <span className="text-[10px] text-muted-foreground/30 text-center">—</span>
                        ) : (
                          dayTrades.map((t) => (
                            <Link key={t.id} href={`/journal/${t.id}`}
                              className={cn("flex-1 flex flex-col items-center justify-center rounded-lg px-1.5 py-2 transition-colors group min-h-0",
                                t.result === "win" ? "bg-success/15 hover:bg-success/25"
                                  : t.result === "loss" ? "bg-destructive/15 hover:bg-destructive/25"
                                  : "bg-warning/15 hover:bg-warning/25")}>
                              <p className={cn("text-sm font-bold text-center leading-tight",
                                t.result === "win" ? "text-success"
                                  : t.result === "loss" ? "text-destructive"
                                  : "text-warning")}>
                                {t.instrument}
                              </p>
                              <p className="text-xs text-muted-foreground text-center leading-tight mt-1">
                                {t.result === "win" ? `+${t.rr}R` : t.result === "loss" ? "-1R" : "0R"}
                              </p>
                              {t.execution_quality && (
                                <span className={cn(
                                  "mt-1 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                                  t.execution_quality === "good"
                                    ? "bg-success/15 text-success"
                                    : "bg-destructive/15 text-destructive"
                                )}>
                                  {t.execution_quality === "good" ? "✓ Good" : "✗ Bad"}
                                </span>
                              )}
                            </Link>
                          ))
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

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
                    <div className="text-center w-12 shrink-0 hidden md:block">
                      <p className={cn("text-sm font-semibold",
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
    </div>
  );
}
