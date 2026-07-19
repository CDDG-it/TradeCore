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
  getPsychEdgeSessions, getBestTradesOfDay, getWeeklyTradeReviews,
} from "@/lib/supabase/queries";
import { computeMindScore, type MindScore } from "@/lib/mind-score/mind-score";
import { tradeR } from "@/lib/journal/weeks";
import { usePrivacy, mask } from "@/lib/use-privacy";
import { cn } from "@/lib/utils";
import type { TradeJournalEntry, FundedAccount, Habit, HabitCompletion, PreTradeAnalysis, PsychEdgeSession, BestTradeOfDay, WeeklyTradeReview } from "@/lib/types";

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
  const [psychSessions, setPsychSessions] = useState<PsychEdgeSession[]>([]);
  const [bestTrades, setBestTrades] = useState<BestTradeOfDay[]>([]);
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyTradeReview[]>([]);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
    Promise.all([getTrades(), getAccounts(), getHabits(), getHabitCompletions(), getProfile(), getAnalyses()])
      .then(([t, a, hb, c, p, an]) => {
        setTrades(t); setAccounts(a); setHabits(hb); setCompletions(c); setAnalyses(an);
        if (p?.full_name) setFirstName(p.full_name.split(" ")[0]);
      });
    // Progression data (quests + level) loads independently so it never blocks the hero widgets.
    Promise.all([getPsychEdgeSessions(), getBestTradesOfDay(), getWeeklyTradeReviews()])
      .then(([ps, bt, wr]) => { setPsychSessions(ps); setBestTrades(bt); setWeeklyReviews(wr); })
      .catch(() => {});
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
    return computeMindScore(
      { trades, habits, completions, psychSessions, bestTrades, weeklyReviews },
      "month"
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trades, habits, completions, psychSessions, bestTrades, weeklyReviews]);

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
    <div className="flex flex-col gap-3 h-[calc(100dvh-8rem)] overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-wrap items-end justify-between gap-3 shrink-0"
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
          {/* Row 1 — capital + habits (left), win rate (middle), mind score (right) */}
          <div className="grid gap-3 md:grid-cols-3 flex-1 min-h-0">
            <div className="flex flex-col gap-3 min-h-0">
              <ActiveCapitalCard capital={activeCapital} count={activeAccounts.length} hidden={hidden} onToggle={toggle} />
              <HabitsCard habits={habits} doneToday={doneToday} pendingHabit={pendingHabit} onToggle={handleToggleHabit} />
            </div>
            <WinRateCard winRate={winRate} wins={wins} losses={losses} be={be} total={monthTrades.length} netR={monthR} />
            <MindScoreOrb score={mcMind} />
          </div>

          {/* Row 2 — journal fills to the bottom, analysis beside it */}
          <div className="grid gap-3 lg:grid-cols-3 flex-1 min-h-0">
            <div className="lg:col-span-2 min-h-0">
              <WeekStrip days={weekDays} />
            </div>
            <AnalysisWidget analyses={analyses} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── MC mind score — one readiness number, split into its inputs ──────────
   A rising "signal-strength" bar meter for the blended score, the current band
   as its state label, the three inputs (rules, habits, objectives) as inline
   sub-scores, and a compact objectives strip. Clicking through opens the full
   breakdown page with the calculation and week / month / all-time scores. */
const METER_BARS = 22;

