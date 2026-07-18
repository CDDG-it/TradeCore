"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay,
  startOfMonth, endOfMonth, isWithinInterval,
} from "date-fns";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import {
  getTrades, getAccounts, getHabits, getHabitCompletions, getProfile, getAnalyses, toggleHabitCompletion,
} from "@/lib/supabase/queries";
import { computeDiscipline, type DisciplineBreakdown } from "@/lib/discipline";
import { tradeR } from "@/lib/journal/weeks";
import { usePrivacy, mask } from "@/lib/use-privacy";
import { cn } from "@/lib/utils";
import type { TradeJournalEntry, FundedAccount, Habit, HabitCompletion, PreTradeAnalysis } from "@/lib/types";

const TURQUOISE = "oklch(0.70 0.13 183)";
const CYAN = "oklch(0.72 0.14 220)";
const GREEN = "oklch(0.58 0.17 145)";
const RED = "oklch(0.58 0.22 25)";
const AMBER = "oklch(0.70 0.16 72)";
const TODAY = format(new Date(), "yyyy-MM-dd");

function scoreColor(pct: number) {
  return pct >= 80 ? TURQUOISE : pct >= 60 ? AMBER : RED;
}

/** Alpha-blend a colour toward transparent — works for oklch() strings. `pct` 0–100. */
const alpha = (c: string, pct: number) => `color-mix(in oklch, ${c} ${pct}%, transparent)`;

const CARD_BASE =
  "relative rounded-2xl border border-border/60 bg-card p-4 overflow-hidden " +
  "shadow-[0_4px_20px_-10px_rgba(0,0,0,0.25)]";

function CardFx({ accent }: { accent: string }) {
  return (
    <>
      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(115% 85% at 0% 0%, ${alpha(accent, 9)}, transparent 55%)` }} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${alpha(accent, 55)}, transparent)` }} />
    </>
  );
}

