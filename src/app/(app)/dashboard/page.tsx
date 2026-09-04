"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import {
  format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay,
  startOfMonth, endOfMonth, isWithinInterval,
} from "date-fns";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import {
  getTrades, getAccounts, getHabits, getHabitCompletions, getProfile, getAnalyses, toggleHabitCompletion,
  getPsychEdgeSessions, getBestTradesOfDay, getWeeklyTradeReviews, getCommitmentAdherenceLogs,
} from "@/lib/supabase/queries";
import { computeMindScore, bandColorFor, type MindScore } from "@/lib/mind-score/mind-score";
import { tradeR, instrumentName, winRateOf } from "@/lib/journal/weeks";
import { resultColor, resultBands, netRColor, inOrder } from "@/lib/journal/colors";
import { usePrivacy, mask } from "@/lib/use-privacy";
import { cn } from "@/lib/utils";
import type { TradeJournalEntry, FundedAccount, Habit, HabitCompletion, PreTradeAnalysis, PsychEdgeSession, BestTradeOfDay, WeeklyTradeReview, CommitmentAdherenceLog } from "@/lib/types";

const TURQUOISE = "oklch(0.70 0.13 183)";
const CYAN = "oklch(0.72 0.14 220)";
const GREEN = "oklch(0.58 0.17 145)";
const RED = "oklch(0.58 0.22 25)";
const AMBER = "oklch(0.70 0.16 72)";
const TODAY = format(new Date(), "yyyy-MM-dd");

/** Alpha-blend a colour toward transparent — works for oklch() strings. `pct` 0–100. */
const alpha = (c: string, pct: number) => `color-mix(in oklch, ${c} ${pct}%, transparent)`;

const CARD_BASE =
  "group/card relative rounded-2xl border border-border/60 bg-card p-4 overflow-hidden " +
  "shadow-[0_4px_20px_-10px_rgba(0,0,0,0.25)] " +
  "transition-[transform,box-shadow,border-color] duration-300 ease-out " +
  "hover:-translate-y-0.5 hover:border-border/90 hover:shadow-[0_10px_36px_-14px_rgba(0,0,0,0.45)]";

/** Ambient card decoration — a top hairline in the accent colour, a soft radial
 *  glow anchored top-left, and a corner sheen + bottom underline that light up
 *  on hover. Purely decorative; sits behind content and never intercepts input. */