function MindScoreOrb({ score }: { score: MindScore | null }) {
  const target = score?.total ?? 0;
  const hasData = score?.total != null;
  const [display, setDisplay] = useState(0);
  const [prog, setProg] = useState(0); // 0..1 animated fill
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
  const filled = Math.round(prog * METER_BARS);

  const comp = (key: "rules" | "habits" | "objectives") => score?.components.find((c) => c.key === key)?.value ?? null;
  const objectives = score?.objectives ?? [];

  return (
    <Link href="/psychological-edge/mindscore" className={cn(CARD_BASE, "flex flex-col group")}>
      <CardFx accent={color} />
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">MC mind score</p>
        <span className="text-[10px] text-muted-foreground/70">this month</span>
      </div>

      {/* Score + signal meter */}
      <div className="flex items-end gap-3 mt-2.5">
        <div className="shrink-0">
          <p className="text-[40px] font-black tabular-nums leading-none" style={{ color }}>
            {hasData ? display : "—"}
          </p>
          <p className="text-[11px] font-medium mt-1" style={{ color: hasData ? color : "var(--muted-foreground)" }}>
            {hasData ? score!.band.label : "No data yet"}
          </p>
        </div>
        <div className="flex-1 flex items-end gap-[3px] h-16 pb-0.5" aria-hidden>
          {Array.from({ length: METER_BARS }).map((_, i) => {
            const on = i < filled;
            const h = 30 + (i / (METER_BARS - 1)) * 70; // 30%..100% rising profile
            return (
              <div
                key={i}
                className="flex-1 rounded-[2px]"
                style={{
                  height: `${h}%`,
                  background: on ? color : alpha("var(--muted-foreground)", 14),
                  boxShadow: on ? `0 0 6px ${alpha(color, 35)}` : "none",
                  transition: "background 0.3s ease, box-shadow 0.3s ease",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* The three inputs */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5">
        <MiniStat label="Rules" value={comp("rules")} accent={color} />
        <MiniStat label="Habits" value={comp("habits")} accent={CYAN} />
        <MiniStat label="Objectives" value={comp("objectives")} accent={TURQUOISE} />
      </div>

      {/* Objectives strip — process work that lifts the score */}
      <div className="mt-auto pt-3">
        <div className="h-px bg-border/60 mb-3" />
        <div className="flex items-center gap-1.5">
          {objectives.map((o) => (
            <span key={o.key} className="h-1.5 flex-1 rounded-full"
              style={{ background: o.rate >= 1 ? GREEN : o.rate > 0 ? alpha(TURQUOISE, 55) : alpha("var(--muted-foreground)", 18) }} />
          ))}
          <span className="text-[10px] font-medium text-muted-foreground/70 group-hover:text-primary transition-colors ml-1 shrink-0">
            Breakdown →
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Compact inline sub-score for the mind score card. */
function MiniStat({ label, value, accent }: {
  label: string; value: number | null; accent: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: value == null ? "var(--muted-foreground)" : accent }} />
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-[11px] font-bold tabular-nums" style={{ color: value == null ? "var(--muted-foreground)" : accent }}>
        {value == null ? "—" : `${value}%`}
      </span>
    </div>
  );
}

/* ── Win rate — hero donut of the month's W/L/BE split + net R ─────────── */
function WinRateCard({ winRate, wins, losses, be, total, netR }: {
  winRate: number | null; wins: number; losses: number; be: number; total: number; netR: number;
}) {
  const rColor = netR > 0 ? GREEN : netR < 0 ? RED : "var(--muted-foreground)";
  const [display, setDisplay] = useState(0);
  const raf = useRef(0);
  const targetWr = winRate ?? 0;

  // Count the win-rate number up on load / change.
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1200);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(e * targetWr));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [targetWr]);

  // Donut geometry — a full ring split into W / BE / L arcs by share of trades.
  const R = 52, SW = 13, C = 2 * Math.PI * R;
  const segs = [
    { v: wins, c: GREEN },
    { v: be, c: AMBER },
    { v: losses, c: RED },
  ];
  let acc = 0; // accumulated fraction, for each arc's rotation

  return (
    <div className={cn(CARD_BASE, "flex flex-col")}>
      <CardFx accent={CYAN} />
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Win rate</p>
        <span className="text-[10px] text-muted-foreground/70">this month</span>
      </div>

      {/* Donut */}
      <div className="flex-1 flex items-center justify-center py-1 min-h-0">
        <div className="relative shrink-0" style={{ width: 132, height: 132 }}>
          <svg width={132} height={132} viewBox="0 0 132 132" className="block">
            {/* Track */}
            <circle cx={66} cy={66} r={R} fill="none" stroke={alpha("var(--muted-foreground)", 14)} strokeWidth={SW} />
            {/* Segments */}
            {total > 0 && segs.map((s, i) => {
              if (s.v === 0) return null;
              const frac = s.v / total;
              const dash = frac * C;
              const rot = acc * 360 - 90; // start at top, then walk clockwise
              acc += frac;
              return (
                <circle key={i} cx={66} cy={66} r={R} fill="none" stroke={s.c} strokeWidth={SW}
                  strokeDasharray={`${dash} ${C - dash}`}
                  transform={`rotate(${rot} 66 66)`}
                  style={{ filter: `drop-shadow(0 0 4px ${alpha(s.c, 40)})` }} />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[38px] font-black tabular-nums leading-none" style={{ color: CYAN }}>
              {winRate === null ? "—" : `${display}%`}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
              {total > 0 ? `${total} trade${total !== 1 ? "s" : ""}` : "no trades"}
            </p>
          </div>
        </div>
      </div>

      {/* W / L / BE legend */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Win", value: wins, color: GREEN },
          { label: "Loss", value: losses, color: RED },
          { label: "B/E", value: be, color: AMBER },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border/50 bg-muted/20 px-2 py-1.5 text-center">
            <p className="text-base font-black tabular-nums leading-none" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Net R */}
      <div className="mt-3 flex items-center justify-between rounded-xl border border-border/60 bg-muted/25 px-3 py-2.5">
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
  const sorted = useMemo(
    () => [...analyses].sort((a, b) => b.date.localeCompare(a.date)),
    [analyses]
  );
  const featured = sorted[0];
  const rest = sorted.slice(1, 4);

  return (
    <div className={cn(CARD_BASE, "flex flex-col")}>
      <CardFx accent={CYAN} />
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Analysis</p>
        <Link href="/analysis" className="text-[11px] font-semibold text-primary hover:underline">All →</Link>
      </div>

      {!featured ? (
        <div className="flex-1 flex items-center justify-center text-center py-4">
          <p className="text-xs text-muted-foreground">No pre-trade analysis yet.</p>
        </div>
      ) : (
        <div className="mt-2.5 flex-1 flex flex-col gap-2 min-h-0">
          {/* Featured — the latest plan, given room to breathe */}
          {(() => {
            const c = BIAS_COLOR[featured.bias] ?? "var(--muted-foreground)";
            return (
              <Link href={`/analysis/${featured.id}`}
                className="group relative overflow-hidden rounded-xl border border-border/60 p-3 pl-3.5 transition-all hover:border-border"
                style={{ background: `linear-gradient(120deg, ${alpha(c, 10)}, transparent 70%)` }}>
                <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: c }} />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black font-mono tracking-tight">{featured.instrument}</span>
                  <span className="text-[11px] font-bold uppercase tracking-wide capitalize" style={{ color: c }}>{featured.bias}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground/70 tabular-nums shrink-0">
                    {format(new Date(featured.date + "T12:00:00"), "MMM d")}
                  </span>
                </div>
                {(featured.title || featured.thesis) && (
                  <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2 leading-snug">
                    {featured.title || featured.thesis}
                  </p>
                )}
              </Link>
            );
          })()}

          {/* Recent — compact rows with a bias accent */}
          {rest.map((a) => {
            const c = BIAS_COLOR[a.bias] ?? "var(--muted-foreground)";
            return (
              <Link key={a.id} href={`/analysis/${a.id}`}
                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 -mx-1 transition-colors hover:bg-muted/50">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c }} />
                <span className="text-[12px] font-bold font-mono shrink-0">{a.instrument}</span>
                <span className="text-[11px] font-medium capitalize shrink-0" style={{ color: c }}>{a.bias}</span>
                <span className="text-[10px] text-muted-foreground/70 ml-auto tabular-nums shrink-0">
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