export default function DashboardPage() {
  const { hidden, toggle } = usePrivacy();
  const [greeting, setGreeting] = useState("");
  const [firstName, setFirstName] = useState<string | null>(null);

  const [trades, setTrades] = useState<TradeJournalEntry[] | null>(null);
  const [accounts, setAccounts] = useState<FundedAccount[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [analyses, setAnalyses] = useState<PreTradeAnalysis[]>([]);
  const [pendingHabit, setPendingHabit] = useState<string | null>(null);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
    Promise.all([getTrades(), getAccounts(), getHabits(), getHabitCompletions(), getProfile(), getAnalyses()])
      .then(([t, a, hb, c, p, an]) => {
        setTrades(t); setAccounts(a); setHabits(hb); setCompletions(c); setAnalyses(an);
        if (p?.full_name) setFirstName(p.full_name.split(" ")[0]);
      });
  }, []);

  async function handleToggleHabit(habitId: string) {
    setPendingHabit(habitId);
    await toggleHabitCompletion(habitId, TODAY);
    setCompletions(await getHabitCompletions());
    setPendingHabit(null);
  }

  const now = new Date();

  const activeAccounts = accounts.filter((a) => a.status === "active");
  const activeCapital = activeAccounts.reduce((s, a) => s + a.current_balance, 0);

  const monthTrades = useMemo(() => {
    if (!trades) return [];
    return trades.filter((t) =>
      isWithinInterval(new Date(t.date_time.slice(0, 10) + "T12:00:00"), { start: startOfMonth(now), end: endOfMonth(now) })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trades]);

  const wins = monthTrades.filter((t) => t.result === "win").length;
  const losses = monthTrades.filter((t) => t.result === "loss").length;
  const be = monthTrades.length - wins - losses;
  const winRate = monthTrades.length ? Math.round((wins / monthTrades.length) * 100) : null;
  const monthR = monthTrades.reduce((s, t) => s + tradeR(t), 0);

  const mcMind = useMemo(() => {
    if (!trades) return null;
    return computeDiscipline(trades, habits, completions, startOfMonth(now), endOfMonth(now));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trades, habits, completions]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(now, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end: endOfWeek(now, { weekStartsOn: 1 }) }).map((d) => {
      const dayTrades = (trades ?? []).filter((t) => isSameDay(new Date(t.date_time.slice(0, 10) + "T12:00:00"), d));
      return { date: d, trades: dayTrades, r: dayTrades.reduce((s, t) => s + tradeR(t), 0) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trades]);

  const doneToday = new Set(completions.filter((c) => c.date === TODAY && c.completed).map((c) => c.habit_id));
  const loading = trades === null;

  return (
    <div className="flex flex-col gap-4" style={{ minHeight: "calc(100dvh - 8rem)" }}>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-wrap items-end justify-between gap-3"
      >
        <div>
          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1">
            {format(now, "EEEE, MMMM d")}
          </p>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-foreground tracking-tight leading-[0.95]">
            {greeting ? `${greeting}${firstName ? `, ${firstName}` : ""}` : "Dashboard"}
          </h1>
        </div>
        <Link href="/journal/new"
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-px"
          style={{ background: "#14B8A6", boxShadow: "0 2px 14px rgba(20,184,166,0.30)" }}>
          Log Trade
        </Link>
      </motion.div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-3 min-h-0">
          {/* Row 1 — hero widgets grow to fill the freed height */}
          <div className="grid gap-3 md:grid-cols-3 flex-1 min-h-0">
            <MindScoreOrb mind={mcMind} />
            <WinRateCard winRate={winRate} wins={wins} losses={losses} be={be} total={monthTrades.length} netR={monthR} />
            <AnalysisWidget analyses={analyses} />
          </div>

          {/* Row 2 — journal fills to the bottom, capital & habits beside it */}
          <div className="grid gap-3 lg:grid-cols-3 flex-1 min-h-0">
            <div className="lg:col-span-2 min-h-0">
              <WeekStrip days={weekDays} />
            </div>
            <div className="flex flex-col gap-3 min-h-0">
              <ActiveCapitalCard capital={activeCapital} count={activeAccounts.length} hidden={hidden} onToggle={toggle} />
              <HabitsCard habits={habits} doneToday={doneToday} pendingHabit={pendingHabit} onToggle={handleToggleHabit} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── MC mind score — a trader's discipline instrument ─────────────────────
   A 270° radial gauge for the blended score, backed by the two things a trader
   actually controls: rule adherence at the screen and habit consistency away
   from it. The needle-arc reads like a cockpit dial; the sub-meters break the
   score into its trade-driven and routine-driven halves. */
const GAUGE = { size: 150, stroke: 11, get r() { return (this.size - this.stroke) / 2 - 6; }, sweep: 270, start: 225 };

/** Point on the gauge circle for an angle measured clockwise from the top. */
function gaugePoint(angle: number) {
  const c = GAUGE.size / 2;
  const rad = ((angle - 90) * Math.PI) / 180;
  return [c + GAUGE.r * Math.cos(rad), c + GAUGE.r * Math.sin(rad)];
}

/** SVG arc path from the gauge start, spanning `fraction` (0..1) of the sweep. */
function gaugeArc(fraction: number) {
  const f = Math.max(0.0001, Math.min(1, fraction));
  const [sx, sy] = gaugePoint(GAUGE.start);
  const [ex, ey] = gaugePoint(GAUGE.start + GAUGE.sweep * f);
  const large = GAUGE.sweep * f > 180 ? 1 : 0;
  return `M ${sx} ${sy} A ${GAUGE.r} ${GAUGE.r} 0 ${large} 1 ${ex} ${ey}`;
}

function MindScoreOrb({ mind }: { mind: DisciplineBreakdown | null }) {
  const target = mind?.total ?? 0;
  const hasData = mind?.total != null;
  const [display, setDisplay] = useState(0);
  const [prog, setProg] = useState(0); // 0..1 animated arc fraction
  const raf = useRef(0);

  useEffect(() => {
    cancelAnimationFrame(raf.current);
    const start = performance.now();
    const dur = 1400;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(e * target));
      setProg((e * target) / 100);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);

  const color = hasData ? scoreColor(target) : "var(--muted-foreground)";
  const label = !hasData ? "No data yet" : target >= 80 ? "Locked in" : target >= 60 ? "Holding the line" : "Slipping";
  const [tipX, tipY] = gaugePoint(GAUGE.start + GAUGE.sweep * prog);

  return (
    <div className={cn(CARD_BASE, "flex flex-col")}>
      <CardFx accent={color} />
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">MC mind score</p>
        <span className="text-[10px] text-muted-foreground/70">this month</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-1">
        {/* Radial gauge */}
        <div className="relative shrink-0" style={{ width: GAUGE.size, height: GAUGE.size }}>
          <svg width={GAUGE.size} height={GAUGE.size} className="block">
            <defs>
              <linearGradient id="mc-gauge" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.65" />
                <stop offset="100%" stopColor={color} stopOpacity="1" />
              </linearGradient>
            </defs>
            {/* Track */}
            <path d={gaugeArc(1)} fill="none" stroke={alpha("var(--muted-foreground)", 16)} strokeWidth={GAUGE.stroke} strokeLinecap="round" />
            {/* Progress */}
            {hasData && (
              <path d={gaugeArc(prog)} fill="none" stroke="url(#mc-gauge)" strokeWidth={GAUGE.stroke} strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 5px ${alpha(color, 55)})` }} />
            )}
            {/* Leading tip */}
            {hasData && prog > 0.02 && <circle cx={tipX} cy={tipY} r={GAUGE.stroke / 2 + 1.5} fill={color} style={{ filter: `drop-shadow(0 0 6px ${alpha(color, 70)})` }} />}
          </svg>
          {/* Centre readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[34px] font-black tabular-nums leading-none" style={{ color }}>{hasData ? display : "—"}</p>
            {hasData && <p className="text-[10px] font-semibold tabular-nums text-muted-foreground/70 -mt-0.5">/ 100</p>}
            <p className="text-[11px] font-semibold mt-1" style={{ color }}>{label}</p>
          </div>
        </div>

        {/* Sub-meters — the two halves of the score */}
        <div className="w-full space-y-2">
          <SubMeter label="Rule adherence" value={mind?.tradeRules ?? null} weight="70%" accent={color}
            caption={mind && mind.tradeCount > 0 ? `${mind.tradeCount} scored trade${mind.tradeCount !== 1 ? "s" : ""}` : "No scored trades"} />
          <SubMeter label="Habit consistency" value={mind?.habits ?? null} weight="30%" accent={CYAN}
            caption={mind && mind.habitExpected > 0 ? `${mind.habitCompleted}/${mind.habitExpected} check-ins` : "No habits yet"} />
        </div>
      </div>
    </div>
  );
}

/** A thin labelled progress bar for one half of the mind score. */
function SubMeter({ label, value, weight, accent, caption }: {
  label: string; value: number | null; weight: string; accent: string; caption: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="text-[11px] font-medium text-foreground/80">{label}</span>
        <span className="text-[10px] text-muted-foreground/60">{weight}</span>
        <span className="ml-auto text-[11px] font-bold tabular-nums" style={{ color: value == null ? "var(--muted-foreground)" : accent }}>
          {value == null ? "—" : `${value}%`}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted-foreground/15 overflow-hidden">
        <div className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${value ?? 0}%`, background: accent, boxShadow: value ? `0 0 6px ${alpha(accent, 45)}` : "none" }} />
      </div>
      <p className="text-[9.5px] text-muted-foreground/60 mt-0.5">{caption}</p>
    </div>
  );
}

/* ── Win rate — the analytics widget: breakdown + net R + link ────────── */
function WinRateCard({ winRate, wins, losses, be, total, netR }: {
  winRate: number | null; wins: number; losses: number; be: number; total: number; netR: number;
}) {
  const seg = (n: number) => (total ? (n / total) * 100 : 0);
  const rColor = netR > 0 ? GREEN : netR < 0 ? RED : "var(--muted-foreground)";
  return (
    <div className={cn(CARD_BASE, "flex flex-col")}>
      <CardFx accent={CYAN} />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Win rate</p>

      <div className="flex items-baseline gap-1.5 mt-1.5">
        <span className="text-5xl font-black tabular-nums leading-none" style={{ color: CYAN }}>
          {winRate === null ? "—" : `${winRate}%`}
        </span>
        <span className="text-[11px] text-muted-foreground">this month</span>
      </div>

      <div className="mt-4 flex h-2 w-full overflow-hidden rounded-full bg-border/60">
        <div className="h-full" style={{ width: `${seg(wins)}%`, background: GREEN }} />
        <div className="h-full" style={{ width: `${seg(be)}%`, background: AMBER }} />
        <div className="h-full" style={{ width: `${seg(losses)}%`, background: RED }} />
      </div>
      <div className="mt-2 flex items-center gap-3 text-[11px] tabular-nums font-semibold">
        <span style={{ color: GREEN }}>{wins}W</span>
        <span style={{ color: RED }}>{losses}L</span>
        <span style={{ color: AMBER }}>{be}BE</span>
        <span className="text-muted-foreground/70 ml-auto font-normal">{total} trades</span>
      </div>

      {/* Net R — secondary stat that fills the taller card */}
      <div className="mt-4 flex items-center justify-between rounded-xl border border-border/60 bg-muted/25 px-3 py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Net R · month</span>
        <span className="text-lg font-black tabular-nums leading-none" style={{ color: rColor }}>
          {netR > 0 ? "+" : ""}{netR.toFixed(1)}R
        </span>
      </div>

      <Link href="/analytics" className="mt-auto pt-3 text-[11px] font-semibold text-primary hover:underline">
        View full analytics →
      </Link>
    </div>
  );
}

/* ── Analysis — recent pre-trade prep + add ───────────────────────────── */
const BIAS_COLOR: Record<string, string> = { bullish: GREEN, bearish: RED, choppy: AMBER };

function AnalysisWidget({ analyses }: { analyses: PreTradeAnalysis[] }) {
  const recent = useMemo(
    () => [...analyses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4),
    [analyses]
  );
  return (
    <div className={cn(CARD_BASE, "flex flex-col")}>
      <CardFx accent={CYAN} />
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Analysis</p>
        <Link href="/analysis" className="text-[11px] font-semibold text-primary hover:underline">All →</Link>
      </div>

      {recent.length === 0 ? (
        <div className="flex-1 flex items-center py-3">
          <p className="text-xs text-muted-foreground">No pre-trade analysis yet — plan your next setup.</p>
        </div>
      ) : (
        <div className="mt-2 space-y-1 flex-1">
          {recent.map((a) => {
            const c = BIAS_COLOR[a.bias] ?? "var(--muted-foreground)";
            return (
              <Link key={a.id} href={`/analysis/${a.id}`}
                className="flex items-center gap-2.5 rounded-lg px-2 py-2 -mx-1 transition-colors hover:bg-muted/50">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: c }} />
                <span className="text-[13px] font-bold font-mono shrink-0">{a.instrument}</span>
                <span className="text-xs font-medium capitalize shrink-0" style={{ color: c }}>{a.bias}</span>
                <span className="text-[11px] text-muted-foreground/70 ml-auto tabular-nums shrink-0">
                  {format(new Date(a.date + "T12:00:00"), "MMM d")}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      <Link href="/analysis/new"
        className="mt-auto pt-2.5 inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold text-white transition-all hover:-translate-y-px"
        style={{ background: "#14B8A6", boxShadow: "0 2px 12px rgba(20,184,166,0.26)" }}>
        Add analysis →
      </Link>
    </div>
  );
}

/* ── Active capital — compact + link to Accounts ──────────────────────── */
function ActiveCapitalCard({ capital, count, hidden, onToggle }: {
  capital: number; count: number; hidden: boolean; onToggle: () => void;
}) {
  return (
    <div className={cn(CARD_BASE, "flex flex-col justify-center py-3 shrink-0")}>
      <CardFx accent={TURQUOISE} />
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active capital</p>
        <button type="button" onClick={onToggle} aria-pressed={hidden}
          className="text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
          {hidden ? "Show" : "Hide"}
        </button>
      </div>
      <p className="text-xl font-black tabular-nums leading-none mt-1.5" style={{ color: TURQUOISE }}>
        {capital > 0 ? mask(`$${capital.toLocaleString()}`, hidden) : "—"}
      </p>
      <div className="mt-1.5 flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">{count} active account{count !== 1 ? "s" : ""}</p>
        <Link href="/accounts" className="text-[11px] font-semibold text-primary hover:underline">View →</Link>
      </div>
    </div>
  );
}

/* ── Habits — check off today, and jump to the full page ──────────────── */
function HabitsCard({ habits, doneToday, pendingHabit, onToggle }: {
  habits: Habit[]; doneToday: Set<string>; pendingHabit: string | null; onToggle: (id: string) => void;
}) {
  return (
    <div className={cn(CARD_BASE, "flex flex-col flex-1 min-h-0")}>
      <CardFx accent={TURQUOISE} />
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold">Today&apos;s habits</p>
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-semibold tabular-nums text-primary">{doneToday.size}/{habits.length}</span>
          <Link href="/habits" className="text-[11px] font-semibold text-primary hover:underline">Open →</Link>
        </div>
      </div>
      {habits.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-2">
          <p className="text-xs text-muted-foreground mb-1.5">No habits yet.</p>
          <Link href="/habits" className="text-xs font-semibold text-primary hover:underline">Add habits</Link>
        </div>
      ) : (
        <div className="space-y-0.5 flex-1 overflow-y-auto pr-0.5 min-h-0">
          {habits.map((habit) => {
            const done = doneToday.has(habit.id);
            return (
              <button key={habit.id} type="button" onClick={() => onToggle(habit.id)} disabled={pendingHabit === habit.id}
                className={cn("w-full flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors disabled:opacity-60",
                  done ? "bg-success/8" : "hover:bg-muted/50")}>
                <span className="h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors"
                  style={done ? { background: habit.color, borderColor: habit.color } : { borderColor: "var(--border)" }}>
                  {done && (
                    <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </span>
                <span className={cn("text-[13px] truncate flex-1", done ? "text-foreground" : "text-muted-foreground")}>{habit.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Journal — this week (compact) ────────────────────────────────────── */
function WeekStrip({ days }: { days: { date: Date; trades: TradeJournalEntry[]; r: number }[] }) {
  return (
    <div className={cn(CARD_BASE, "h-full flex flex-col")}>
      <CardFx accent={TURQUOISE} />
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">This week</p>
          <span className="text-[11px] text-muted-foreground/70 tabular-nums">
            {format(days[0].date, "MMM d")} – {format(days[6].date, "MMM d")}
          </span>
        </div>
        <Link href="/journal" className="text-[11px] font-semibold text-primary hover:underline">Open journal →</Link>
      </div>

      <div className="grid grid-cols-7 gap-2 flex-1 min-h-0">
        {days.map(({ date, trades: dt, r }) => {
          const has = dt.length > 0;
          const color = r > 0 ? GREEN : r < 0 ? RED : AMBER;
          const today = isToday(date);
          return (
            <Link key={date.toISOString()} href="/journal"
              className={cn("group flex flex-col items-center rounded-xl border px-1 py-3 transition-all hover:-translate-y-0.5",
                today ? "border-primary/50" : "border-border/60 hover:border-border")}
              style={has ? { background: alpha(color, 9) } : undefined}>
              <span className={cn("text-[10px] font-semibold uppercase tracking-wide", today ? "text-primary" : "text-muted-foreground/60")}>{format(date, "EEE")}</span>
              <span className={cn("text-lg font-bold tabular-nums mt-0.5", today ? "text-primary" : "text-foreground/85")}>{format(date, "d")}</span>
              {has ? (
                <span className="mt-2 text-[12px] font-bold tabular-nums" style={{ color }}>{r > 0 ? "+" : ""}{r.toFixed(1)}R</span>
              ) : (
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-border" />
              )}
              <span className="mt-auto text-[10px] text-muted-foreground/50">
                {has ? `${dt.length} trade${dt.length !== 1 ? "s" : ""}` : ""}
              </span>
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
  );
}