function CardFx({ accent }: { accent: string }) {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 group-hover/card:opacity-100"
        style={{ background: `radial-gradient(115% 85% at 0% 0%, ${alpha(accent, 9)}, transparent 55%)`, opacity: 0.85 }}
      />
      {/* Top hairline — brightens on hover */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${alpha(accent, 55)}, transparent)` }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
        style={{ background: `linear-gradient(90deg, transparent, ${alpha(accent, 95)}, transparent)` }}
      />
      {/* Corner sheen — only visible on hover */}
      <div
        className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full blur-2xl opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
        style={{ background: `radial-gradient(circle, ${alpha(accent, 25)}, transparent 70%)` }}
      />
      {/* Bottom underline — draws in on hover */}
      <div
        className="pointer-events-none absolute inset-x-6 bottom-0 h-px scale-x-0 origin-left transition-transform duration-500 ease-out group-hover/card:scale-x-100"
        style={{ background: `linear-gradient(90deg, ${alpha(accent, 65)}, transparent)` }}
      />
    </>
  );
}

/** The window a card reports on. Win rate and the mind score each keep their own. */
type Period = "week" | "month";
const PERIOD_LABEL: Record<Period, string> = { week: "week", month: "month" };

/** Remembers a card's week / month choice across reloads and navigation, so a
 *  switch to "week" stays put. Read after mount to keep SSR output stable. */
function usePersistedPeriod(key: string): [Period, (p: Period) => void] {
  const [period, setPeriod] = useState<Period>("month");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored === "week" || stored === "month") setPeriod(stored);
    } catch {
      /* ignore */
    }
  }, [key]);

  const update = useCallback((p: Period) => {
    setPeriod(p);
    try {
      localStorage.setItem(key, p);
    } catch {
      /* ignore */
    }
  }, [key]);

  return [period, update];
}

/** Compact week / month switch, sized to sit in a card header. */
function PeriodToggle({ value, onChange, accent }: {
  value: Period; onChange: (p: Period) => void; accent: string;
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-muted/25 p-0.5 shrink-0">
      {(["week", "month"] as Period[]).map((p) => {
        const active = value === p;
        return (
          <button
            key={p}
            type="button"
            aria-pressed={active}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(p); }}
            className={cn(
              "rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors",
              active ? "text-white" : "text-muted-foreground hover:text-foreground"
            )}
            style={active ? { background: accent } : undefined}
          >
            {p}
          </button>
        );
      })}
    </div>
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
  const [adherenceLogs, setAdherenceLogs] = useState<CommitmentAdherenceLog[]>([]);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
    Promise.all([getTrades(), getAccounts(), getHabits(), getHabitCompletions(), getProfile(), getAnalyses()])
      .then(([t, a, hb, c, p, an]) => {
        setTrades(t); setAccounts(a); setHabits(hb); setCompletions(c); setAnalyses(an);
        if (p?.full_name) setFirstName(p.full_name.split(" ")[0]);
      });
    // Progression data (quests + level) loads independently so it never blocks the hero widgets.
    Promise.all([getPsychEdgeSessions(), getBestTradesOfDay(), getWeeklyTradeReviews(), getCommitmentAdherenceLogs()])
      .then(([ps, bt, wr, al]) => { setPsychSessions(ps); setBestTrades(bt); setWeeklyReviews(wr); setAdherenceLogs(al); })
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

  // Win rate and the mind score each report on their own window, remembered
  // per card so the choice survives a reload.
  const [wrPeriod, setWrPeriod] = usePersistedPeriod("tradecore:dash-winrate-period");
  const [mindPeriod, setMindPeriod] = usePersistedPeriod("tradecore:dash-mindscore-period");

  const periodTrades = useMemo(() => {
    if (!trades) return [];
    const start = wrPeriod === "week" ? startOfWeek(now, { weekStartsOn: 1 }) : startOfMonth(now);
    const end = wrPeriod === "week" ? endOfWeek(now, { weekStartsOn: 1 }) : endOfMonth(now);
    return trades.filter((t) =>
      isWithinInterval(new Date(t.date_time.slice(0, 10) + "T12:00:00"), { start, end })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trades, wrPeriod]);

  const wins = periodTrades.filter((t) => t.result === "win").length;
  const losses = periodTrades.filter((t) => t.result === "loss").length;
  const be = periodTrades.length - wins - losses;
  // Break-even trades are shown in the legend but excluded from the rate.
  const winRate = winRateOf(wins, losses);
  const periodR = periodTrades.reduce((s, t) => s + tradeR(t), 0);
  const goodExec = periodTrades.filter((t) => t.execution_quality === "good").length;
  const badExec = periodTrades.filter((t) => t.execution_quality === "bad").length;

  const mcMind = useMemo(() => {
    if (!trades) return null;
    return computeMindScore(
      { trades, habits, completions, psychSessions, bestTrades, weeklyReviews, analyses, adherenceLogs },
      mindPeriod
    );
  }, [trades, habits, completions, psychSessions, bestTrades, weeklyReviews, analyses, adherenceLogs, mindPeriod]);

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
    // Fixed one-screen dashboard on desktop; on phones it flows and scrolls so
    // the stacked cards aren't squeezed into a single viewport height.
    <div className="flex flex-col gap-3 lg:h-[calc(100dvh-7rem)] lg:overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-wrap items-end justify-between gap-3 shrink-0"
      >
        <h1 className="font-heading font-bold text-lg md:text-xl text-foreground tracking-tight leading-none">
          {greeting ? `${greeting}${firstName ? `, ${firstName}` : ""}` : "Dashboard"}
        </h1>
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
            <WinRateCard
              winRate={winRate} wins={wins} losses={losses} be={be}
              total={periodTrades.length} netR={periodR}
              goodExec={goodExec} badExec={badExec}
              period={wrPeriod} onPeriodChange={setWrPeriod}
            />
            <MindScoreOrb score={mcMind} period={mindPeriod} onPeriodChange={setMindPeriod} />
          </div>

          {/* Row 2 — journal fills to the bottom, analysis beside it (a touch taller) */}
          <div className="grid gap-3 lg:grid-cols-3 flex-[1.35] min-h-0">
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

function MindScoreOrb({ score, period, onPeriodChange }: {
  score: MindScore | null; period: Period; onPeriodChange: (p: Period) => void;
}) {
  const pending = score?.pending ?? false;
  const target = score?.total ?? 0;
  const hasData = !pending && score?.total != null;
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

  const color = pending ? TURQUOISE : hasData ? bandColorFor(target) : "var(--muted-foreground)";
  const filled = Math.round(prog * METER_BARS);

  const comp = (key: "rules" | "habits" | "objectives") => score?.components.find((c) => c.key === key)?.value ?? null;
  const objectives = score?.objectives ?? [];

  return (
    <div className={cn(CARD_BASE, "flex flex-col group")}>
      <CardFx accent={color} />
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">MC mind score</p>
        <PeriodToggle value={period} onChange={onPeriodChange} accent={TURQUOISE} />
      </div>

      {/* Score + signal meter */}
      <div className="flex items-end gap-3 mt-2.5">
        <div className="shrink-0">
          <p className="text-[40px] font-black tabular-nums leading-none" style={{ color }}>
            {pending ? "·" : hasData ? display : "—"}
          </p>
          <p className="text-[11px] font-medium mt-1" style={{ color: pending || hasData ? color : "var(--muted-foreground)" }}>
            {pending ? (period === "week" ? "New week" : "New month") : hasData ? score!.band.label : "No data yet"}
          </p>
        </div>
        <div className="group/meter flex-1 flex items-end gap-[3px] h-16 pb-0.5" aria-hidden>
          {Array.from({ length: METER_BARS }).map((_, i) => {
            const on = i < filled;
            const h = 30 + (i / (METER_BARS - 1)) * 70; // 30%..100% rising profile
            return (
              <div
                key={i}
                className="flex-1 rounded-[2px] origin-bottom transition-[background,box-shadow,transform,filter] duration-300 group-hover/meter:scale-y-105"
                style={{
                  height: `${h}%`,
                  background: on ? color : alpha("var(--muted-foreground)", 14),
                  boxShadow: on ? `0 0 6px ${alpha(color, 35)}` : "none",
                  transitionDelay: `${i * 18}ms`,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* The three inputs — or, at the very start of a fresh period, a reassuring note */}
      {pending ? (
        <p className="mt-2.5 text-[11px] leading-snug text-muted-foreground">
          Your score for this {period} is still being calculated — it builds as you
          log trades, tick habits and do the work.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5">
          <MiniStat label="Rules" value={comp("rules")} accent={color} />
          <MiniStat label="Habits" value={comp("habits")} accent={CYAN} />
          <MiniStat label="Objectives" value={comp("objectives")} accent={TURQUOISE} />
        </div>
      )}

      {/* Objectives strip — process work that lifts the score */}
      <div className="mt-auto pt-3">
        <div className="h-px bg-border/60 mb-3" />
        <div className="flex items-center gap-1.5">
          {objectives.map((o) => (
            <span key={o.key} className="h-1.5 flex-1 rounded-full"
              style={{ background: o.rate >= 1 ? GREEN : o.rate > 0 ? alpha(TURQUOISE, 55) : alpha("var(--muted-foreground)", 18) }} />
          ))}
          <Link
            href="/psychological-edge?tab=mindscore"
            className="text-[10px] font-medium text-muted-foreground/70 hover:text-primary transition-colors ml-1 shrink-0"
          >
            Breakdown →
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Compact inline sub-score for the mind score card. Chip lights up on hover. */
function MiniStat({ label, value, accent }: {
  label: string; value: number | null; accent: string;
}) {
  const on = value != null;
  return (
    <div
      className="group/mini inline-flex items-center gap-1.5 rounded-full border border-transparent px-2 py-0.5 transition-colors hover:border-border/60"
      style={{ background: on ? alpha(accent, 6) : "transparent" }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0 transition-transform duration-300 group-hover/mini:scale-125"
        style={{ background: on ? accent : "var(--muted-foreground)", boxShadow: on ? `0 0 6px ${alpha(accent, 55)}` : undefined }}
      />
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-[11px] font-bold tabular-nums" style={{ color: on ? accent : "var(--muted-foreground)" }}>
        {value == null ? "—" : `${value}%`}
      </span>
    </div>
  );
}

/* ── Win rate — hero donut of the month's W/L/BE split + net R ─────────── */
function WinRateCard({ winRate, wins, losses, be, total, netR, goodExec, badExec, period, onPeriodChange }: {
  winRate: number | null; wins: number; losses: number; be: number; total: number; netR: number;
  goodExec: number; badExec: number;
  period: Period; onPeriodChange: (p: Period) => void;
}) {
  const rColor = netR > 0 ? GREEN : netR < 0 ? RED : "var(--muted-foreground)";
  const ratedExec = goodExec + badExec;
  const goodPct = ratedExec ? Math.round((goodExec / ratedExec) * 100) : null;
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
  const R = 46, SW = 11, C = 2 * Math.PI * R;
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
        <PeriodToggle value={period} onChange={onPeriodChange} accent={CYAN} />
      </div>

      {/* Donut — sized from the viewport height rather than just the leftover
          card space, so a short laptop viewport gets a proportionate ring
          instead of one that crowds out the legend. The floor keeps it a proper
          ring (not a dot) on phones, where the column is not height-capped. */}
      <div className="flex-1 flex items-center justify-center py-1 min-h-[clamp(72px,8vh,96px)]">
        <div className="group/donut relative aspect-square h-full max-h-[clamp(76px,10.5vh,112px)] w-auto transition-transform duration-500 ease-out hover:scale-[1.03]">
          <svg viewBox="0 0 116 116" className="block h-full w-full">
            {/* Track */}
            <circle cx={58} cy={58} r={R} fill="none" stroke={alpha("var(--muted-foreground)", 14)} strokeWidth={SW} />
            {/* Segments — arcs draw in on mount and brighten on hover */}
            {total > 0 && segs.map((s, i) => {
              if (s.v === 0) return null;
              const frac = s.v / total;
              const dash = frac * C;
              const rot = acc * 360 - 90; // start at top, then walk clockwise
              acc += frac;
              return (
                <circle key={i} cx={58} cy={58} r={R} fill="none" stroke={s.c} strokeWidth={SW}
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${C - dash}`}
                  transform={`rotate(${rot} 58 58)`}
                  className="transition-[filter,stroke-width] duration-300 group-hover/donut:[stroke-width:12]"
                  style={{ filter: `drop-shadow(0 0 4px ${alpha(s.c, 40)})` }} />
              );
            })}
          </svg>
          {/* Subtle inner glow that intensifies on hover */}
          <div
            className="pointer-events-none absolute inset-4 rounded-full opacity-60 transition-opacity duration-500 group-hover/donut:opacity-100"
            style={{ background: `radial-gradient(circle, ${alpha(CYAN, 12)}, transparent 65%)` }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Tracks the ring's own scale, so the figure never crowds a small ring. */}
            <p className="text-[clamp(18px,2.6vh,28px)] font-black tabular-nums leading-none" style={{ color: CYAN }}>
              {winRate === null ? "—" : `${display}%`}
            </p>
            <p className="text-[clamp(8px,1vh,9px)] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
              {total > 0 ? `${total} trade${total !== 1 ? "s" : ""}` : "no trades"}
            </p>
          </div>
        </div>
      </div>

      {/* W / L / BE legend — chips light up on hover */}
      <div className="grid grid-cols-3 gap-2 mt-0.5">
        {[
          { label: "Win", value: wins, color: GREEN },
          { label: "Loss", value: losses, color: RED },
          { label: "B/E", value: be, color: AMBER },
        ].map((s) => (
          <div
            key={s.label}
            className="group/chip relative rounded-lg border border-border/50 bg-muted/20 px-2 py-1 text-center transition-transform duration-300 hover:-translate-y-px"
          >
            <p className="relative z-10 text-base font-black tabular-nums leading-none" style={{ color: s.color }}>{s.value}</p>
            <p className="relative z-10 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">{s.label}</p>
            {/* Hover glow ring */}
            <div
              className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-hover/chip:opacity-100"
              style={{
                boxShadow: `inset 0 0 0 1px ${alpha(s.color, 40)}, 0 6px 20px -12px ${alpha(s.color, 60)}`,
                background: alpha(s.color, 8),
              }}
            />
          </div>
        ))}
      </div>

      {/* Net R + execution quality — one compact block keeps the ring roomy on laptops */}
      <div className="mt-1.5 rounded-xl border border-border/60 bg-muted/25 px-3 py-1.5 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Net R · {PERIOD_LABEL[period]}</span>
          <span className="text-lg font-black tabular-nums leading-none" style={{ color: rColor }}>
            {netR > 0 ? "+" : ""}{netR.toFixed(1)}R
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0">Exec</span>
          <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-muted/40">
            {goodPct !== null && (
              <>
                <div className="h-full" style={{ width: `${goodPct}%`, background: GREEN }} />
                <div className="h-full" style={{ width: `${100 - goodPct}%`, background: RED }} />
              </>
            )}
          </div>
          <span className="shrink-0 text-sm font-black tabular-nums" style={{ color: goodPct === null ? "var(--muted-foreground)" : GREEN }}>
            {goodPct === null ? "—" : `${goodPct}%`}
          </span>
          <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">{goodExec}G · {badExec}B</span>
        </div>
      </div>

      <Link href="/analytics" className="mt-1.5 text-[11px] font-semibold text-primary hover:underline">
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
              <Link
                href={`/analysis/${featured.id}`}
                className="group/feat relative overflow-hidden rounded-xl border border-border/60 p-3 pl-3.5 transition-all duration-300 hover:border-border hover:-translate-y-0.5"
                style={{ background: `linear-gradient(120deg, ${alpha(c, 10)}, transparent 70%)` }}
              >
                {/* Accent bar — widens on hover */}
                <span
                  className="absolute inset-y-0 left-0 w-[3px] transition-[width,box-shadow] duration-300 group-hover/feat:w-[5px]"
                  style={{ background: c, boxShadow: `0 0 12px ${alpha(c, 40)}` }}
                />
                {/* Sheen sweep on hover */}
                <span
                  className="pointer-events-none absolute inset-0 -translate-x-full transition-transform duration-700 ease-out group-hover/feat:translate-x-full"
                  style={{ background: `linear-gradient(100deg, transparent 20%, ${alpha(c, 12)} 50%, transparent 80%)` }}
                />
                <div className="relative flex items-center gap-2">
                  <span className="text-sm font-black font-mono tracking-tight">{featured.instrument}</span>
                  <span className="text-[11px] font-bold uppercase tracking-wide capitalize" style={{ color: c }}>{featured.bias}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground/70 tabular-nums shrink-0">
                    {format(new Date(featured.date + "T12:00:00"), "MMM d")}
                  </span>
                </div>
                {(featured.title || featured.thesis) && (
                  <p className="relative text-[11px] text-muted-foreground mt-1.5 line-clamp-2 leading-snug">
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
              <Link
                key={a.id}
                href={`/analysis/${a.id}`}
                className="group/row flex items-center gap-2.5 rounded-lg px-2 py-1.5 -mx-1 transition-all duration-300 hover:bg-muted/50 hover:translate-x-0.5"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300 group-hover/row:scale-150"
                  style={{ background: c, boxShadow: `0 0 8px ${alpha(c, 45)}` }}
                />
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
            const pending = pendingHabit === habit.id;
            return (
              <button
                key={habit.id}
                type="button"
                onClick={() => onToggle(habit.id)}
                disabled={pending}
                className={cn(
                  "group/habit relative w-full flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-all duration-300 disabled:opacity-60",
                  done ? "bg-success/8" : "hover:bg-muted/50 hover:translate-x-0.5"
                )}
              >
                {/* Left accent bar — draws in on hover, stays lit when done */}
                <span
                  className={cn(
                    "absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full transition-all duration-300",
                    done ? "opacity-90 scale-y-100" : "opacity-0 scale-y-50 group-hover/habit:opacity-70 group-hover/habit:scale-y-100"
                  )}
                  style={{ background: habit.color }}
                />
                <span
                  className={cn(
                    "h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                    done ? "scale-105" : "group-hover/habit:scale-110"
                  )}
                  style={done
                    ? { background: habit.color, borderColor: habit.color, boxShadow: `0 0 10px ${alpha(habit.color, 55)}` }
                    : { borderColor: "var(--border)" }}
                >
                  {done && (
                    <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 animate-in zoom-in-50 duration-200" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </span>
                <span className={cn("text-[13px] truncate flex-1 transition-colors", done ? "text-foreground" : "text-muted-foreground group-hover/habit:text-foreground")}>
                  {habit.name}
                </span>
                {pending && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground/60 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Journal — this week ───────────────────────────────────────────────────
   A day is not one outcome. When several trades were taken, the card is split
   into one band per trade in the order they were logged — a break-even next to
   a loss reads as half amber, half red — so a mixed day can never be mistaken
   for a single result. The net R keeps its own colour. */

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
          // Chronological, so the bands run in the order the day actually went.
          const ordered = inOrder(dt);
          const colors = ordered.map(resultColor);
          const netColor = netRColor(r);
          const today = isToday(date);
          const shown = ordered.slice(0, 3);
          return (
            <Link
              key={date.toISOString()}
              // Straight to that day's log — the journal resolves a single trade
              // to its entry and offers a picker when the day holds several.
              href={has ? `/journal?day=${format(date, "yyyy-MM-dd")}` : "/journal"}
              className={cn(
                "group/day relative flex flex-col items-center rounded-xl border px-1 pb-2.5 pt-3 overflow-hidden",
                "transition-all duration-300 ease-out hover:-translate-y-1",
                today ? "border-primary/50" : "border-border/60"
              )}
              style={has ? { background: resultBands(ordered, 14) } : undefined}
            >
              {/* Result bar — one full-strength segment per trade, the day's
                  outcome at a glance even before the numbers are read. */}
              {has && (
                <span className="pointer-events-none absolute inset-x-0 top-0 flex h-[3px] gap-px">
                  {colors.map((c, i) => (
                    <span
                      key={i}
                      className="flex-1 transition-[filter] duration-300 group-hover/day:brightness-125"
                      style={{ background: c, boxShadow: `0 0 8px ${alpha(c, 45)}` }}
                    />
                  ))}
                </span>
              )}
              {/* Hairlines between the bands, so two trades read as two halves
                  rather than one blended wash. */}
              {colors.length > 1 && (
                <span aria-hidden className="pointer-events-none absolute inset-0">
                  {colors.slice(1).map((_, i) => (
                    <span
                      key={i}
                      className="absolute inset-y-0 w-px"
                      style={{
                        left: `${(((i + 1) / colors.length) * 100).toFixed(3)}%`,
                        background: `linear-gradient(180deg, transparent, ${alpha("var(--foreground)", 12)} 30%, transparent)`,
                      }}
                    />
                  ))}
                </span>
              )}
              {/* Hover glow — soft radial in the day's net colour */}
              <span
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/day:opacity-100"
                style={{ background: has ? `radial-gradient(120% 90% at 50% 100%, ${alpha(netColor, 18)}, transparent 65%)` : undefined }}
              />

              <span className={cn("relative text-[10px] font-semibold uppercase tracking-wide", today ? "text-primary" : "text-muted-foreground/60")}>{format(date, "EEE")}</span>
              <span className={cn("relative text-lg font-bold tabular-nums mt-0.5 transition-transform duration-300 group-hover/day:scale-110", today ? "text-primary" : "text-foreground/85")}>
                {format(date, "d")}
              </span>

              {has ? (
                <span className="relative mt-1 flex items-center gap-1">
                  <span className="text-[13px] font-black tabular-nums transition-transform duration-300 group-hover/day:scale-105" style={{ color: netColor }}>
                    {r > 0 ? "+" : ""}{r.toFixed(1)}R
                  </span>
                  {dt.length > 1 && (
                    <span className="rounded-full border border-border/70 bg-background/50 px-1 text-[9px] font-bold leading-[14px] text-muted-foreground/80">
                      {dt.length}
                    </span>
                  )}
                </span>
              ) : (
                <span className="relative mt-2 h-1.5 w-1.5 rounded-full bg-border transition-all duration-300 group-hover/day:bg-muted-foreground/50 group-hover/day:scale-125" />
              )}

              {/* Per trade: pair, its R, and how cleanly it was run — each on the
                  rail of its own result colour. */}
              {has && (
                <div className="relative mt-2 w-full space-y-1.5 overflow-hidden px-0.5">
                  {shown.map((t) => {
                    const c = resultColor(t);
                    return (
                      <div
                        key={t.id}
                        className="rounded-md border-l-2 bg-background/25 py-1 pl-1.5 pr-1 text-left leading-tight"
                        style={{ borderColor: c }}
                      >
                        <div className="flex items-baseline justify-between gap-1">
                          <p className="truncate text-[10px] font-bold text-foreground">{instrumentName(t.instrument)}</p>
                          <p className="shrink-0 text-[10px] font-black tabular-nums" style={{ color: c }}>
                            {t.result === "win" ? `+${t.rr}R` : t.result === "loss" ? "-1R" : "0R"}
                          </p>
                        </div>
                        {t.execution_quality && (
                          <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide" style={{ color: t.execution_quality === "good" ? GREEN : RED }}>
                            {t.execution_quality === "good" ? "good exec" : "bad exec"}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {ordered.length > shown.length && (
                    <span className="block text-center text-[9px] text-muted-foreground/60">+{ordered.length - shown.length} more</span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-border/40 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground/70">
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: GREEN }} /> Win</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: RED }} /> Loss</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: AMBER }} /> B/E</span>
        <span className="ml-auto hidden sm:inline text-muted-foreground/50">A split card = several trades that day</span>
      </div>
    </div>
  );
}
