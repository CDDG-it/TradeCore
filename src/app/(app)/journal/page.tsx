"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths,
  getDay, isToday } from "date-fns";
import { Plus, Search, TrendingUp, TrendingDown, Calendar, List,
  ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getTrades } from "@/lib/mock/store";
import { cn } from "@/lib/utils";
import type { TradeResult, Direction } from "@/lib/types";

type ViewMode = "list" | "calendar";
type PeriodFilter = "all" | "week" | "month";

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
  const allTrades = getTrades();
  const [search, setSearch] = useState("");
  const [filterResult, setFilterResult] = useState<TradeResult | "all">("all");
  const [filterDirection, setFilterDirection] = useState<Direction | "all">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const filtered = useMemo(() => allTrades.filter((t) => {
    const tradeDate = new Date(t.date_time.slice(0, 10) + "T12:00:00");
    const matchSearch = !search ||
      t.instrument.toLowerCase().includes(search.toLowerCase()) ||
      t.confluences.some((c) => c.toLowerCase().includes(search.toLowerCase()));
    const matchResult = filterResult === "all" || t.result === filterResult;
    const matchDir = filterDirection === "all" || t.direction === filterDirection;
    let matchPeriod = true;
    if (periodFilter === "week") matchPeriod = tradeDate >= weekStart && tradeDate <= weekEnd;
    if (periodFilter === "month") matchPeriod = tradeDate >= monthStart && tradeDate <= monthEnd;
    return matchSearch && matchResult && matchDir && matchPeriod;
  }), [allTrades, search, filterResult, filterDirection, periodFilter]);

  const wins = filtered.filter((t) => t.result === "win").length;
  const losses = filtered.filter((t) => t.result === "loss").length;
  const bes = filtered.filter((t) => t.result === "break-even").length;
  const avgRR = filtered.length > 0
    ? (filtered.reduce((s, t) => s + t.rr, 0) / filtered.length).toFixed(1)
    : "—";

  // Calendar helpers
  const calMonthStart = startOfMonth(calendarMonth);
  const calMonthEnd = endOfMonth(calendarMonth);
  const calDays = eachDayOfInterval({ start: calMonthStart, end: calMonthEnd });
  const startPad = (getDay(calMonthStart) + 6) % 7; // Mon-start
  const tradesByDay = useMemo(() => {
    const map: Record<string, typeof allTrades> = {};
    allTrades.forEach((t) => {
      const key = t.date_time.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [allTrades]);

  const periodLabel = periodFilter === "week"
    ? `Week of ${format(weekStart, "MMM d")}`
    : periodFilter === "month"
    ? format(now, "MMMM yyyy")
    : "All time";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trade Journal</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {allTrades.length} trades logged
          </p>
        </div>
        <Link
          href="/journal/new"
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-px shrink-0"
          style={{
            background: "oklch(0.72 0.22 45)",
            color: "oklch(0.07 0.022 28)",
            boxShadow: "0 4px 14px oklch(0.72 0.22 45 / 0.30)",
          }}
        >
          <Plus className="w-4 h-4" /> Log trade
        </Link>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Wins", value: wins.toString(), color: "text-success" },
          { label: "Losses", value: losses.toString(), color: "text-destructive" },
          { label: "Break-Even", value: bes.toString(), color: "text-warning" },
          { label: "Avg R:R", value: avgRR, color: "text-primary" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border/50 rounded-xl p-4 text-center">
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
          {(["all", "week", "month"] as const).map((p) => (
            <button key={p} onClick={() => setPeriodFilter(p)}
              className={cn("px-3 py-1.5 text-xs font-medium transition-colors capitalize",
                periodFilter === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
              {p === "all" ? "All time" : p === "week" ? "This week" : "This month"}
            </button>
          ))}
        </div>

        {viewMode === "list" && (
          <>
            <div className="relative flex-1 min-w-36 max-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm bg-card border-border/50" />
            </div>
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
          {/* Month nav */}
          <div className="flex items-center justify-between">
            <button onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <p className="text-sm font-semibold">{format(calendarMonth, "MMMM yyyy")}</p>
            <button onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startPad }).map((_, i) => (
                  <div key={`pad-${i}`} />
                ))}
                {calDays.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const dayTrades = tradesByDay[key] || [];
                  const dayWins = dayTrades.filter((t) => t.result === "win").length;
                  const dayLosses = dayTrades.filter((t) => t.result === "loss").length;
                  const isCurrentMonth = isSameMonth(day, calendarMonth);
                  return (
                    <div key={key}
                      className={cn("min-h-[52px] rounded-lg p-1 transition-colors",
                        isToday(day) ? "ring-1 ring-primary/40 bg-primary/3" : "",
                        dayTrades.length > 0 ? "cursor-pointer hover:bg-muted/40" : "")}>
                      <p className={cn("text-xs font-medium mb-1 text-center",
                        isToday(day) ? "text-primary" : isCurrentMonth ? "text-foreground/80" : "text-muted-foreground/40")}>
                        {format(day, "d")}
                      </p>
                      {dayTrades.length > 0 && (
                        <div className="space-y-0.5">
                          {dayTrades.slice(0, 2).map((t) => (
                            <Link key={t.id} href={`/journal/${t.id}`}
                              className={cn("block rounded px-1 py-0.5 text-xs font-medium truncate transition-colors",
                                t.result === "win" ? "bg-success/15 text-success hover:bg-success/25"
                                  : t.result === "loss" ? "bg-destructive/15 text-destructive hover:bg-destructive/25"
                                  : "bg-warning/15 text-warning hover:bg-warning/25")}>
                              {t.instrument}
                            </Link>
                          ))}
                          {dayTrades.length > 2 && (
                            <p className="text-xs text-muted-foreground text-center">+{dayTrades.length - 2}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-success/40" />Win</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-destructive/40" />Loss</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-warning/40" />B/E</span>
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
                    className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors group">
                    <div className="flex items-center gap-2 w-16 shrink-0">
                      {trade.direction === "long"
                        ? <TrendingUp className="w-3.5 h-3.5 text-success" />
                        : <TrendingDown className="w-3.5 h-3.5 text-destructive" />}
                      <ResultBadge result={trade.result} />
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
                      <p className="text-sm font-semibold">{trade.rr}R</p>
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
    </div>
  );
}
