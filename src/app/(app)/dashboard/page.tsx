"use client";

import Link from "next/link";
import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
} from "date-fns";
import {
  TrendingUp,
  TrendingDown,
  BookOpen,
  LineChart,
  BarChart2,
  Wallet,
  ArrowRight,
  Target,
  Activity,
  DollarSign,
  Plus,
  Zap,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Flame,
  Brain,
  Moon,
  Check,
  Minus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  getDashboardStats,
  getTrades,
  getAccounts,
  getFeaturedNews,
  getHabits,
  getHabitCompletions,
  getDaySummary,
  getAnalyses,
} from "@/lib/mock/store";
import { cn } from "@/lib/utils";
import type { TradeResult } from "@/lib/types";

function ResultBadge({ result }: { result: TradeResult }) {
  if (result === "win")
    return (
      <span
        className="inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold"
        style={{ background: "oklch(0.58 0.17 145 / 0.15)", color: "oklch(0.58 0.17 145)" }}
      >
        W
      </span>
    );
  if (result === "loss")
    return (
      <span
        className="inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold"
        style={{ background: "oklch(0.58 0.22 25 / 0.15)", color: "oklch(0.58 0.22 25)" }}
      >
        L
      </span>
    );
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold"
      style={{ background: "oklch(0.70 0.16 72 / 0.15)", color: "oklch(0.70 0.16 72)" }}
    >
      B
    </span>
  );
}

