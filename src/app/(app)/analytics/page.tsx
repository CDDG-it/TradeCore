"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth,
  isWithinInterval, getDay, subWeeks, subMonths, startOfISOWeek, endOfISOWeek,
  getISOWeek, addDays,
} from "date-fns";
import { ChevronLeft, ChevronRight, AlertTriangle, Lightbulb, ListChecks, Brain, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTrades, getWeeklyTradeReviews, getWeeklyReflection } from "@/lib/supabase/queries";
import type { TradeJournalEntry, WeeklyTradeReview, WeeklyReflection } from "@/lib/types";
import { cn } from "@/lib/utils";

type Period = "all" | "day" | "week" | "month";
type DayFilter = "all" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
type SessionFilter = "all" | "London" | "New York" | "Asia";
type DirectionFilter = "all" | "long" | "short";

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      {label && <p className="text-muted-foreground mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

const DAY_MAP: Record<number, DayFilter> = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri" };

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("all");
  // How many periods back from now (0 = current). Only meaningful for day/week/month.
  const [offset, setOffset] = useState(0);
  const [dayFilter, setDayFilter] = useState<DayFilter>("all");
  const [sessionFilter, setSessionFilter] = useState<SessionFilter>("all");
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>("all");
  const [allTrades, setAllTrades] = useState<TradeJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekReviews, setWeekReviews] = useState<WeeklyTradeReview[]>([]);
  const [weekReflection, setWeekReflection] = useState<WeeklyReflection | null>(null);

  useEffect(() => {
    Promise.all([getTrades(), getWeeklyTradeReviews()])
      .then(([t, reviews]) => { setAllTrades(t); setWeekReviews(reviews); })
      .finally(() => setLoading(false));
  }, []);

  // Reset the "how far back" cursor whenever the period type changes.
  useEffect(() => { setOffset(0); }, [period]);

  // ── The concrete window the selected period + offset resolves to ──────
  const periodWindow = useMemo(() => {
    const now = new Date();
    if (period === "day") {
      const d = subDays(now, offset);
      return { start: startOfDay(d), end: endOfDay(d), label: format(d, "EEE · MMM d, yyyy"), weekStart: null as string | null };
    }
    if (period === "week") {
      const monday = subWeeks(startOfISOWeek(now), offset);
      const friday = addDays(monday, 4);
      return {
        start: startOfDay(monday),
        end: endOfISOWeek(monday),
        label: `Week ${getISOWeek(monday)} · ${format(monday, "MMM d")} – ${format(friday, "MMM d, yyyy")}`,
        weekStart: format(monday, "yyyy-MM-dd"),
      };
    }
    if (period === "month") {
      const m = subMonths(startOfMonth(now), offset);
      return { start: startOfMonth(m), end: endOfMonth(m), label: format(m, "MMMM yyyy"), weekStart: null };
    }
    return { start: null, end: null, label: "All time", weekStart: null };
  }, [period, offset]);

  // Pull the week's reflection when a specific week is in view.
  useEffect(() => {
    if (!periodWindow.weekStart) { setWeekReflection(null); return; }
    let active = true;
    getWeeklyReflection(periodWindow.weekStart).then((r) => { if (active) setWeekReflection(r); });
    return () => { active = false; };
  }, [periodWindow.weekStart]);

  const weekReview = useMemo(
    () => (periodWindow.weekStart ? weekReviews.find((r) => r.week_start === periodWindow.weekStart) ?? null : null),
    [weekReviews, periodWindow.weekStart]
  );

  // ── Period filtering ─────────────────────────────────────────────────
  const trades = useMemo(() => {
    let result = allTrades;
    if (periodWindow.start && periodWindow.end) {
      const { start, end } = periodWindow;
      result = result.filter((t) =>
        isWithinInterval(new Date(t.date_time.slice(0, 10) + "T12:00:00"), { start, end })
      );
    }
    if (dayFilter !== "all") {
      result = result.filter((t) => DAY_MAP[getDay(new Date(t.date_time.slice(0, 10) + "T12:00:00"))] === dayFilter);
    }
    if (sessionFilter !== "all") {
      result = result.filter((t) => t.session === sessionFilter);
    }
    if (directionFilter !== "all") {
      result = result.filter((t) => t.direction === directionFilter);
    }
    return result;
  }, [allTrades, periodWindow, dayFilter, sessionFilter, directionFilter]);

  // ── Derived stats ─────────────────────────────────────────────────────
  const wins = trades.filter((t) => t.result === "win");
  const losses = trades.filter((t) => t.result === "loss");
  const bes = trades.filter((t) => t.result === "break-even");
  const winRate = trades.length > 0 ? Math.round((wins.length / trades.length) * 100) : 0;

  // ── Execution quality breakdown ──────────────────────────────────────
  const goodExec = trades.filter((t) => t.execution_quality === "good");
  const badExec = trades.filter((t) => t.execution_quality === "bad");
  const unratedExec = trades.length - goodExec.length - badExec.length;
  const goodExecRate = trades.length > 0 ? Math.round((goodExec.length / trades.length) * 100) : 0;
  // Average R:R calculated only over winning trades — losses are excluded to avoid skewing the metric
  const avgRR =
    wins.length > 0
      ? Math.round((wins.reduce((s, t) => s + t.rr, 0) / wins.length) * 100) / 100
      : 0;

  // ── Cumulative R curve (win=+rr, loss=-1R, be=0) ────────────────────
  const sortedTrades = [...trades].sort(
    (a, b) =>
      new Date(a.date_time.slice(0, 10) + "T12:00:00").getTime() -
      new Date(b.date_time.slice(0, 10) + "T12:00:00").getTime()
  );
  let runningR = 0;
  const rrCurve = sortedTrades.map((t) => {
    if (t.result === "win") runningR += t.rr;
    else if (t.result === "loss") runningR -= 1;
    return {
      date: format(new Date(t.date_time.slice(0, 10) + "T12:00:00"), "MMM d"),
      r: Math.round(runningR * 100) / 100,
    };
  });

  // ── Result breakdown ─────────────────────────────────────────────────
  const resultData = [
    { name: "Win", value: wins.length, color: "var(--color-success)" },
    { name: "Loss", value: losses.length, color: "var(--color-destructive)" },
    { name: "B/E", value: bes.length, color: "var(--color-warning)" },
  ].filter((d) => d.value > 0);

  // ── Win rate by instrument (for breakdown table) ─────────────────────
  const byInstrument: Record<string, { trades: number; wins: number; winTotalRR: number }> = {};
  trades.forEach((t) => {
    if (!byInstrument[t.instrument])
      byInstrument[t.instrument] = { trades: 0, wins: 0, winTotalRR: 0 };
    byInstrument[t.instrument].trades += 1;
    if (t.result === "win") {
      byInstrument[t.instrument].wins += 1;
      byInstrument[t.instrument].winTotalRR += t.rr;
    }
  });
  const instrumentData = Object.entries(byInstrument)
    .map(([name, d]) => ({
      name,
      winRate: Math.round((d.wins / d.trades) * 100),
      avgRR: d.wins > 0 ? Math.round((d.winTotalRR / d.wins) * 100) / 100 : 0,
      trades: d.trades,
    }))
    .sort((a, b) => b.winRate - a.winRate);

  // ── Win rate by session ───────────────────────────────────────────────
  const bySession: Record<string, { trades: number; wins: number }> = {};
  trades.forEach((t) => {
    if (!bySession[t.session]) bySession[t.session] = { trades: 0, wins: 0 };
    bySession[t.session].trades += 1;
    if (t.result === "win") bySession[t.session].wins += 1;
  });
  const sessionData = Object.entries(bySession)
    .map(([session, d]) => ({
      session,
      winRate: Math.round((d.wins / d.trades) * 100),
      trades: d.trades,
    }))
    .sort((a, b) => b.winRate - a.winRate);

  // ── Long vs short ─────────────────────────────────────────────────────
  const longTrades = trades.filter((t) => t.direction === "long");
  const shortTrades = trades.filter((t) => t.direction === "short");
  const longWinRate =
    longTrades.length > 0
      ? Math.round(
          (longTrades.filter((t) => t.result === "win").length / longTrades.length) * 100
        )
      : 0;
  const shortWinRate =
    shortTrades.length > 0
      ? Math.round(
          (shortTrades.filter((t) => t.result === "win").length / shortTrades.length) * 100
        )
      : 0;
  const longWins = longTrades.filter((t) => t.result === "win");
  const shortWins = shortTrades.filter((t) => t.result === "win");
  const longAvgRR =
    longWins.length > 0
      ? Math.round((longWins.reduce((s, t) => s + t.rr, 0) / longWins.length) * 100) / 100
      : 0;
  const shortAvgRR =
    shortWins.length > 0
      ? Math.round((shortWins.reduce((s, t) => s + t.rr, 0) / shortWins.length) * 100) / 100
      : 0;

  // ── Tabs ──────────────────────────────────────────────────────────────
  const PERIODS: { id: Period; label: string }[] = [
    { id: "all", label: "All time" },
    { id: "month", label: "Month" },
    { id: "week", label: "Week" },
    { id: "day", label: "Day" },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      <PageHeader
        badge="Trading"
        title="Analytics"
        subtitle="Performance metrics and equity curve"
        action={
          <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1">
            {PERIODS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setPeriod(id)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                  period === id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />
      <PageWrapper>
      {/* Period navigator — step back through past days / weeks / months */}
      {period !== "all" && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-card px-3 py-2.5">
          <button
            onClick={() => setOffset((o) => o + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-border/60 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Earlier
          </button>
          <div className="text-center min-w-0">
            <p className="text-sm font-semibold truncate">{periodWindow.label}</p>
            <p className="text-[11px] text-muted-foreground">
              {offset === 0
                ? period === "day" ? "Today" : period === "week" ? "This week" : "This month"
                : `${offset} ${period}${offset > 1 ? "s" : ""} ago`}
            </p>
          </div>
          <button
            onClick={() => setOffset((o) => Math.max(0, o - 1))}
            disabled={offset === 0}
            className="inline-flex items-center gap-1 rounded-lg border border-border/60 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
          >
            Later <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Extra filters */}
      <div className="flex flex-wrap gap-2">
        {/* Day of week */}
        <div className="flex rounded-lg border border-border/50 overflow-hidden">
          {(["all", "Mon", "Tue", "Wed", "Thu", "Fri"] as DayFilter[]).map((d) => (
            <button key={d} onClick={() => setDayFilter(d)}
              className={cn("px-2.5 py-1.5 text-xs font-medium transition-colors",
                dayFilter === d ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
              {d === "all" ? "All days" : d}
            </button>
          ))}
        </div>
        {/* Session */}
        <div className="flex rounded-lg border border-border/50 overflow-hidden">
          {(["all", "London", "New York", "Asia"] as SessionFilter[]).map((s) => (
            <button key={s} onClick={() => setSessionFilter(s)}
              className={cn("px-2.5 py-1.5 text-xs font-medium transition-colors",
                sessionFilter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
              {s === "all" ? "All sessions" : s}
            </button>
          ))}
        </div>
        {/* Direction */}
        <div className="flex rounded-lg border border-border/50 overflow-hidden">
          {(["all", "long", "short"] as DirectionFilter[]).map((d) => (
            <button key={d} onClick={() => setDirectionFilter(d)}
              className={cn("px-2.5 py-1.5 text-xs font-medium transition-colors capitalize",
                directionFilter === d ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
              {d === "all" ? "Both directions" : d}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {trades.length === 0 && (
        <Card className="bg-card border-border/50">
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground text-sm">
              No trades found for {period === "all" ? "your account yet" : periodWindow.label}.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Week journal & reflection — the qualitative record for the selected week */}
      {period === "week" && periodWindow.weekStart && (
        <WeekReflectionCard
          weekStart={periodWindow.weekStart}
          label={periodWindow.label}
          review={weekReview}
          reflection={weekReflection}
        />
      )}

      {trades.length > 0 && (
        <>
          {/* Top stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Win Rate",
                value: `${winRate}%`,
                sub: `${wins.length}W · ${losses.length}L · ${bes.length}BE`,
                color: "text-success",
              },
              {
                label: "Avg R:R",
                value: wins.length > 0 ? `${avgRR}R` : "—",
                sub: "Winning trades only",
                color: "text-primary",
              },
              {
                label: "Total Trades",
                value: trades.length.toString(),
                sub: period === "all" ? "All time" : periodWindow.label,
                color: "text-foreground",
              },
            ].map(({ label, value, sub, color }) => (
              <Card key={label} className="bg-card border-border/50">
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    {label}
                  </p>
                  <p className={cn("text-2xl font-bold", color)}>{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                </CardContent>
              </Card>
            ))}

            {/* Execution breakdown — segmented bar instead of another donut */}
            <Card className="bg-card border-border/50">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Execution
                </p>
                <p className="text-2xl font-bold text-success">{goodExecRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {goodExec.length} of {trades.length} trade{trades.length !== 1 ? "s" : ""} well executed
                </p>
                {/* Segmented quality bar: good / bad / unrated */}
                <div className="mt-3 flex h-2 w-full gap-0.5 overflow-hidden rounded-full">
                  {goodExec.length > 0 && (
                    <div className="bg-success/80 rounded-full" style={{ width: `${(goodExec.length / trades.length) * 100}%` }} />
                  )}
                  {badExec.length > 0 && (
                    <div className="bg-destructive/80 rounded-full" style={{ width: `${(badExec.length / trades.length) * 100}%` }} />
                  )}
                  {unratedExec > 0 && (
                    <div className="bg-muted-foreground/20 rounded-full" style={{ width: `${(unratedExec / trades.length) * 100}%` }} />
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-success/80" />{goodExec.length} good</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-destructive/80" />{badExec.length} bad</span>
                  {unratedExec > 0 && (
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />{unratedExec} unrated</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cumulative R curve + result pie */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="bg-card border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Cumulative R Curve</CardTitle>
                </CardHeader>
                <CardContent>
                  {rrCurve.length > 1 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart
                        data={rrCurve}
                        margin={{ top: 5, right: 5, bottom: 0, left: 10 }}
                      >
                        <defs>
                          <linearGradient id="rrGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop
                              offset="5%"
                              stopColor="var(--color-chart-1)"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="var(--color-chart-1)"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--color-border)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `${v}R`}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="r"
                          name="Cumulative R"
                          stroke="var(--color-chart-1)"
                          strokeWidth={2}
                          fill="url(#rrGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">
                      Need at least 2 trades to display the curve.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Result pie */}
            <Card className="bg-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Result Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={resultData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {resultData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0];
                        return (
                          <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs">
                            <p
                              style={{ color: (d.payload as { color: string }).color }}
                              className="font-semibold"
                            >
                              {d.name}: {d.value}
                            </p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {resultData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: d.color }}
                      />
                      <span className="text-muted-foreground">
                        {d.name} ({d.value})
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Long vs Short */}
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                label: "Long",
                count: longTrades.length,
                winRate: longWinRate,
                avgRR: longAvgRR,
                color: "text-success",
              },
              {
                label: "Short",
                count: shortTrades.length,
                winRate: shortWinRate,
                avgRR: shortAvgRR,
                color: "text-destructive",
              },
            ].map(({ label, count, winRate: wr, avgRR: ar, color }) => (
              <Card key={label} className="bg-card border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold">{label} Trades</p>
                    <span className={cn("text-xs font-medium", color)}>
                      {count} trade{count !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold">{wr}%</p>
                      <p className="text-xs text-muted-foreground">Win rate</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">{ar}R</p>
                      <p className="text-xs text-muted-foreground">Avg R:R</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Session breakdown table */}
          {sessionData.length > 0 && (
            <Card className="bg-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Performance by Session</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  <div className="grid grid-cols-3 px-5 py-2 text-xs text-muted-foreground uppercase tracking-wider">
                    <span>Session</span>
                    <span className="text-center">Trades</span>
                    <span className="text-right">Win %</span>
                  </div>
                  {sessionData.map((s) => (
                    <div key={s.session} className="grid grid-cols-3 px-5 py-3.5 text-sm">
                      <span className="font-medium">{s.session}</span>
                      <span className="text-center text-muted-foreground">{s.trades}</span>
                      <span
                        className={cn(
                          "text-right font-semibold",
                          s.winRate >= 60
                            ? "text-success"
                            : s.winRate >= 40
                            ? "text-warning"
                            : "text-destructive"
                        )}
                      >
                        {s.winRate}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instrument detail table */}
          {instrumentData.length > 0 && (
            <Card className="bg-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Instrument Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  <div className="grid grid-cols-3 px-5 py-2 text-xs text-muted-foreground uppercase tracking-wider">
                    <span>Instrument</span>
                    <span className="text-center">Trades</span>
                    <span className="text-right">Win % · Avg R:R</span>
                  </div>
                  {instrumentData.map((d) => (
                    <div key={d.name} className="grid grid-cols-3 px-5 py-3.5 text-sm">
                      <span className="font-medium">{d.name}</span>
                      <span className="text-center text-muted-foreground">{d.trades}</span>
                      <div className="text-right">
                        <span
                          className={cn(
                            "font-semibold",
                            d.winRate >= 60
                              ? "text-success"
                              : d.winRate >= 40
                              ? "text-warning"
                              : "text-destructive"
                          )}
                        >
                          {d.winRate}%
                        </span>
                        <span className="text-muted-foreground mx-1">·</span>
                        <span className="text-primary font-medium">{d.avgRR}R</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
      </PageWrapper>
    </div>
  );
}

/* ── Week journal & reflection ─────────────────────────────────────────────
 * Surfaces the qualitative record the trader wrote for the week being viewed:
 * the Journal's Weekly Review (mistakes / lessons / prevention) and the deeper
 * Weekly Reflection. Read-only here — editing stays on the review page. */
function WeekReflectionCard({
  weekStart, label, review, reflection,
}: {
  weekStart: string;
  label: string;
  review: WeeklyTradeReview | null;
  reflection: WeeklyReflection | null;
}) {
  const reviewFields = [
    { icon: AlertTriangle, iconClass: "text-destructive", label: "Mistakes made", value: review?.mistakes },
    { icon: Lightbulb, iconClass: "text-warning", label: "Lessons learned", value: review?.lessons },
    { icon: ListChecks, iconClass: "text-success", label: "Prevention plan", value: review?.prevention_plan },
  ].filter((f) => f.value?.trim());

  const reflectionFields = [
    { label: "Best habits", value: reflection?.best_habits },
    { label: "Biggest weakness", value: reflection?.biggest_weakness },
    { label: "Emotional patterns", value: reflection?.emotional_patterns },
    { label: "What improved", value: reflection?.what_improved },
    { label: "What hurt performance", value: reflection?.what_hurt_performance },
    { label: "Focus next week", value: reflection?.focus_next_week },
  ].filter((f) => f.value?.trim());

  const hasContent = reviewFields.length > 0 || reflectionFields.length > 0;

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-3 flex-row items-center justify-between gap-3 space-y-0">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm font-semibold">Week journal &amp; reflection</CardTitle>
        </div>
        <Link
          href={`/journal/review/${weekStart}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline shrink-0"
        >
          {hasContent ? "Open review" : "Write review"} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        {!hasContent ? (
          <p className="text-sm text-muted-foreground">
            No written review for {label} yet — capture the mistakes, lessons and plan while it&apos;s fresh.
          </p>
        ) : (
          <div className="space-y-4">
            {reviewFields.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-3">
                {reviewFields.map(({ icon: Icon, iconClass, label: fl, value }) => (
                  <div key={fl} className="rounded-lg border border-border/50 bg-muted/15 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground/85 mb-1.5">
                      <Icon className={cn("w-3.5 h-3.5", iconClass)} /> {fl}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{value}</p>
                  </div>
                ))}
              </div>
            )}
            {reflectionFields.length > 0 && (
              <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 pt-1">
                {reflectionFields.map(({ label: fl, value }) => (
                  <div key={fl}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">{fl}</p>
                    <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
