"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Target, CheckSquare, TrendingUp, TrendingDown,
  Activity, AlertTriangle, BookOpen, Flame,
  ChevronRight, Circle, CheckCircle2, Brain,
  Zap, Shield, BarChart2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getTrades, getHabits, getHabitCompletions, getPlaybook,
  getDailyState, saveDailyState, getAccounts, getAvgDisciplineScore,
} from "@/lib/mock/store";
import { cn } from "@/lib/utils";
import type {
  TradeJournalEntry, Habit, HabitCompletion, TraderPlaybook,
  DailyCommandState, FundedAccount,
} from "@/lib/types";

const TODAY = format(new Date(), "yyyy-MM-dd");
const TODAY_LABEL = format(new Date(), "EEEE, MMMM d");

const DEFAULT_CHECKLIST = [
  "Reviewed HTF bias and key levels",
  "Checked economic calendar for news",
  "Identified today's best setups",
  "Reviewed my non-negotiable rules",
  "Mentally prepared — no emotional trading",
];

function ScoreDot({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.round((value / max) * 100);
  const color =
    pct >= 80 ? "oklch(0.72 0.17 145)"
    : pct >= 60 ? "oklch(0.72 0.22 45)"
    : "oklch(0.65 0.22 25)";
  return (
    <span className="font-bold text-lg" style={{ color }}>
      {value}
      {max !== 100 && <span className="text-xs text-muted-foreground font-normal">/{max}</span>}
    </span>
  );
}

function MiniTrade({ trade }: { trade: TradeJournalEntry }) {
  const isWin = trade.result === "win";
  const isLoss = trade.result === "loss";
  const disciplineScore = trade.discipline?.score;

  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div className="flex items-center gap-2.5">
        {trade.direction === "long"
          ? <TrendingUp className="w-3.5 h-3.5 text-success shrink-0" />
          : <TrendingDown className="w-3.5 h-3.5 text-destructive shrink-0" />}
        <div>
          <p className="text-xs font-semibold text-foreground">{trade.instrument}</p>
          <p className="text-[10px] text-muted-foreground">{trade.session} · {trade.timeframe}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {disciplineScore !== undefined && (
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{
              background: disciplineScore >= 80
                ? "oklch(0.72 0.17 145 / 0.12)"
                : "oklch(0.72 0.22 45 / 0.12)",
              color: disciplineScore >= 80
                ? "oklch(0.72 0.17 145)"
                : "oklch(0.72 0.22 45)",
            }}
          >
            D:{disciplineScore}
          </span>
        )}
        <span className={cn(
          "text-sm font-bold",
          isWin ? "text-success" : isLoss ? "text-destructive" : "text-warning"
        )}>
          {isWin ? "+" : ""}{trade.rr}R
        </span>
      </div>
    </div>
  );
}