// ── Connected Calendar ────────────────────────────────────────────────────────
function ConnectedCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const trades = getTrades();
  const habits = getHabits();
  const allCompletions = getHabitCompletions();
  const allAnalyses = getAnalyses();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let d = calStart;
  while (d <= calEnd) {
    days.push(d);
    d = addDays(d, 1);
  }

  const today = new Date();

  function getDayData(date: Date) {
    const dateStr = format(date, "yyyy-MM-dd");
    const dayTrades = trades.filter((t) => t.date_time.slice(0, 10) === dateStr);
    const dayAnalyses = allAnalyses.filter((a) => a.date === dateStr);
    const dayCompletions = allCompletions.filter((c) => c.date === dateStr && c.completed);
    const habitRate = habits.length > 0 ? dayCompletions.length / habits.length : 0;

    return {
      trades: dayTrades,
      hasAnalysis: dayAnalyses.length > 0,
      habitRate,
      habitCount: dayCompletions.length,
    };
  }

  // Selected day detail
  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const selectedSummary = selectedDateStr ? getDaySummary(selectedDateStr) : null;
  const selectedDayTrades = selectedDateStr
    ? trades.filter((t) => t.date_time.slice(0, 10) === selectedDateStr)
    : [];

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "oklch(0.10 0.022 278)",
        border: "1px solid oklch(0.18 0.030 278)",
      }}
    >
      {/* Calendar Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid oklch(0.18 0.030 278)" }}
      >
        <div>
          <h2 className="text-sm font-semibold">Day Overview</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Click any day to see the full story</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors hover:bg-white/5"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-semibold px-2 w-28 text-center">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors hover:bg-white/5"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="text-center text-xs text-muted-foreground py-1 font-medium">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, today);
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            const { trades: dayTrades, hasAnalysis, habitRate } = getDayData(day);

            const hasWin = dayTrades.some((t) => t.result === "win");
            const hasLoss = dayTrades.some((t) => t.result === "loss");
            const hasBreakEven = dayTrades.some((t) => t.result === "break-even");

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(isSelected ? null : day)}
                className="relative flex flex-col items-center rounded-lg p-1 transition-all hover:bg-white/5 min-h-12"
                style={{
                  opacity: isCurrentMonth ? 1 : 0.3,
                  background: isSelected
                    ? "oklch(0.78 0.16 198 / 0.12)"
                    : isToday
                    ? "oklch(0.78 0.16 198 / 0.06)"
                    : undefined,
                  border: isSelected
                    ? "1px solid oklch(0.78 0.16 198 / 0.40)"
                    : isToday
                    ? "1px solid oklch(0.78 0.16 198 / 0.20)"
                    : "1px solid transparent",
                }}
              >
                <span
                  className="text-xs font-medium mb-0.5"
                  style={{
                    color: isToday
                      ? "oklch(0.78 0.16 198)"
                      : isCurrentMonth
                      ? "oklch(0.70 0.04 252)"
                      : "oklch(0.40 0.03 278)",
                  }}
                >
                  {format(day, "d")}
                </span>

                {/* Indicators */}
                <div className="flex flex-wrap gap-0.5 justify-center">
                  {hasAnalysis && (
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "oklch(0.62 0.26 290)" }}
                      title="Pre-market analysis"
                    />
                  )}
                  {hasWin && (
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "oklch(0.58 0.17 145)" }}
                      title="Win"
                    />
                  )}
                  {hasLoss && (
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "oklch(0.58 0.22 25)" }}
                      title="Loss"
                    />
                  )}
                  {hasBreakEven && (
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "oklch(0.70 0.16 72)" }}
                      title="Break-even"
                    />
                  )}
                </div>

                {/* Habit ring at bottom */}
                {habitRate > 0 && (
                  <div
                    className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full"
                    style={{
                      background: habitRate >= 0.7
                        ? "oklch(0.78 0.16 198)"
                        : "oklch(0.55 0.04 278)",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-3 pt-3" style={{ borderTop: "1px solid oklch(0.18 0.030 278)" }}>
          {[
            { color: "oklch(0.62 0.26 290)", label: "Analysis" },
            { color: "oklch(0.58 0.17 145)", label: "Win" },
            { color: "oklch(0.58 0.22 25)", label: "Loss" },
            { color: "oklch(0.70 0.16 72)", label: "B/E" },
            { color: "oklch(0.78 0.16 198)", label: "Habits" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDate && selectedSummary && (
        <div
          className="px-5 py-4 space-y-4"
          style={{ borderTop: "1px solid oklch(0.18 0.030 278)" }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </h3>
            {isSameDay(selectedDate, today) && (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-md"
                style={{ background: "oklch(0.78 0.16 198 / 0.15)", color: "oklch(0.78 0.16 198)" }}
              >
                Today
              </span>
            )}
          </div>

          {/* Day story */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <DayStoryBlock
              icon={LineChart}
              label="Pre-Market"
              done={selectedSummary.hasAnalysis}
              detail={selectedSummary.hasAnalysis ? `${selectedSummary.analysisCount} analysis done` : "No analysis"}
              color="oklch(0.62 0.26 290)"
              href={`/analysis?date=${selectedDateStr}`}
            />
            <DayStoryBlock
              icon={CheckSquare}
              label="Habits"
              done={selectedSummary.habitCompleted > 0}
              detail={`${selectedSummary.habitCompleted}/${selectedSummary.habitCount} completed`}
              color="oklch(0.78 0.16 198)"
              href="/habits"
            />
            <DayStoryBlock
              icon={Flame}
              label="Journal"
              done={selectedSummary.hasJournal}
              detail={selectedSummary.hasJournal ? "Written" : "Not written"}
              color="oklch(0.70 0.16 72)"
              href={`/self-improvement`}
            />
            <DayStoryBlock
              icon={Brain}
              label="State Check"
              done={selectedSummary.hasStateCheck}
              detail={selectedSummary.hasStateCheck && selectedSummary.stateScore !== null
                ? `Avg score: ${selectedSummary.stateScore}/10`
                : "Not logged"}
              color="oklch(0.62 0.26 290)"
              href="/self-improvement"
            />
            <DayStoryBlock
              icon={Moon}
              label="Recovery"
              done={selectedSummary.hasSleep}
              detail={selectedSummary.hasSleep ? "Logged" : "Not logged"}
              color="oklch(0.58 0.17 145)"
              href="/self-improvement"
            />
            <DayStoryBlock
              icon={BookOpen}
              label="Trades"
              done={selectedSummary.tradeCount > 0}
              detail={selectedSummary.tradeCount > 0
                ? `${selectedSummary.tradeCount} trade${selectedSummary.tradeCount > 1 ? "s" : ""} · ${selectedSummary.tradeWins}W`
                : "No trades"}
              color="oklch(0.58 0.17 145)"
              href={`/journal`}
            />
          </div>

          {/* Trades on this day */}
          {selectedDayTrades.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Trades taken</p>
              <div className="space-y-1">
                {selectedDayTrades.map((trade) => (
                  <Link
                    key={trade.id}
                    href={`/journal/${trade.id}`}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-white/5"
                    style={{ border: "1px solid oklch(0.18 0.030 278)" }}
                  >
                    <ResultBadge result={trade.result} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{trade.instrument}</span>
                      <span className="text-xs text-muted-foreground ml-2 capitalize">{trade.session} · {trade.direction}</span>
                    </div>
                    <span
                      className="text-sm font-bold"
                      style={{
                        color: trade.result === "win"
                          ? "oklch(0.58 0.17 145)"
                          : trade.result === "loss"
                          ? "oklch(0.58 0.22 25)"
                          : "oklch(0.70 0.16 72)",
                      }}
                    >
                      {trade.result === "win" ? "+" : trade.result === "loss" ? "-" : ""}
                      {trade.rr}R
                    </span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DayStoryBlock({
  icon: Icon,
  label,
  done,
  detail,
  color,
  href,
}: {
  icon: React.ElementType;
  label: string;
  done: boolean;
  detail: string;
  color: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <div
        className="rounded-lg p-3 transition-all hover:border-opacity-60 cursor-pointer"
        style={{
          background: done ? `${color}0d` : "oklch(0.08 0.018 278)",
          border: `1px solid ${done ? `${color}2a` : "oklch(0.18 0.030 278)"}`,
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
            style={{ background: `${color}1a` }}
          >
            {done ? (
              <Check className="w-3 h-3" style={{ color }} />
            ) : (
              <Icon className="w-3 h-3" style={{ color: "oklch(0.40 0.03 278)" }} />
            )}
          </div>
          <span
            className="text-xs font-semibold"
            style={{ color: done ? color : "oklch(0.55 0.04 278)" }}
          >
            {label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-tight">{detail}</p>
      </div>
    </Link>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const stats = getDashboardStats();
  const recentTrades = getTrades().slice(0, 5);
  const accounts = getAccounts();
  const featuredNews = getFeaturedNews();

  const statCards = [
    {
      label: "Total Trades",
      value: stats.total_trades.toString(),
      icon: Activity,
      sub: `${stats.win_rate}% win rate`,
      accent: "oklch(0.78 0.16 198)",
      accentBg: "oklch(0.78 0.16 198 / 0.10)",
    },
    {
      label: "Avg R:R",
      value: `${stats.average_rr}R`,
      icon: Zap,
      sub: `${stats.break_even_rate}% break-even rate`,
      accent: "oklch(0.62 0.26 290)",
      accentBg: "oklch(0.62 0.26 290 / 0.10)",
    },
    {
      label: "Active Accounts",
      value: stats.active_accounts.toString(),
      icon: Wallet,
      sub: `$${stats.total_payouts.toLocaleString()} paid out`,
      accent: "oklch(0.58 0.17 145)",
      accentBg: "oklch(0.58 0.17 145 / 0.10)",
    },
    {
      label: "Drawdown Used",
      value: `$${stats.total_drawdown_used.toLocaleString()}`,
      icon: Target,
      sub: "Across all funded accounts",
      accent: "oklch(0.70 0.16 72)",
      accentBg: "oklch(0.70 0.16 72 / 0.10)",
    },
  ];

  const quickLinks = [
    { href: "/journal", label: "Trade Journal", icon: BookOpen, desc: "Log a new trade" },
    { href: "/analysis", label: "Pre-Market", icon: LineChart, desc: "Write analysis" },
    { href: "/self-improvement", label: "Self-Improvement", icon: Flame, desc: "Daily check-in" },
    { href: "/habits", label: "Habits", icon: CheckSquare, desc: "Daily routines" },
    { href: "/analytics", label: "Analytics", icon: BarChart2, desc: "Performance review" },
    { href: "/accounts", label: "Funded Accounts", icon: Wallet, desc: "Track accounts" },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, sub, accent, accentBg }, i) => (
          <div
            key={label}
            className="animate-fade-up rounded-xl p-5 relative overflow-hidden"
            style={{
              background: "oklch(0.10 0.022 278)",
              border: "1px solid oklch(0.18 0.030 278)",
              animationDelay: `${i * 60}ms`,
            }}
          >
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${accent.replace(')', ' / 0.40)')}, transparent)` }}
            />
            <div className="flex items-start justify-between mb-4">
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "oklch(0.45 0.04 278)" }}
              >
                {label}
              </p>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: accentBg }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
              </div>
            </div>
            <p
              className="text-3xl font-black tracking-tight mb-1 tabular-nums"
              style={{ color: accent }}
            >
              {value}
            </p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {/* Calendar + Accounts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Connected Calendar */}
        <div className="lg:col-span-2 animate-fade-up" style={{ animationDelay: "200ms" }}>
          <ConnectedCalendar />
        </div>

        {/* Accounts summary */}
        <div className="space-y-4 animate-fade-up" style={{ animationDelay: "280ms" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Funded Accounts</h2>
            <Link
              href="/accounts"
              className="text-xs flex items-center gap-1 transition-colors hover:opacity-80"
              style={{ color: "oklch(0.78 0.16 198)" }}
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {accounts.length === 0 && (
            <div
              className="rounded-xl p-6 text-center"
              style={{
                background: "oklch(0.10 0.022 278)",
                border: "1px solid oklch(0.18 0.030 278)",
              }}
            >
              <p className="text-sm text-muted-foreground mb-3">No accounts added yet.</p>
              <Link
                href="/accounts/new"
                className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
                style={{ color: "oklch(0.78 0.16 198)" }}
              >
                <Plus className="w-3.5 h-3.5" /> Add funded account
              </Link>
            </div>
          )}

          {accounts.map((acct) => {
            const drawdownPct = Math.round((acct.drawdown_used / acct.max_drawdown) * 100);
            const payoutPct = Math.min(
              100,
              Math.round((acct.payout_total / acct.next_payout_target) * 100)
            );
            // ROI multiple = payout / fees paid (e.g. 2.0x)
            const roi = acct.purchase_cost > 0
              ? Math.round((acct.payout_total / acct.purchase_cost) * 10) / 10
              : 0;
            return (
              <Link key={acct.id} href={`/accounts/${acct.id}`}>
                <div
                  className="rounded-xl p-4 transition-all hover:border-opacity-60 cursor-pointer"
                  style={{
                    background: "oklch(0.10 0.022 278)",
                    border: "1px solid oklch(0.18 0.030 278)",
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-semibold">{acct.account_name}</p>
                      <p className="text-xs text-muted-foreground">{acct.firm_name}</p>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-md font-medium capitalize"
                      style={
                        acct.phase === "funded"
                          ? { background: "oklch(0.58 0.17 145 / 0.15)", color: "oklch(0.58 0.17 145)" }
                          : acct.phase === "evaluation"
                          ? { background: "oklch(0.70 0.16 72 / 0.15)", color: "oklch(0.70 0.16 72)" }
                          : { background: "oklch(0.78 0.16 198 / 0.15)", color: "oklch(0.78 0.16 198)" }
                      }
                    >
                      {acct.phase}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1 mb-3">
                    <span
                      className="text-lg font-black tabular-nums"
                      style={{
                        color: roi >= 1 ? "oklch(0.58 0.17 145)" : roi > 0 ? "oklch(0.70 0.16 72)" : "oklch(0.58 0.22 25)",
                      }}
                    >
                      {roi}x
                    </span>
                    <span className="text-xs text-muted-foreground">return on fees</span>
                  </div>

                  <div className="space-y-1 mb-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Drawdown</span>
                      <span>{drawdownPct}%</span>
                    </div>
                    <Progress
                      value={drawdownPct}
                      className={cn(
                        "h-1.5",
                        drawdownPct > 60 ? "[&>div]:bg-destructive" : "[&>div]:bg-warning"
                      )}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Payout progress</span>
                      <span>
                        ${acct.payout_total.toLocaleString()} /{" "}
                        ${acct.next_payout_target.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={payoutPct} className="h-1.5 [&>div]:bg-primary" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent trades */}
      <div className="animate-fade-up" style={{ animationDelay: "320ms" }}>
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "oklch(0.10 0.022 278)",
            border: "1px solid oklch(0.18 0.030 278)",
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid oklch(0.18 0.030 278)" }}
          >
            <h2 className="text-sm font-semibold">Recent Trades</h2>
            <Link
              href="/journal"
              className="text-xs flex items-center gap-1 transition-colors hover:opacity-80"
              style={{ color: "oklch(0.78 0.16 198)" }}
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentTrades.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-muted-foreground mb-3">No trades logged yet.</p>
              <Link
                href="/journal/new"
                className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
                style={{ color: "oklch(0.78 0.16 198)" }}
              >
                <Plus className="w-3.5 h-3.5" /> Log your first trade
              </Link>
            </div>
          ) : (
            <div>
              {recentTrades.map((trade, i) => (
                <Link
                  key={trade.id}
                  href={`/journal/${trade.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
                  style={{
                    borderBottom: i < recentTrades.length - 1 ? "1px solid oklch(0.18 0.030 278)" : undefined,
                  }}
                >
                  <div className="flex items-center gap-2 shrink-0">
                    <ResultBadge result={trade.result} />
                    {trade.direction === "long" ? (
                      <TrendingUp className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{trade.instrument}</p>
                    <p className="text-xs text-muted-foreground truncate capitalize">
                      {trade.session} · {trade.market}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className="text-sm font-bold"
                      style={{
                        color:
                          trade.result === "win"
                            ? "oklch(0.58 0.17 145)"
                            : trade.result === "loss"
                            ? "oklch(0.58 0.22 25)"
                            : "oklch(0.70 0.16 72)",
                      }}
                    >
                      {trade.result === "win" ? "+" : trade.result === "loss" ? "-" : ""}
                      {trade.rr}R
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(trade.date_time.slice(0, 10) + "T12:00:00"), "MMM d")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick navigation */}
      <div className="animate-fade-up" style={{ animationDelay: "400ms" }}>
        <h2 className="text-sm font-semibold mb-4">Quick Navigation</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {quickLinks.map(({ href, label, icon: Icon, desc }) => (
            <Link key={href} href={href}>
              <div
                className="rounded-xl p-4 transition-all hover:-translate-y-0.5 cursor-pointer group"
                style={{
                  background: "oklch(0.10 0.022 278)",
                  border: "1px solid oklch(0.18 0.030 278)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-all group-hover:scale-110"
                  style={{
                    background: "oklch(0.78 0.16 198 / 0.10)",
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: "oklch(0.78 0.16 198)" }} />
                </div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured news */}
      {featuredNews.length > 0 && (
        <div className="animate-fade-up" style={{ animationDelay: "480ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Featured News</h2>
            <Link
              href="/news"
              className="text-xs flex items-center gap-1 transition-colors hover:opacity-80"
              style={{ color: "oklch(0.78 0.16 198)" }}
            >
              All news <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {featuredNews.map((item) => (
              <div
                key={item.id}
                className="rounded-xl p-4"
                style={{
                  background: "oklch(0.10 0.022 278)",
                  border: "1px solid oklch(0.18 0.030 278)",
                }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="text-xs px-2 py-0.5 rounded-md font-semibold shrink-0 mt-0.5 capitalize"
                    style={
                      item.impact_level === "high"
                        ? { background: "oklch(0.58 0.22 25 / 0.15)", color: "oklch(0.58 0.22 25)" }
                        : item.impact_level === "medium"
                        ? { background: "oklch(0.70 0.16 72 / 0.15)", color: "oklch(0.70 0.16 72)" }
                        : { background: "oklch(0.22 0.032 278)", color: "oklch(0.55 0.04 278)" }
                    }
                  >
                    {item.impact_level}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-snug mb-1">{item.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
                    <p
                      className="text-xs mt-2"
                      style={{ color: "oklch(0.40 0.03 278)" }}
                    >
                      {item.source_name} · {format(new Date(item.published_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
