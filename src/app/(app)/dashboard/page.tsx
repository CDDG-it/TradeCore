"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { format, startOfWeek, startOfMonth } from "date-fns";
import { motion } from "motion/react";
import {
  TrendingUp,
  TrendingDown,
  BookOpen,
  Activity,
  Wallet,
  ArrowRight,
  Flame,
  Plus,
  Check,
  Pencil,
  Trash2,
  X,
  Target,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageWrapper } from "@/components/ui/page-wrapper";
import {
  getTrades,
  getAccounts,
  getHabits,
  getHabitCompletions,
  createHabit,
  updateHabit,
  deleteHabit,
  toggleHabitCompletion,
  getProfile,
} from "@/lib/supabase/queries";
import { subDays } from "date-fns";
import { usePrivacy, mask } from "@/lib/use-privacy";
import { cn } from "@/lib/utils";
import type { TradeResult, Habit, HabitCompletion } from "@/lib/types";

const TODAY = format(new Date(), "yyyy-MM-dd");

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

function DisciplineScoreCard() {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [trades, setTrades] = useState<import("@/lib/types").TradeJournalEntry[]>([]);

  useEffect(() => {
    getTrades().then(setTrades);
  }, []);

  const now = new Date();
  const cutoff =
    period === "week"
      ? startOfWeek(now, { weekStartsOn: 1 })
      : startOfMonth(now);

  const periodTrades = trades.filter(
    (t) => t.discipline && new Date(t.date_time) >= cutoff
  );

  const avg =
    periodTrades.length > 0
      ? Math.round(
          periodTrades.reduce((s, t) => s + (t.discipline?.score ?? 0), 0) /
            periodTrades.length
        )
      : null;

  const color =
    avg === null
      ? "oklch(0.55 0.005 28)"
      : avg >= 80
      ? "oklch(0.58 0.17 145)"
      : avg >= 60
      ? "oklch(0.70 0.16 72)"
      : "oklch(0.58 0.22 25)";

  return (
    <div
      className="card-hover rounded-xl p-5 relative overflow-hidden"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${color.replace(")", " / 0.40)")}, transparent)`,
        }}
      />
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Discipline Score
        </p>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${color.replace(")", " / 0.12)")}` }}
        >
          <Target className="w-3.5 h-3.5" style={{ color }} />
        </div>
      </div>
      <p
        className="text-3xl font-black tracking-tight mb-1 tabular-nums"
        style={{ color }}
      >
        {avg !== null ? `${avg}%` : "—"}
      </p>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1">
          {(["week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide transition-all"
              style={
                period === p
                  ? { background: color.replace(")", " / 0.15)"), color }
                  : { color: "var(--muted-foreground)" }
              }
            >
              {p === "week" ? "This week" : "This month"}
            </button>
          ))}
        </div>
        <Link
          href="/analytics"
          className="text-[11px] font-medium flex items-center gap-0.5 transition-opacity hover:opacity-80"
          style={{ color: "var(--muted-foreground)" }}
          onClick={(e) => e.stopPropagation()}
        >
          Analytics <ArrowRight className="w-2.5 h-2.5" />
        </Link>
      </div>
    </div>
  );
}