export default function CommandCenterPage() {
  const [state, setState] = useState<DailyCommandState | null>(null);
  const [trades, setTrades] = useState<TradeJournalEntry[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [playbook, setPlaybook] = useState<TraderPlaybook | null>(null);
  const [accounts, setAccounts] = useState<FundedAccount[]>([]);

  useEffect(() => {
    const allTrades = getTrades();
    const allHabits = getHabits();
    const allCompletions = getHabitCompletions();
    const pb = getPlaybook();
    const accts = getAccounts();
    const ds = getDailyState(TODAY);

    setTrades(allTrades);
    setHabits(allHabits);
    setCompletions(allCompletions);
    setPlaybook(pb);
    setAccounts(accts);

    // Ensure checklist length matches
    if (ds.pre_trade_checklist.length === 0) {
      ds.pre_trade_checklist = DEFAULT_CHECKLIST.map(() => false);
    }
    while (ds.pre_trade_checklist.length < DEFAULT_CHECKLIST.length) {
      ds.pre_trade_checklist.push(false);
    }
    setState(ds);
  }, []);

  function updateState(patch: Partial<DailyCommandState>) {
    if (!state) return;
    const updated = { ...state, ...patch, updated_at: new Date().toISOString() };
    setState(updated);
    saveDailyState(updated);
  }

  function toggleChecklist(idx: number) {
    if (!state) return;
    const next = [...state.pre_trade_checklist];
    next[idx] = !next[idx];
    updateState({ pre_trade_checklist: next });
  }

  function toggleHabit(habitId: string) {
    // Optimistic toggle — in real app, would call createHabitCompletion / remove
    const exists = completions.find(
      (c) => c.habit_id === habitId && c.date === TODAY && c.completed
    );
    if (exists) {
      setCompletions((prev) => prev.filter((c) => !(c.habit_id === habitId && c.date === TODAY && c.completed)));
    } else {
      const newC: HabitCompletion = {
        id: `hc_${Date.now()}`,
        habit_id: habitId,
        date: TODAY,
        completed: true,
      };
      setCompletions((prev) => [...prev, newC]);
    }
  }

  if (!state) return null;

  const todayTrades = trades.filter((t) => t.date_time.startsWith(TODAY));
  const checklistDone = state.pre_trade_checklist.filter(Boolean).length;
  const checklistTotal = DEFAULT_CHECKLIST.length;
  const checklistPct = Math.round((checklistDone / checklistTotal) * 100);

  const todayHabits = habits;
  const todayCompletedHabits = completions
    .filter((c) => c.date === TODAY && c.completed)
    .map((c) => c.habit_id);
  const habitPct = todayHabits.length > 0
    ? Math.round((todayCompletedHabits.length / todayHabits.length) * 100)
    : 0;

  const avgDiscipline = todayTrades.length > 0 ? getAvgDisciplineScore(todayTrades) : null;

  // Weekly discipline from last 7 days
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekTrades = trades.filter((t) => new Date(t.date_time) >= weekAgo);
  const weekDiscipline = getAvgDisciplineScore(weekTrades);

  // Total risk deployed today
  const todayWins = todayTrades.filter((t) => t.result === "win").length;
  const todayLosses = todayTrades.filter((t) => t.result === "loss").length;

  // Max trades per day from playbook
  const maxTrades = playbook?.max_trades_per_day ?? 3;
  const tradesRemaining = Math.max(0, maxTrades - todayTrades.length);
  const maxRisk = playbook?.max_daily_risk_percent ?? 2;

  // Account summary
  const totalBalance = accounts.reduce((sum, a) => sum + a.current_balance, 0);
  const atRiskAccounts = accounts.filter((a) => {
    const drawdown = ((a.start_balance - a.current_balance) / a.start_balance) * 100;
    return drawdown > 3;
  });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "oklch(0.94 0.002 28)" }}
          >
            Command Center
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{TODAY_LABEL}</p>
        </div>
        <div
          className="text-right px-4 py-2.5 rounded-xl"
          style={{ background: "oklch(1 0 0 / 3%)", border: "1px solid oklch(1 0 0 / 6%)" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Total Capital
          </p>
          <p className="text-xl font-bold text-foreground">
            ${totalBalance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Top status row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Pre-Trade",
            value: `${checklistDone}/${checklistTotal}`,
            sub: checklistPct === 100 ? "Ready to trade" : "Complete checklist",
            icon: CheckSquare,
            color: checklistPct === 100 ? "oklch(0.72 0.17 145)" : "oklch(0.72 0.22 45)",
            pct: checklistPct,
          },
          {
            label: "Habits",
            value: `${todayCompletedHabits.length}/${todayHabits.length}`,
            sub: `${habitPct}% complete`,
            icon: Flame,
            color: habitPct >= 80 ? "oklch(0.72 0.17 145)" : "oklch(0.72 0.22 45)",
            pct: habitPct,
          },
          {
            label: "Trades Today",
            value: `${todayTrades.length}/${maxTrades}`,
            sub: tradesRemaining > 0 ? `${tradesRemaining} remaining` : "Limit reached",
            icon: Target,
            color: tradesRemaining > 0 ? "oklch(0.72 0.22 45)" : "oklch(0.65 0.22 25)",
            pct: Math.min(100, Math.round((todayTrades.length / maxTrades) * 100)),
          },
          {
            label: "Discipline",
            value: avgDiscipline !== null ? `${avgDiscipline}` : "—",
            sub: avgDiscipline !== null
              ? avgDiscipline >= 80 ? "Excellent process" : "Room to improve"
              : "No trades yet",
            icon: Shield,
            color: avgDiscipline !== null
              ? avgDiscipline >= 80 ? "oklch(0.72 0.17 145)" : "oklch(0.72 0.22 45)"
              : "oklch(0.72 0.22 45)",
            pct: avgDiscipline ?? 0,
          },
        ].map(({ label, value, sub, icon: Icon, color, pct }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </div>
              <p className="text-xl font-bold" style={{ color }}>{value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
              <div
                className="mt-2.5 h-1 rounded-full overflow-hidden"
                style={{ background: "oklch(1 0 0 / 6%)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left col: checklist + focus + context */}
        <div className="lg:col-span-2 space-y-5">
          {/* Today's Focus */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4" style={{ color: "oklch(0.72 0.22 45)" }} />
                Today's Focus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={state.focus_note}
                onChange={(e) => updateState({ focus_note: e.target.value })}
                placeholder="What is your #1 focus for today? (e.g. 'Only A+ setups, no FOMO trades')"
                className="w-full text-sm leading-relaxed resize-none outline-none bg-transparent text-foreground placeholder:text-muted-foreground/50 min-h-[60px]"
                rows={2}
              />
            </CardContent>
          </Card>

          {/* Pre-Trade Checklist */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-primary" />
                  Pre-Trade Checklist
                </CardTitle>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: checklistPct === 100
                      ? "oklch(0.72 0.17 145 / 0.12)"
                      : "oklch(1 0 0 / 6%)",
                    color: checklistPct === 100
                      ? "oklch(0.72 0.17 145)"
                      : "oklch(0.90 0.003 28 / 50%)",
                  }}
                >
                  {checklistDone}/{checklistTotal}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {DEFAULT_CHECKLIST.map((item, idx) => {
                const done = state.pre_trade_checklist[idx] ?? false;
                return (
                  <button
                    key={idx}
                    onClick={() => toggleChecklist(idx)}
                    className="w-full flex items-center gap-3 text-left group"
                  >
                    <div
                      className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center border transition-all"
                      style={{
                        background: done ? "oklch(0.72 0.17 145 / 0.15)" : "transparent",
                        borderColor: done ? "oklch(0.72 0.17 145 / 0.40)" : "oklch(1 0 0 / 12%)",
                      }}
                    >
                      {done && <CheckCircle2 className="w-3 h-3" style={{ color: "oklch(0.72 0.17 145)" }} />}
                    </div>
                    <span className={cn(
                      "text-sm transition-colors",
                      done ? "text-foreground/40 line-through" : "text-foreground/70 group-hover:text-foreground/90"
                    )}>
                      {item}
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Market Context */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Market Context
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-3">
                {/* Regime */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Regime
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {(["trending", "ranging", "choppy"] as const).map((r) => {
                      const active = state.market_context.regime === r;
                      return (
                        <button
                          key={r}
                          onClick={() => updateState({ market_context: { ...state.market_context, regime: r } })}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all"
                          style={{
                            background: active ? "oklch(0.72 0.22 45 / 0.15)" : "oklch(1 0 0 / 5%)",
                            color: active ? "oklch(0.72 0.22 45)" : "oklch(0.90 0.003 28 / 50%)",
                            border: `1px solid ${active ? "oklch(0.72 0.22 45 / 0.30)" : "transparent"}`,
                          }}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Volatility */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Volatility
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {(["low", "medium", "high"] as const).map((v) => {
                      const active = state.market_context.volatility === v;
                      return (
                        <button
                          key={v}
                          onClick={() => updateState({ market_context: { ...state.market_context, volatility: v } })}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all"
                          style={{
                            background: active ? "oklch(0.72 0.22 45 / 0.15)" : "oklch(1 0 0 / 5%)",
                            color: active ? "oklch(0.72 0.22 45)" : "oklch(0.90 0.003 28 / 50%)",
                            border: `1px solid ${active ? "oklch(0.72 0.22 45 / 0.30)" : "transparent"}`,
                          }}
                        >
                          {v}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* HTF Bias */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    HTF Bias
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {(["bullish", "bearish", "neutral"] as const).map((b) => {
                      const active = state.market_context.htf_bias === b;
                      const bColor = b === "bullish"
                        ? "oklch(0.72 0.17 145)"
                        : b === "bearish"
                        ? "oklch(0.65 0.22 25)"
                        : "oklch(0.72 0.22 45)";
                      return (
                        <button
                          key={b}
                          onClick={() => updateState({ market_context: { ...state.market_context, htf_bias: b } })}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all"
                          style={{
                            background: active ? bColor + " / 0.15)" : "oklch(1 0 0 / 5%)",
                            color: active ? bColor : "oklch(0.90 0.003 28 / 50%)",
                            border: `1px solid ${active ? bColor + " / 0.30)" : "transparent"}`,
                          }}
                        >
                          {b}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* News toggles */}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
                {[
                  { key: "news_day" as const, label: "News Day" },
                  { key: "major_event" as const, label: "Major Event" },
                ].map(({ key, label }) => {
                  const active = !!(state.market_context as Record<string, unknown>)[key];
                  return (
                    <button
                      key={key}
                      onClick={() => updateState({ market_context: { ...state.market_context, [key]: !active } })}
                      className="flex items-center gap-2 text-xs transition-colors"
                      style={{ color: active ? "oklch(0.72 0.22 45)" : "oklch(0.90 0.003 28 / 40%)" }}
                    >
                      <div
                        className="w-4 h-4 rounded border flex items-center justify-center transition-all"
                        style={{
                          background: active ? "oklch(0.72 0.22 45 / 0.15)" : "transparent",
                          borderColor: active ? "oklch(0.72 0.22 45 / 0.40)" : "oklch(1 0 0 / 15%)",
                        }}
                      >
                        {active && <span className="text-[8px]">✓</span>}
                      </div>
                      {label}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Today's Trades */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-primary" />
                  Today's Trades
                </CardTitle>
                <a
                  href="/journal/new"
                  className="text-[10px] font-semibold flex items-center gap-1 transition-colors"
                  style={{ color: "oklch(0.72 0.22 45)" }}
                >
                  + Log Trade <ChevronRight className="w-3 h-3" />
                </a>
              </div>
            </CardHeader>
            <CardContent>
              {todayTrades.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-muted-foreground">No trades logged today.</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Complete your checklist first.</p>
                </div>
              ) : (
                <div>
                  {todayTrades.map((t) => (
                    <MiniTrade key={t.id} trade={t} />
                  ))}
                  <div className="mt-3 pt-2 border-t border-border flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {todayWins}W · {todayLosses}L
                    </div>
                    {avgDiscipline !== null && (
                      <div className="text-xs text-muted-foreground">
                        Avg discipline: <span className="font-semibold text-foreground">{avgDiscipline}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* EOD Reflection */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Brain className="w-4 h-4" style={{ color: "oklch(0.72 0.22 45)" }} />
                End-of-Day Reflection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={state.eod_reflection}
                onChange={(e) => updateState({ eod_reflection: e.target.value })}
                placeholder="How did today go? What did you do well? What will you improve tomorrow?"
                className="w-full text-sm leading-relaxed resize-none outline-none bg-transparent text-foreground placeholder:text-muted-foreground/50 min-h-[80px]"
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right col: identity + habits + accounts */}
        <div className="space-y-5">
          {/* Identity reminder */}
          {playbook && (
            <Card className="shadow-sm" style={{ background: "oklch(0.72 0.22 45 / 0.04)", borderColor: "oklch(0.72 0.22 45 / 0.15)" }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: "oklch(0.72 0.22 45)" }}>
                  <BookOpen className="w-4 h-4" />
                  My Edge
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Trader Type
                  </p>
                  <p className="text-xs text-foreground capitalize">{playbook.trader_type.replace("_", " ")}</p>
                </div>
                {playbook.non_negotiable_rules.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Non-Negotiables
                    </p>
                    <div className="space-y-1">
                      {playbook.non_negotiable_rules.slice(0, 3).map((rule, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs text-foreground/70">
                          <span style={{ color: "oklch(0.72 0.22 45)", marginTop: 1 }}>›</span>
                          {rule}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Max trades/day</span>
                    <span className="font-semibold text-foreground">{playbook.max_trades_per_day}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-muted-foreground">Max daily risk</span>
                    <span className="font-semibold text-foreground">{playbook.max_daily_risk_percent}%</span>
                  </div>
                </div>
                <a
                  href="/playbook"
                  className="text-[10px] font-semibold flex items-center gap-1 transition-opacity hover:opacity-80"
                  style={{ color: "oklch(0.72 0.22 45)" }}
                >
                  View full playbook <ChevronRight className="w-3 h-3" />
                </a>
              </CardContent>
            </Card>
          )}

          {/* Habits */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Flame className="w-4 h-4" style={{ color: "oklch(0.72 0.22 45)" }} />
                  Habits
                </CardTitle>
                <Badge variant="outline" className="text-[10px]">
                  {todayCompletedHabits.length}/{todayHabits.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {todayHabits.length === 0 ? (
                <p className="text-xs text-muted-foreground">No habits set up yet.</p>
              ) : (
                todayHabits.map((habit) => {
                  const done = todayCompletedHabits.includes(habit.id);
                  return (
                    <button
                      key={habit.id}
                      onClick={() => toggleHabit(habit.id)}
                      className="w-full flex items-center gap-2.5 text-left group"
                    >
                      <div
                        className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center border transition-all"
                        style={{
                          background: done ? "oklch(0.72 0.22 45 / 0.15)" : "transparent",
                          borderColor: done ? "oklch(0.72 0.22 45 / 0.40)" : "oklch(1 0 0 / 12%)",
                        }}
                      >
                        {done && <span className="text-[8px]" style={{ color: "oklch(0.72 0.22 45)" }}>✓</span>}
                      </div>
                      <span className={cn(
                        "text-xs transition-colors",
                        done ? "text-foreground/35 line-through" : "text-foreground/70 group-hover:text-foreground/90"
                      )}>
                        {habit.name}
                      </span>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Account Risk */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" style={{ color: atRiskAccounts.length > 0 ? "oklch(0.65 0.22 25)" : "oklch(0.72 0.22 45)" }} />
                Account Risk
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {accounts.length === 0 ? (
                <p className="text-xs text-muted-foreground">No accounts added.</p>
              ) : (
                accounts.slice(0, 4).map((acct) => {
                  const drawdown = ((acct.start_balance - acct.current_balance) / acct.start_balance) * 100;
                  const isAtRisk = drawdown > 3;
                  return (
                    <div key={acct.id}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-foreground/70 truncate max-w-[110px]">{acct.firm_name} {acct.phase}</span>
                        <span
                          className="font-semibold"
                          style={{ color: isAtRisk ? "oklch(0.65 0.22 25)" : "oklch(0.72 0.17 145)" }}
                        >
                          {drawdown > 0 ? `-${drawdown.toFixed(1)}%` : "+0%"}
                        </span>
                      </div>
                      <div
                        className="h-1 rounded-full overflow-hidden"
                        style={{ background: "oklch(1 0 0 / 6%)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, drawdown * 5)}%`,
                            background: isAtRisk ? "oklch(0.65 0.22 25)" : "oklch(0.72 0.17 145)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
              {atRiskAccounts.length > 0 && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs mt-2"
                  style={{ background: "oklch(0.65 0.22 25 / 0.08)", color: "oklch(0.65 0.22 25)" }}
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {atRiskAccounts.length} account{atRiskAccounts.length > 1 ? "s" : ""} approaching drawdown limit
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weekly Discipline */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4" style={{ color: "oklch(0.72 0.17 145)" }} />
                7-Day Discipline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weekTrades.length === 0 ? (
                <p className="text-xs text-muted-foreground">No trades in the last 7 days.</p>
              ) : (
                <div>
                  <div className="flex items-end gap-1">
                    <span
                      className="text-3xl font-bold"
                      style={{
                        color: weekDiscipline >= 80
                          ? "oklch(0.72 0.17 145)"
                          : weekDiscipline >= 60
                          ? "oklch(0.72 0.22 45)"
                          : "oklch(0.65 0.22 25)",
                      }}
                    >
                      {weekDiscipline}
                    </span>
                    <span className="text-sm text-muted-foreground mb-1">/100</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Avg across {weekTrades.filter((t) => t.discipline).length} scored trades
                  </p>
                  <a
                    href="/analytics"
                    className="text-[10px] font-semibold flex items-center gap-1 mt-2 transition-opacity hover:opacity-80"
                    style={{ color: "oklch(0.72 0.22 45)" }}
                  >
                    View full analytics <ChevronRight className="w-3 h-3" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
