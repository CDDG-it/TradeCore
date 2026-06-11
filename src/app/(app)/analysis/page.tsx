"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import {
  format,
  getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek,
  addWeeks, subWeeks, addMonths, subMonths,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, getDay, isToday, isSameMonth,
} from "date-fns";
import {
  Plus, TrendingUp, TrendingDown, Minus, ArrowRight,
  LinkIcon, Calendar, List, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAnalyses } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";
import type { Bias, PreTradeAnalysis } from "@/lib/types";

function BiasBadge({ bias }: { bias: Bias }) {
  if (bias === "bullish")
    return (
      <span className="flex items-center gap-1 text-success text-xs font-medium">
        <TrendingUp className="w-3 h-3" /> Bullish
      </span>
    );
  if (bias === "bearish")
    return (
      <span className="flex items-center gap-1 text-destructive text-xs font-medium">
        <TrendingDown className="w-3 h-3" /> Bearish
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-warning text-xs font-medium">
      <Minus className="w-3 h-3" /> Choppy
    </span>
  );
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type ViewMode = "list" | "calendar";
type CalendarPeriod = "month" | "week";

export default function AnalysisPage() {
  const [allAnalyses, setAllAnalyses] = useState<PreTradeAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [listWeekDate, setListWeekDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarPeriod, setCalendarPeriod] = useState<CalendarPeriod>("week");
  const [calendarWeekDate, setCalendarWeekDate] = useState(new Date());

  useEffect(() => {
    getAnalyses().then(setAllAnalyses).finally(() => setLoading(false));
  }, []);

  const now = new Date();

  // List view: week navigation
  const listWeekStart = startOfISOWeek(listWeekDate);
  const listWeekEnd = endOfISOWeek(listWeekDate);
  const listWeekNum = getISOWeek(listWeekDate);

  const listWeekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(listWeekStart);
    d.setDate(listWeekStart.getDate() + i);
    return format(d, "yyyy-MM-dd");
  });

  const listWeekAnalyses = useMemo(() => {
    return allAnalyses
      .filter((a) => {
        const d = new Date(a.date + "T12:00:00");
        return d >= listWeekStart && d <= listWeekEnd;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [allAnalyses, listWeekStart.getTime(), listWeekEnd.getTime()]);

  // Shared day map — used by the list day indicators and both calendar views
  const analysesByDay = useMemo(() => {
    const map: Record<string, PreTradeAnalysis[]> = {};
    allAnalyses.forEach((a) => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    return map;
  }, [allAnalyses]);

  const isCurrentWeek =
    getISOWeek(listWeekDate) === getISOWeek(now) &&
    getISOWeekYear(listWeekDate) === getISOWeekYear(now);

  // Calendar helpers — month view
  const calMonthStart = startOfMonth(calendarMonth);
  const calMonthEnd = endOfMonth(calendarMonth);
  const calDays = eachDayOfInterval({ start: calMonthStart, end: calMonthEnd });
  const startPad = (getDay(calMonthStart) + 6) % 7; // Mon-start

  // Calendar helpers — week view
  const calWeekStart = startOfWeek(calendarWeekDate, { weekStartsOn: 1 });
  const calWeekEnd = endOfWeek(calendarWeekDate, { weekStartsOn: 1 });
  const calWeekDays = eachDayOfInterval({ start: calWeekStart, end: calWeekEnd });

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

  const biasCell = (bias: Bias) =>
    bias === "bullish" ? "bg-success/20 text-success hover:bg-success/30"
      : bias === "bearish" ? "bg-destructive/20 text-destructive hover:bg-destructive/30"
      : "bg-warning/20 text-warning hover:bg-warning/30";

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Trading"
        title="Analysis"
        subtitle="Pre-trade and market analysis"
        action={
          <Link
            href="/analysis/new"
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-px shrink-0"
            style={{
              background: "oklch(0.72 0.22 45)",
              color: "oklch(0.07 0.003 28)",
              boxShadow: "0 4px 14px oklch(0.72 0.22 45 / 0.30)",
            }}
          >
            <Plus className="w-4 h-4" />
            New analysis
          </Link>
        }
      />
      <PageWrapper>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        {/* View toggle */}
        <div className="flex rounded-lg border border-border/50 overflow-hidden">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5",
              viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <List className="w-3.5 h-3.5" /> List
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5",
              viewMode === "calendar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Calendar className="w-3.5 h-3.5" /> Calendar
          </button>
        </div>
      </div>

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
                  {DAY_NAMES.map((d) => (
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
                    const dayAnalyses = analysesByDay[key] || [];
                    const isCurrentMonth = isSameMonth(day, calendarMonth);
                    const fontSize = dayAnalyses.length === 1 ? "text-xs" : dayAnalyses.length === 2 ? "text-[10px]" : "text-[9px]";
                    return (
                      <div key={key}
                        className={cn("aspect-square rounded-lg p-1 transition-colors flex flex-col",
                          isToday(day) ? "ring-1 ring-primary/40 bg-primary/3" : "",
                          dayAnalyses.length > 0 ? "hover:brightness-110" : "")}>
                        <p className={cn("text-[10px] font-semibold text-center shrink-0 leading-none mb-0.5",
                          isToday(day) ? "text-primary" : isCurrentMonth ? "text-foreground/60" : "text-muted-foreground/30")}>
                          {format(day, "d")}
                        </p>
                        {dayAnalyses.length > 0 && (
                          <div className="flex flex-col gap-0.5 flex-1 min-h-0">
                            {dayAnalyses.map((a) => (
                              <Link key={a.id} href={`/analysis/${a.id}`}
                                className={cn(
                                  "flex-1 flex items-center justify-center rounded font-bold text-center leading-none transition-all min-h-0 px-0.5",
                                  fontSize,
                                  biasCell(a.bias)
                                )}>
                                {a.instrument}
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
                    const dayAnalyses = analysesByDay[key] || [];
                    return (
                      <div key={key}
                        className={cn("min-h-[160px] rounded-xl p-1.5 flex flex-col gap-1 transition-colors",
                          isToday(day) ? "bg-primary/4 ring-1 ring-primary/20" : "bg-muted/20",
                          dayAnalyses.length === 0 ? "items-center justify-center" : ""
                        )}>
                        {dayAnalyses.length === 0 ? (
                          <span className="text-[10px] text-muted-foreground/30 text-center">—</span>
                        ) : (
                          dayAnalyses.map((a) => (
                            <Link key={a.id} href={`/analysis/${a.id}`}
                              className={cn("flex-1 flex flex-col items-center justify-center rounded-lg px-1.5 py-2 transition-colors group min-h-0",
                                a.bias === "bullish" ? "bg-success/15 hover:bg-success/25"
                                  : a.bias === "bearish" ? "bg-destructive/15 hover:bg-destructive/25"
                                  : "bg-warning/15 hover:bg-warning/25")}>
                              <p className={cn("text-sm font-bold text-center leading-tight",
                                a.bias === "bullish" ? "text-success"
                                  : a.bias === "bearish" ? "text-destructive"
                                  : "text-warning")}>
                                {a.instrument}
                              </p>
                              <p className="text-xs text-muted-foreground text-center leading-tight mt-1 capitalize">
                                {a.session}
                              </p>
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
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-success/40" />Bullish</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-destructive/40" />Bearish</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-warning/40" />Choppy</span>
          </div>
        </div>
      )}

      {/* LIST VIEW — per week, Mon→Sun */}
      {viewMode === "list" && (
        <div className="space-y-4">
          {/* Week navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setListWeekDate(subWeeks(listWeekDate, 1))}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="text-center space-y-1.5">
              <div className="flex items-center justify-center gap-2">
                <span
                  className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                  style={{
                    background: "oklch(0.72 0.22 45 / 0.12)",
                    color: "oklch(0.72 0.22 45)",
                  }}
                >
                  W{listWeekNum}
                </span>
                <span className="text-sm font-semibold">
                  {format(listWeekStart, "MMM d")} – {format(listWeekEnd, "MMM d, yyyy")}
                </span>
                {isCurrentWeek && (
                  <span className="text-xs text-primary font-medium">This week</span>
                )}
              </div>
              {/* Day indicators */}
              <div className="flex gap-1 justify-center">
                {listWeekDays.map((d, i) => {
                  const hasAnalysis = (analysesByDay[d] ?? []).length > 0;
                  const isTodayDay = d === format(now, "yyyy-MM-dd");
                  return (
                    <span
                      key={d}
                      title={`${DAY_NAMES[i]} ${format(new Date(d + "T12:00:00"), "MMM d")}`}
                      className={cn(
                        "inline-flex items-center justify-center w-7 h-7 rounded-lg text-[10px] font-semibold",
                        isTodayDay ? "ring-1 ring-primary/40" : ""
                      )}
                      style={
                        hasAnalysis
                          ? { background: "oklch(0.72 0.22 45 / 0.15)", color: "oklch(0.72 0.22 45)" }
                          : { color: "oklch(0.38 0.005 28)" }
                      }
                    >
                      {DAY_NAMES[i][0]}
                    </span>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setListWeekDate(addWeeks(listWeekDate, 1))}
              disabled={isCurrentWeek}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {!isCurrentWeek && (
            <div className="flex justify-center">
              <button
                onClick={() => setListWeekDate(new Date())}
                className="text-xs font-medium transition-colors"
                style={{ color: "oklch(0.72 0.22 45)" }}
              >
                → Back to current week
              </button>
            </div>
          )}

          {listWeekAnalyses.length === 0 ? (
            <div
              className="rounded-xl p-10 text-center"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <p className="text-sm text-muted-foreground">No analyses this week.</p>
              <Link
                href="/analysis/new"
                className="inline-flex items-center gap-1 text-xs font-medium mt-2 transition-colors"
                style={{ color: "oklch(0.72 0.22 45)" }}
              >
                <Plus className="w-3 h-3" /> Add an analysis
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {listWeekDays
                .filter((d) => (analysesByDay[d] ?? []).length > 0)
                .map((d) => {
                  const dayAnalyses = analysesByDay[d]!;
                  const dayDate = new Date(d + "T12:00:00");
                  const isTodayDay = d === format(now, "yyyy-MM-dd");
                  return (
                    <div key={d} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-semibold", isTodayDay ? "text-primary" : "text-muted-foreground")}>
                          {format(dayDate, "EEEE")}
                        </span>
                        <span className="text-xs text-muted-foreground/50">
                          {format(dayDate, "MMMM d")}
                        </span>
                        {isTodayDay && (
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: "oklch(0.72 0.22 45 / 0.15)", color: "oklch(0.72 0.22 45)" }}
                          >
                            Today
                          </span>
                        )}
                      </div>
                      <Card className="bg-card border-border/50 overflow-hidden">
                        <div className="divide-y divide-border/40">
                          {dayAnalyses.map((analysis) => (
                            <Link
                              key={analysis.id}
                              href={`/analysis/${analysis.id}`}
                              className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 border-l-2 border-transparent hover:border-primary/40 transition-all group"
                            >
                              <div className="w-24 shrink-0">
                                <p className="text-sm font-bold group-hover:text-primary transition-colors">
                                  {analysis.instrument}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">{analysis.market}</p>
                              </div>
                              <div className="w-20 shrink-0">
                                <BiasBadge bias={analysis.bias} />
                              </div>
                              <p className="flex-1 text-xs text-muted-foreground truncate hidden sm:block leading-relaxed">
                                {analysis.thesis}
                              </p>
                              <div className="flex items-center gap-2 shrink-0">
                                {analysis.used_for_trade && (
                                  <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                                    <LinkIcon className="w-2.5 h-2.5 mr-1" />
                                    Traded
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground hidden md:block">{analysis.session}</span>
                                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary/60 transition-all group-hover:translate-x-0.5" />
                              </div>
                            </Link>
                          ))}
                        </div>
                      </Card>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      </PageWrapper>
    </div>
  );
}