function HabitTracker({ onToggle }: { onToggle?: (habits: Habit[], toggle: (id: string) => void) => void }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [showOverview, setShowOverview] = useState(false);

  const refreshHabits = async () => {
    const [h, c] = await Promise.all([getHabits(), getHabitCompletions()]);
    setHabits(h);
    setCompletions(c);
  };

  useEffect(() => { refreshHabits(); }, []);

  const todayDone = completions
    .filter((c) => c.date === TODAY && c.completed)
    .map((c) => c.habit_id);

  async function toggleHabit(habitId: string, date: string = TODAY) {
    await toggleHabitCompletion(habitId, date);
    const c = await getHabitCompletions();
    setCompletions(c);
  }

  // Expose toggle capability to parent for keyboard shortcuts
  useEffect(() => {
    onToggle?.(habits, toggleHabit);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits, todayDone.join(",")]);

  async function handleAddHabit(e: React.FormEvent) {
    e.preventDefault();
    const name = newHabitName.trim();
    if (!name) return;
    await createHabit({ name, description: "", category: "routine", frequency: "daily", target_days: 7, color: "#F97316", icon: "" });
    await refreshHabits();
    setNewHabitName("");
    setShowAdd(false);
  }

  async function handleSaveEdit(id: string) {
    const name = editName.trim();
    if (!name) return;
    await updateHabit(id, { name });
    const h = await getHabits();
    setHabits(h);
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    await deleteHabit(id);
    await refreshHabits();
  }

  const doneCount = todayDone.length;
  const totalCount = habits.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Build last-7-days overview data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return format(d, "yyyy-MM-dd");
  });

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Flame className="w-4 h-4" style={{ color: "#F97316" }} />
            Habits — {format(new Date(), "EEEE, MMMM d")}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs tabular-nums">
              {doneCount}/{totalCount}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              className={cn("gap-1.5 text-xs h-7 px-2", showOverview && "bg-primary/10 border-primary/30 text-primary")}
              onClick={() => setShowOverview(!showOverview)}
            >
              Overview
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs h-7 px-2"
              onClick={() => { setShowAdd(!showAdd); setEditingId(null); }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </Button>
          </div>
        </div>
        {totalCount > 0 && (
          <div className="mt-3">
            <div className="h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: pct === 100 ? "oklch(0.68 0.20 130)" : "#F97316" }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">{pct}% complete today</p>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-1.5">
        {/* 7-day overview grid */}
        {showOverview && habits.length > 0 && (
          <div className="mb-4 pb-4 border-b border-border/50">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left font-medium text-muted-foreground pr-3 pb-2 min-w-[120px]">Habit</th>
                    {last7Days.map((d) => (
                      <th key={d} className="text-center pb-2 min-w-[32px]">
                        <span className={cn(
                          "text-[11px] font-medium",
                          d === TODAY ? "text-primary" : "text-muted-foreground/75"
                        )}>
                          {format(new Date(d + "T12:00:00"), "EEE")[0]}
                        </span>
                        <br />
                        <span className={cn(
                          "text-[11px]",
                          d === TODAY ? "text-primary font-semibold" : "text-muted-foreground/60"
                        )}>
                          {format(new Date(d + "T12:00:00"), "d")}
                        </span>
                      </th>
                    ))}
                    <th className="text-center pb-2 pl-2 min-w-[40px]">
                      <span className="text-[11px] font-medium text-muted-foreground/75">7d %</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {habits.map((habit) => {
                    const weekDone = last7Days.filter((d) =>
                      completions.some((c) => c.habit_id === habit.id && c.date === d && c.completed)
                    ).length;
                    const weekPct = Math.round((weekDone / 7) * 100);
                    return (
                      <tr key={habit.id} className="border-t border-border/30">
                        <td className="py-1.5 pr-3 font-medium text-foreground/80 truncate max-w-[120px]">
                          {habit.name}
                        </td>
                        {last7Days.map((d) => {
                          const done = completions.some(
                            (c) => c.habit_id === habit.id && c.date === d && c.completed
                          );
                          return (
                            <td key={d} className="text-center py-1.5">
                              <button
                                onClick={() => toggleHabit(habit.id, d)}
                                title={format(new Date(d + "T12:00:00"), "EEE MMM d")}
                                className="inline-block w-5 h-5 rounded-md transition-all hover:scale-110 hover:opacity-90"
                                style={{
                                  background: done ? "#F97316" : "var(--muted)",
                                  opacity: done ? 1 : 0.4,
                                }}
                              />
                            </td>
                          );
                        })}
                        <td className="text-center py-1.5 pl-2">
                          <span className={cn("font-semibold tabular-nums",
                            weekPct === 100 ? "text-success" : weekPct >= 60 ? "text-primary" : "text-muted-foreground"
                          )}>
                            {weekPct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {showAdd && (
          <form onSubmit={handleAddHabit} className="flex gap-2 mb-3 pb-3 border-b border-border/50">
            <Input autoFocus value={newHabitName} onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="Habit name..." className="h-8 text-sm" />
            <Button type="submit" size="sm" className="h-8 shrink-0">Save</Button>
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={() => setShowAdd(false)}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </form>
        )}
        {habits.length === 0 ? (
          <div className="py-8 text-center">
            <Flame className="w-8 h-8 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No habits yet.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Click "Add" to create your first habit.</p>
          </div>
        ) : (
          habits.map((habit, idx) => {
            const done = todayDone.includes(habit.id);
            const isEditing = editingId === habit.id;
            const keyHint = idx < 9 ? String(idx + 1) : null;
            return (
              <div
                key={habit.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                  done ? "bg-primary/5 border border-primary/15" : "hover:bg-muted/50"
                )}
              >
                {keyHint && (
                  <span className="w-4 text-[11px] font-mono text-muted-foreground/50 shrink-0 text-center select-none hidden sm:block">
                    {keyHint}
                  </span>
                )}
                <button
                  onClick={() => toggleHabit(habit.id)}
                  className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center border-2 transition-all"
                  style={{
                    borderColor: done ? "#F97316" : "var(--border)",
                    background: done ? "#F97316" : "transparent",
                  }}
                >
                  {done && <Check className="w-3 h-3 text-white" />}
                </button>
                {isEditing ? (
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleSaveEdit(habit.id); }}
                    className="flex-1 flex gap-2"
                  >
                    <Input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)}
                      className="h-7 text-sm py-0" />
                    <Button type="submit" size="sm" className="h-7 text-xs px-2">Save</Button>
                    <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingId(null)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </form>
                ) : (
                  <>
                    <span className={cn("flex-1 text-sm font-medium transition-colors", done ? "text-foreground/50 line-through" : "text-foreground")}>
                      {habit.name}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingId(habit.id); setEditName(habit.name); }}
                        className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleDelete(habit.id)}
                        className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { hidden, toggle } = usePrivacy();
  const [trades, setTrades] = useState<import("@/lib/types").TradeJournalEntry[]>([]);
  const [accounts, setAccounts] = useState<import("@/lib/types").FundedAccount[]>([]);
  const [greeting, setGreeting] = useState("");
  const [firstName, setFirstName] = useState<string | null>(null);
  const habitStateRef = useRef<{ habits: Habit[]; toggle: (id: string) => void } | null>(null);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
    getTrades().then(setTrades);
    getAccounts().then(setAccounts);
    getProfile().then((p) => {
      if (p?.full_name) setFirstName(p.full_name.split(" ")[0]);
    });
  }, []);
  const disciplineRef = useRef<HTMLDivElement>(null);
  const habitsRef = useRef<HTMLDivElement>(null);

  const handleHabitState = useCallback((habits: Habit[], toggle: (id: string) => void) => {
    habitStateRef.current = { habits, toggle };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      // 1-9: toggle nth habit
      if (e.key >= "1" && e.key <= "9") {
        const idx = parseInt(e.key) - 1;
        const state = habitStateRef.current;
        if (state && state.habits[idx]) {
          state.toggle(state.habits[idx].id);
        }
        return;
      }

      // H: scroll to habits
      if (e.key === "h" || e.key === "H") {
        habitsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        habitsRef.current?.classList.add("ring-2", "ring-primary/40");
        setTimeout(() => habitsRef.current?.classList.remove("ring-2", "ring-primary/40"), 1200);
        return;
      }

      // D: scroll to discipline
      if (e.key === "d" || e.key === "D") {
        disciplineRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        disciplineRef.current?.classList.add("ring-2", "ring-primary/40");
        setTimeout(() => disciplineRef.current?.classList.remove("ring-2", "ring-primary/40"), 1200);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const totalTrades = trades.length;
  const winRate =
    totalTrades > 0
      ? Math.round((trades.filter((t) => t.result === "win").length / totalTrades) * 100)
      : 0;

  const activeAccounts = accounts.filter((a) => a.status === "active");
  const totalCapital = activeAccounts.reduce((s, a) => s + a.current_balance, 0);

  const recentTrades = trades.slice(0, 5);

  const statCards = [
    {
      id: "trades",
      label: "Total Trades",
      value: totalTrades.toString(),
      sub: `${winRate}% win rate`,
      icon: Activity,
      accent: "oklch(0.72 0.22 45)",
      accentBg: "oklch(0.72 0.22 45 / 0.10)",
      href: undefined as string | undefined,
    },
    {
      id: "capital",
      label: "Active Capital",
      value: totalCapital > 0 ? mask(`$${totalCapital.toLocaleString()}`, hidden) : "—",
      sub: `${activeAccounts.length} active account${activeAccounts.length !== 1 ? "s" : ""}`,
      icon: Wallet,
      accent: "oklch(0.58 0.17 145)",
      accentBg: "oklch(0.58 0.17 145 / 0.10)",
      href: "/accounts" as string | undefined,
    },
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-start justify-between gap-4 mb-8"
      >
        <div>
          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">
            Daily
          </p>
          <h1 className="font-heading font-black text-3xl md:text-4xl text-foreground tracking-tight leading-[0.95]">
            Dashboard
          </h1>
          {greeting && (
            <p className="font-body text-lg font-semibold text-foreground mt-3">
              {greeting}{firstName ? `, ${firstName}` : ""}
            </p>
          )}
          <p className="font-body text-sm font-light text-muted-foreground mt-1 leading-relaxed">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
      </motion.div>
      <PageWrapper>
        {/* Stats + Discipline */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-up">
          {statCards.map(({ id, label, value, sub, icon: Icon, accent, accentBg, href }, i) => {
            const inner = (
              <>
                <div
                  className="absolute inset-x-0 top-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${accent.replace(")", " / 0.40)")}, transparent)` }}
                />
                <div className="flex items-start justify-between mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {id === "capital" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggle();
                        }}
                        title={hidden ? "Show balance" : "Hide balance (privacy mode)"}
                        aria-pressed={hidden}
                        className="relative z-10 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                      >
                        {hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: accentBg }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
                    </div>
                  </div>
                </div>
                <p className="text-3xl font-black tracking-tight mb-1 tabular-nums" style={{ color: accent }}>{value}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{sub}</p>
                  {href && (
                    <span className="text-[11px] font-medium flex items-center gap-0.5" style={{ color: "var(--muted-foreground)" }}>
                      Manage <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
              </>
            );
            return href ? (
              <Link
                key={label}
                href={href}
                className="card-hover rounded-xl p-5 relative overflow-hidden cursor-pointer"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  animationDelay: `${i * 60}ms`,
                }}
              >
                {inner}
              </Link>
            ) : (
              <div
                key={label}
                className="card-hover rounded-xl p-5 relative overflow-hidden"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  animationDelay: `${i * 60}ms`,
                }}
              >
                {inner}
              </div>
            );
          })}
          <div className="animate-fade-up" style={{ animationDelay: "120ms" }} ref={disciplineRef}>
            <DisciplineScoreCard />
          </div>
        </div>

        {/* Habit Tracker + Recent Trades */}
        <div className="grid lg:grid-cols-2 gap-6 animate-fade-up" style={{ animationDelay: "180ms" }}>
          <div ref={habitsRef} className="rounded-xl transition-all duration-300">
            <HabitTracker onToggle={handleHabitState} />
          </div>

          {/* Recent Trades */}
          <div
            className="card-hover rounded-xl overflow-hidden"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4" style={{ color: "#F97316" }} />
                Recent Trades
              </h2>
              <Link
                href="/journal"
                className="text-xs flex items-center gap-1 transition-colors hover:opacity-80"
                style={{ color: "oklch(0.72 0.22 45)" }}
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {recentTrades.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-muted-foreground mb-3">No trades logged yet.</p>
                <Link href="/journal/new"
                  className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
                  style={{ color: "oklch(0.72 0.22 45)" }}>
                  <Plus className="w-3.5 h-3.5" /> Log your first trade
                </Link>
              </div>
            ) : (
              <div>
                {recentTrades.map((trade, i) => (
                  <Link
                    key={trade.id}
                    href={`/journal/${trade.id}`}
                    className="group flex items-center gap-4 px-5 py-3.5 transition-all border-l-2 border-transparent hover:border-primary/40 hover:bg-muted/30 cursor-pointer"
                    style={{ borderBottom: i < recentTrades.length - 1 ? "1px solid var(--border)" : undefined }}
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
                      <p className="text-sm font-semibold group-hover:text-primary transition-colors">{trade.instrument}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {format(new Date(trade.date_time.slice(0, 10) + "T12:00:00"), "MMM d")}
                        {trade.timeframe ? ` · ${trade.timeframe}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-3">
                      <div>
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
                          {trade.result === "win"
                            ? `+${trade.rr}R`
                            : trade.result === "loss"
                            ? "-1R"
                            : "0R"}
                        </p>
                        {trade.discipline && trade.discipline.score > 0 && (
                          <p className="text-[11px] text-muted-foreground">{trade.discipline.score}% disc.</p>
                        )}
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary/60 transition-all group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </PageWrapper>
    </div>
  );
}
