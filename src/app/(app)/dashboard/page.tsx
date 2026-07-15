"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay,
  startOfMonth, endOfMonth, isWithinInterval,
} from "date-fns";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { PageWrapper } from "@/components/ui/page-wrapper";
import {
  getTrades, getAccounts, getHabits, getHabitCompletions, getProfile, toggleHabitCompletion,
} from "@/lib/supabase/queries";
import { computeDiscipline } from "@/lib/discipline";
import { tradeR } from "@/lib/journal/weeks";
import { usePrivacy, mask } from "@/lib/use-privacy";
import { cn } from "@/lib/utils";
import type { TradeJournalEntry, FundedAccount, Habit, HabitCompletion } from "@/lib/types";

const TURQUOISE = "oklch(0.70 0.12 183)";
const CYAN = "oklch(0.72 0.14 220)";
const GREEN = "oklch(0.58 0.17 145)";
const RED = "oklch(0.58 0.22 25)";
const AMBER = "oklch(0.70 0.16 72)";
const TODAY = format(new Date(), "yyyy-MM-dd");

function scoreColor(pct: number) {
  return pct >= 80 ? GREEN : pct >= 60 ? AMBER : RED;
}

export default function DashboardPage() {
  const { hidden, toggle } = usePrivacy();
  const [greeting, setGreeting] = useState("");
  const [firstName, setFirstName] = useState<string | null>(null);

  const [trades, setTrades] = useState<TradeJournalEntry[] | null>(null);
  const [accounts, setAccounts] = useState<FundedAccount[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [pendingHabit, setPendingHabit] = useState<string | null>(null);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
    Promise.all([getTrades(), getAccounts(), getHabits(), getHabitCompletions(), getProfile()])
      .then(([t, a, hb, c, p]) => {
        setTrades(t);
        setAccounts(a);
        setHabits(hb);
        setCompletions(c);
        if (p?.full_name) setFirstName(p.full_name.split(" ")[0]);
      });
  }, []);

  async function handleToggleHabit(habitId: string) {
    setPendingHabit(habitId);
    await toggleHabitCompletion(habitId, TODAY);
    setCompletions(await getHabitCompletions());
    setPendingHabit(null);
  }

  // ── Derived metrics ────────────────────────────────────────────────
  const now = new Date();

  const activeCapital = useMemo(
    () => accounts.filter((a) => a.status === "active").reduce((s, a) => s + a.current_balance, 0),
    [accounts]
  );
  const activeCount = accounts.filter((a) => a.status === "active").length;

  const monthTrades = useMemo(() => {
    if (!trades) return [];
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    return trades.filter((t) =>
      isWithinInterval(new Date(t.date_time.slice(0, 10) + "T12:00:00"), { start, end })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trades]);

  const wins = monthTrades.filter((t) => t.result === "win").length;
  const winRate = monthTrades.length ? Math.round((wins / monthTrades.length) * 100) : null;

  const rated = monthTrades.filter((t) => t.execution_quality === "good" || t.execution_quality === "bad");
  const goodExec = rated.filter((t) => t.execution_quality === "good").length;
  const execRate = rated.length ? Math.round((goodExec / rated.length) * 100) : null;

  // MC mind score — blends trading rules (70%) with habit consistency (30%),
  // over the current month.
  const mcMindScore = useMemo(() => {
    if (!trades) return null;
    return computeDiscipline(trades, habits, completions, startOfMonth(now), endOfMonth(now)).total;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trades, habits, completions]);

  // Week strip (Mon–Sun of the current week)
  const weekDays = useMemo(() => {
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end }).map((d) => {
      const dayTrades = (trades ?? []).filter((t) => isSameDay(new Date(t.date_time.slice(0, 10) + "T12:00:00"), d));
      const r = dayTrades.reduce((s, t) => s + tradeR(t), 0);
      return { date: d, trades: dayTrades, r };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trades]);

  const doneToday = new Set(completions.filter((c) => c.date === TODAY && c.completed).map((c) => c.habit_id));

  const loading = trades === null;

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-wrap items-end justify-between gap-3"
      >
        <div>
          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
            {format(now, "EEEE, MMMM d")}
          </p>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-foreground tracking-tight leading-[0.95]">
            {greeting ? `${greeting}${firstName ? `, ${firstName}` : ""}` : "Dashboard"}
          </h1>
        </div>
        <Link
          href="/journal/new"
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-px"
          style={{ background: "#14B8A6", boxShadow: "0 2px 14px rgba(20,184,166,0.30)" }}
        >
          Log Trade
        </Link>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <PageWrapper className="space-y-4">
          {/* Row 1 — four glanceable stat tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Active capital */}
            <StatCard accent={TURQUOISE} label="Active capital">
              <div className="flex items-center justify-between gap-2">
                <p className="text-2xl md:text-[26px] font-black tabular-nums leading-none" style={{ color: TURQUOISE }}>
                  {activeCapital > 0 ? mask(`$${activeCapital.toLocaleString()}`, hidden) : "—"}
                </p>
                <button
                  type="button"
                  onClick={toggle}
                  aria-pressed={hidden}
                  className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  {hidden ? "Show" : "Hide"}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                {activeCount} active account{activeCount !== 1 ? "s" : ""}
              </p>
            </StatCard>

            {/* Win rate — this month */}
            <StatCard accent={CYAN} label="Win rate" href="/analytics">
              <p className="text-2xl md:text-[26px] font-black tabular-nums leading-none" style={{ color: CYAN }}>
                {winRate === null ? "—" : `${winRate}%`}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                {monthTrades.length ? `${wins}W of ${monthTrades.length} · this month` : "no trades this month"}
              </p>
            </StatCard>

            {/* Execution rate — this month */}
            <StatCard accent={execRate === null ? "var(--muted-foreground)" : scoreColor(execRate)} label="Execution" href="/analytics">
              <p className="text-2xl md:text-[26px] font-black tabular-nums leading-none"
                style={{ color: execRate === null ? "var(--muted-foreground)" : scoreColor(execRate) }}>
                {execRate === null ? "—" : `${execRate}%`}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                {rated.length ? `${goodExec} of ${rated.length} clean · this month` : "no rated trades"}
              </p>
            </StatCard>

            {/* MC mind score — this month */}
            <StatCard accent={mcMindScore === null ? "var(--muted-foreground)" : scoreColor(mcMindScore)} label="MC mind score" href="/discipline">
              <p className="text-2xl md:text-[26px] font-black tabular-nums leading-none"
                style={{ color: mcMindScore === null ? "var(--muted-foreground)" : scoreColor(mcMindScore) }}>
                {mcMindScore === null ? "—" : `${mcMindScore}%`}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1.5">rules + habits · this month</p>
            </StatCard>
          </div>

          {/* Row 2 — week journal + today's habits */}
          <div className="grid lg:grid-cols-3 gap-3">
            {/* Week journal calendar */}
            <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">This week</p>
                  <span className="text-[11px] text-muted-foreground/70 tabular-nums">
                    {format(weekDays[0].date, "MMM d")} – {format(weekDays[6].date, "MMM d")}
                  </span>
                </div>
                <Link href="/journal" className="text-[11px] font-semibold text-primary hover:underline">
                  Open journal
                </Link>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {weekDays.map(({ date, trades: dt, r }) => {
                  const has = dt.length > 0;
                  const color = r > 0 ? GREEN : r < 0 ? RED : AMBER;
                  const today = isToday(date);
                  return (
                    <Link
                      key={date.toISOString()}
                      href="/journal"
                      className={cn(
                        "group flex flex-col items-center rounded-xl border px-1 py-2.5 transition-all hover:-translate-y-0.5",
                        today ? "border-primary/50" : "border-border/60 hover:border-border"
                      )}
                      style={has ? { background: `${color}14` } : undefined}
                    >
                      <span className={cn("text-[10px] font-semibold uppercase tracking-wide", today ? "text-primary" : "text-muted-foreground/60")}>
                        {format(date, "EEE")}
                      </span>
                      <span className={cn("text-base font-bold tabular-nums mt-0.5", today ? "text-primary" : "text-foreground/85")}>
                        {format(date, "d")}
                      </span>
                      {has ? (
                        <span className="mt-1.5 text-[11px] font-bold tabular-nums" style={{ color }}>
                          {r > 0 ? "+" : ""}{r.toFixed(1)}R
                        </span>
                      ) : (
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-border" />
                      )}
                      {has && (
                        <span className="text-[9px] text-muted-foreground/60 mt-0.5">
                          {dt.length} trade{dt.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-4 text-[10px] text-muted-foreground/70">
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: GREEN }} /> Win</span>
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: RED }} /> Loss</span>
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: AMBER }} /> B/E</span>
              </div>
            </div>

            {/* Today's habits */}
            <div className="rounded-2xl border border-border bg-card p-4 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">Today&apos;s habits</p>
                <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
                  {doneToday.size}/{habits.length}
                </span>
              </div>

              {habits.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                  <p className="text-xs text-muted-foreground mb-2">No habits yet.</p>
                  <Link href="/habits" className="text-xs font-semibold text-primary hover:underline">Add habits</Link>
                </div>
              ) : (
                <div className="space-y-1 flex-1 overflow-y-auto max-h-56 pr-0.5">
                  {habits.map((habit) => {
                    const done = doneToday.has(habit.id);
                    return (
                      <button
                        key={habit.id}
                        type="button"
                        onClick={() => handleToggleHabit(habit.id)}
                        disabled={pendingHabit === habit.id}
                        className={cn(
                          "w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors disabled:opacity-60",
                          done ? "bg-success/8" : "hover:bg-muted/50"
                        )}
                      >
                        <span
                          className="h-4 w-4 shrink-0 rounded-full border-2 transition-colors"
                          style={done
                            ? { background: habit.color, borderColor: habit.color }
                            : { borderColor: "var(--border)" }}
                        />
                        <span className={cn("text-sm truncate flex-1", done ? "text-foreground" : "text-muted-foreground")}>
                          {habit.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {habits.length > 0 && (
                <Link href="/habits" className="mt-3 pt-3 border-t border-border/40 text-[11px] font-semibold text-primary hover:underline">
                  Manage habits
                </Link>
              )}
            </div>
          </div>
        </PageWrapper>
      )}
    </div>
  );
}

function StatCard({
  accent, label, href, children,
}: {
  accent: string;
  label: string;
  href?: string;
  children: React.ReactNode;
}) {
  const inner = (
    <div className="relative rounded-2xl border border-border bg-card p-4 h-full overflow-hidden transition-all hover:border-border/80">
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}66, transparent)` }} />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">{label}</p>
      {children}
    </div>
  );
  return href ? <Link href={href} className="block hover:-translate-y-0.5 transition-transform">{inner}</Link> : inner;
}
