"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { format, isToday } from "date-fns";
import { Loader2, Plus } from "lucide-react";
import { bandColorFor, type MindScore } from "@/lib/mind-score/mind-score";
import { formatGoalValue, METRIC_META, type GoalProgress } from "@/lib/goals/goals";
import { instrumentName } from "@/lib/journal/weeks";
import { resultColor, resultBands, netRColor, inOrder } from "@/lib/journal/colors";
import { mask } from "@/lib/use-privacy";
import { cn } from "@/lib/utils";
import type { TradingGoal, TradeJournalEntry, Habit } from "@/lib/types";

const TURQUOISE = "var(--primary)";
const CYAN = "var(--ice)";
const GREEN = "var(--win)";
const RED = "var(--loss)";
const AMBER = "var(--be)";
const alpha = (c: string, pct: number) => `color-mix(in oklch, ${c} ${pct}%, transparent)`;
const CARD_BASE = "group/card relative rounded-2xl border border-border/60 bg-card p-4 overflow-hidden shadow-[0_4px_20px_-10px_rgba(0,0,0,0.25)] transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-border/90 hover:shadow-[0_10px_36px_-14px_rgba(0,0,0,0.45)]";
function CardFx({ accent }: { accent: string }) {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 group-hover/card:opacity-100"
        style={{ background: `radial-gradient(115% 85% at 0% 0%, ${alpha(accent, 9)}, transparent 55%)`, opacity: 0.85 }}
      />
      {/* Top hairline: brightens on hover */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${alpha(accent, 55)}, transparent)` }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
        style={{ background: `linear-gradient(90deg, transparent, ${alpha(accent, 95)}, transparent)` }}
      />
      {/* Corner sheen: only visible on hover */}
      <div
        className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full blur-2xl opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
        style={{ background: `radial-gradient(circle, ${alpha(accent, 25)}, transparent 70%)` }}
      />
      {/* Bottom underline: draws in on hover */}
      <div
        className="pointer-events-none absolute inset-x-6 bottom-0 h-px scale-x-0 origin-left transition-transform duration-500 ease-out group-hover/card:scale-x-100"
        style={{ background: `linear-gradient(90deg, ${alpha(accent, 65)}, transparent)` }}
      />
    </>
  );
}

type Period = "week" | "month";
const PERIOD_LABEL: Record<Period, string> = { week: "week", month: "month" };
function PeriodToggle({ value, onChange, accent }: {
  value: Period; onChange: (p: Period) => void; accent: string;
}) {
  return (
    // `ml-auto` so the toggle still sits at the right edge on a narrow card
    // where the header has wrapped it onto its own line.
    <div className="ml-auto flex shrink-0 items-center gap-0.5 rounded-lg border border-border/60 bg-muted/25 p-0.5">
      {(["week", "month"] as Period[]).map((p) => {
        const active = value === p;
        return (
          <button
            key={p}
            type="button"
            aria-pressed={active}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(p); }}
            className={cn(
              "rounded-md px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wider transition-colors sm:px-2 sm:text-[10px]",
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

/* ── MC mind score: the readiness number, and nothing else ───────────────
   One figure, its band, and a rising "signal-strength" meter. What the score is
   made of (rules, execution, habits, objectives) is a study in its own right,
   not something to scan past on a dashboard, so it lives one click away on the
   breakdown page together with the calculation and the week / month / all-time
   scores. Keeping the card to the headline is what makes room beneath it for
   the goals and the plans. */
const METER_BARS = 22;

export function MindScoreOrb({ score, period, onPeriodChange, className }: {
  score: MindScore | null; period: Period; onPeriodChange: (p: Period) => void; className?: string;
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
    const dur = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 1400;
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


  return (
    <div className={cn(CARD_BASE, "group flex flex-col", className)}>
      <CardFx accent={color} />
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <p className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">MC mind score</p>
        <PeriodToggle value={period} onChange={onPeriodChange} accent={TURQUOISE} />
      </div>

      {/* Score + signal meter. The meter takes whatever height the card has
          spare, so the card fills rather than leaving a hole in the middle. */}
      {/* Grow, but never shrink. The row is bottom-aligned, so squeezing it
          pushes the score up over the title instead of just making it smaller.
          On a screen too short for the whole card the objectives strip below
          gives way, which is a far kinder way to run out of room. */}
      <div className="mt-2.5 flex shrink-0 grow items-end gap-3 short:mt-1.5">
        {/* On a laptop the band label moves up beside the number instead of
            sitting under it, which is most of the height this card has to find. */}
        <div className="shrink-0 short:flex short:items-baseline short:gap-2">
          <p className="text-[40px] font-black leading-none tabular-nums short:text-[28px]" style={{ color }}>
            {pending ? "·" : hasData ? display : "-"}
          </p>
          <p className="mt-1 text-[11px] font-medium short:mt-0" style={{ color: pending || hasData ? color : "var(--muted-foreground)" }}>
            {pending ? (period === "week" ? "New week" : "New month") : hasData ? score!.band.label : "No data yet"}
          </p>
        </div>
        <div className="group/meter flex h-full min-h-[52px] flex-1 items-end gap-[3px] pb-0.5 short:min-h-[26px]" aria-hidden>
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

      {pending && (
        <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
          Your score for this {period} is still being calculated: it builds as you
          log trades, tick habits and do the work.
        </p>
      )}

      <Link
        href="/psychological-edge?tab=mindscore"
        className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-2.5 text-[11px] font-medium text-muted-foreground/70 transition-colors hover:text-primary"
      >
        <span>What this is made of</span>
        <span aria-hidden>Breakdown →</span>
      </Link>
    </div>
  );
}

/* ── Goals: what you are working towards, from Mind Edge ─────────────────
   The live goals with the one reading that matters on a dashboard: where the
   metric stands, what it is chasing, and whether it is keeping up with the
   calendar. The full journey (baseline, pace tick, verdict) stays on the Mind
   Edge goals tab; this is the glance. */
const GOAL_STATE: Record<GoalProgress["state"], { color: string; word: string }> = {
  "achieved": { color: GREEN, word: "Achieved" },
  "on-track": { color: TURQUOISE, word: "On track" },
  "behind": { color: AMBER, word: "Behind" },
  "missed": { color: RED, word: "Missed" },
  "no-data": { color: "var(--muted-foreground)", word: "Not started" },
};

export function GoalsCard({ goals, progress, className }: {
  goals: TradingGoal[];
  progress: { goal: TradingGoal; p: GoalProgress }[];
  className?: string;
}) {
  const shown = progress.slice(0, 3);

  return (
    <div className={cn(CARD_BASE, "flex flex-col", className)}>
      <CardFx accent={TURQUOISE} />

      {/* No strapline: the rows now say what each goal is, and the height it
          would cost is the height the third goal needs to sit complete. */}
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Goals</p>
        <Link href="/psychological-edge?tab=goals" className="shrink-0 whitespace-nowrap text-[11px] font-semibold text-primary hover:underline">
          {goals.length > 0 ? "All goals" : "Set one"}
        </Link>
      </div>

      {shown.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-center">
          <p className="text-xs text-muted-foreground">No goals running.</p>
          <p className="text-[11px] text-muted-foreground/60">Name one in Mind Edge and it tracks itself.</p>
        </div>
      ) : (
        <ul className="mt-2.5 space-y-2 md:min-h-0 md:flex-1 md:overflow-hidden">
          {shown.map(({ goal, p }) => {
            const meta = METRIC_META[goal.metric];
            const tone = GOAL_STATE[p.state];
            const named = goal.title.trim();
            // What is being moved is the goal: "Execution rate 64% / 80%" says
            // it, where the trader's own name for it ("Stop revenge trading")
            // does not. The name is kept, but on the tooltip.
            const tip = `${named ? `${named}. ` : ""}${meta.label}: now ${formatGoalValue(goal.metric, p.current)}, target ${formatGoalValue(goal.metric, goal.target)}. ${meta.help}`;
            return (
              <li key={goal.id}>
                <Link
                  href="/psychological-edge?tab=goals"
                  title={tip}
                  className="group/goal block rounded-lg py-0.5 transition-colors hover:bg-muted/25"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="min-w-0 truncate text-[11px] font-semibold text-foreground/85">
                      {meta.label}
                    </span>
                    <span className="shrink-0 text-[11px] font-bold tabular-nums" style={{ color: tone.color }}>
                      {formatGoalValue(goal.metric, p.current)}
                      <span className="font-medium text-muted-foreground/60"> / {formatGoalValue(goal.metric, goal.target)}</span>
                    </span>
                  </div>
                  {/* The fill is the goal, the tick is the calendar: the gap
                      between them is exactly how far off the pace it is. */}
                  <div className="relative mt-1 h-[5px] overflow-hidden rounded-full" style={{ background: alpha("var(--muted-foreground)", 12) }}>
                    <span
                      className="absolute inset-y-0 left-0 rounded-full transition-[width,filter] duration-700 ease-out group-hover/goal:brightness-125"
                      style={{ width: `${Math.round(p.ratio * 100)}%`, background: tone.color, boxShadow: `0 0 8px ${alpha(tone.color, 30)}` }}
                    />
                    {!p.closed && (
                      <span
                        aria-hidden
                        className="absolute inset-y-0 w-px bg-foreground/45"
                        style={{ left: `${Math.round(p.timeElapsed * 100)}%` }}
                        title="Where the calendar is"
                      />
                    )}
                  </div>
                  <p className="mt-0.5 flex items-baseline justify-between gap-2 text-[10px] leading-tight text-muted-foreground/70">
                    <span className="min-w-0 truncate" style={{ color: tone.color }}>{tone.word}</span>
                    <span className="shrink-0 tabular-nums">
                      {p.closed ? "window closed" : p.daysLeft === 0 ? "last day" : `${p.daysLeft} ${p.daysLeft === 1 ? "day" : "days"} left`}
                    </span>
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {progress.length > shown.length && (
        <p className="mt-2 border-t border-border/40 pt-2 text-[11px] text-muted-foreground/70">
          <span className="font-bold text-foreground/85">{progress.length - shown.length} more</span> running in Mind Edge
        </p>
      )}
    </div>
  );
}

/* ── Win rate: hero donut of the month's W/L/BE split + net R ─────────── */
export function WinRateCard({ winRate, wins, losses, be, total, netR, goodExec, badExec, period, onPeriodChange, className }: {
  winRate: number | null; wins: number; losses: number; be: number; total: number; netR: number;
  goodExec: number; badExec: number;
  period: Period; onPeriodChange: (p: Period) => void; className?: string;
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
    const dur = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 1200;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(e * targetWr));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [targetWr]);

  // Donut geometry: a full ring split into W / BE / L arcs by share of trades.
  const R = 46, SW = 11, C = 2 * Math.PI * R;
  const segs = [
    { v: wins, c: GREEN },
    { v: be, c: AMBER },
    { v: losses, c: RED },
  ];
  let acc = 0; // accumulated fraction, for each arc's rotation

  return (
    <div className={cn(CARD_BASE, "flex flex-col", className)}>
      <CardFx accent={CYAN} />
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <p className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Win rate</p>
        <PeriodToggle value={period} onChange={onPeriodChange} accent={CYAN} />
      </div>

      {/* Donut: sized from the viewport height rather than just the leftover
          card space, so a short laptop viewport gets a proportionate ring
          instead of one that crowds out the legend. The floor keeps it a proper
          ring (not a dot) on phones, where the column is not height-capped. */}
      <div className="flex-1 flex items-center justify-center py-1 min-h-[clamp(72px,8vh,96px)]">
        <div className="group/donut relative aspect-square h-full max-h-[clamp(76px,10.5vh,112px)] w-auto transition-transform duration-500 ease-out hover:scale-[1.03]">
          <svg viewBox="0 0 116 116" className="block h-full w-full">
            {/* Track */}
            <circle cx={58} cy={58} r={R} fill="none" stroke={alpha("var(--muted-foreground)", 14)} strokeWidth={SW} />
            {/* Segments: arcs draw in on mount and brighten on hover */}
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
              {winRate === null ? "-" : `${display}%`}
            </p>
            <p className="text-[clamp(8px,1vh,9px)] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
              {total > 0 ? `${total} trade${total !== 1 ? "s" : ""}` : "no trades"}
            </p>
          </div>
        </div>
      </div>

      {/* W / L / BE legend: chips light up on hover */}
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

      {/* Net R + execution quality: one compact block keeps the ring roomy on laptops */}
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
            {goodPct === null ? "-" : `${goodPct}%`}
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

export function ActiveCapitalCard({ capital, count, hidden, onToggle, className }: {
  capital: number; count: number; hidden: boolean; onToggle: () => void; className?: string;
}) {
  return (
    <div className={cn(CARD_BASE, "flex flex-col justify-center p-3 sm:px-4 sm:py-3", className)}>
      <CardFx accent={TURQUOISE} />
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active capital</p>
        <button type="button" onClick={onToggle} aria-pressed={hidden}
          className="text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
          {hidden ? "Show" : "Hide"}
        </button>
      </div>
      <p className="text-xl font-black tabular-nums leading-none mt-1.5" style={{ color: TURQUOISE }}>
        {capital > 0 ? mask(`$${capital.toLocaleString("en-US")}`, hidden) : "-"}
      </p>
      <div className="mt-1.5 flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">{count} active account{count !== 1 ? "s" : ""}</p>
        <Link href="/accounts" className="text-[11px] font-semibold text-primary hover:underline">View →</Link>
      </div>
    </div>
  );
}

/* ── Habits: check off today, and jump to the full page ──────────────── */
export function HabitsCard({ habits, doneToday, pendingHabit, onToggle, className }: {
  habits: Habit[]; doneToday: Set<string>; pendingHabit: string | null; onToggle: (id: string) => void; className?: string;
}) {
  return (
    <div className={cn(CARD_BASE, "flex min-h-0 flex-col", className)}>
      <CardFx accent={TURQUOISE} />
      <div className="mb-2 flex items-center justify-between gap-2">
        {/* Half a phone screen has no room for the full title. */}
        <p className="whitespace-nowrap text-[13px] font-semibold sm:text-sm">
          <span className="sm:hidden">Habits</span>
          <span className="hidden sm:inline">Today&apos;s habits</span>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[11px] font-semibold tabular-nums text-primary">{doneToday.size}/{habits.length}</span>
          <Link href="/habits" className="whitespace-nowrap text-[11px] font-semibold text-primary hover:underline">Open →</Link>
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
                {/* Left accent bar: draws in on hover, stays lit when done */}
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
                <span className={cn("line-clamp-2 flex-1 text-[13px] transition-colors", done ? "text-foreground" : "text-muted-foreground group-hover/habit:text-foreground")}>
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

/* ── Journal: this week ───────────────────────────────────────────────────
   A day is not one outcome. When several trades were taken, the card is split
   into one band per trade in the order they were logged: a break-even next to
   a loss reads as half amber, half red, so a mixed day can never be mistaken
   for a single result. The net R keeps its own colour. */

export function WeekStrip({ days }: { days: { date: Date; trades: TradeJournalEntry[]; r: number }[] }) {
  return (
    <div className={cn(CARD_BASE, "flex h-full flex-col p-3 sm:p-4")}>
      <CardFx accent={TURQUOISE} />
      <div className="mb-2 flex items-center justify-between gap-2 sm:mb-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <p className="whitespace-nowrap text-[13px] font-semibold sm:text-sm">This week</p>
          <span className="truncate text-[11px] tabular-nums text-muted-foreground/70">
            {format(days[0].date, "MMM d")} - {format(days[6].date, "MMM d")}
          </span>
        </div>
        <Link href="/journal" className="shrink-0 whitespace-nowrap text-[11px] font-semibold text-primary hover:underline">
          <span className="sm:hidden">Open →</span>
          <span className="hidden sm:inline">Open journal →</span>
        </Link>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-7 gap-1 sm:gap-2">
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
              // Straight to that day's log: the journal resolves a single trade
              // to its entry and offers a picker when the day holds several.
              href={has ? `/journal?day=${format(date, "yyyy-MM-dd")}` : "/journal"}
              className={cn(
                "group/day relative flex flex-col items-center overflow-hidden rounded-lg border px-0.5 pb-2 pt-2 sm:rounded-xl sm:px-1 sm:pb-2.5 sm:pt-3",
                "transition-all duration-300 ease-out hover:-translate-y-1",
                today ? "border-primary/50" : "border-border/60"
              )}
              style={has ? { background: resultBands(ordered, 14) } : undefined}
            >
              {/* Result bar: one full-strength segment per trade, the day's
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
              {/* Hover glow: soft radial in the day's net colour */}
              <span
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/day:opacity-100"
                style={{ background: has ? `radial-gradient(120% 90% at 50% 100%, ${alpha(netColor, 18)}, transparent 65%)` : undefined }}
              />

              <span className={cn("relative text-[10px] font-semibold uppercase tracking-wide", today ? "text-primary" : "text-muted-foreground/60")}>{format(date, "EEE")}</span>
              <span className={cn("relative mt-0.5 text-base font-bold tabular-nums transition-transform duration-300 group-hover/day:scale-110 sm:text-lg", today ? "text-primary" : "text-foreground/85")}>
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

              {/* Per trade: pair, its R, and how cleanly it was run: each on the
                  rail of its own result colour. */}
              {has && (
                <div className="relative mt-2 hidden w-full space-y-1.5 overflow-hidden px-0.5 sm:block">
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

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border/40 pt-2 text-[10px] text-muted-foreground/70 sm:mt-3 sm:gap-x-4 sm:pt-3">
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: GREEN }} /> Win</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: RED }} /> Loss</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: AMBER }} /> B/E</span>
        <span className="hidden text-muted-foreground/50 lg:inline">A split card = several trades that day</span>
        {/* The week is where you notice a trade is missing, and where the next
            session gets planned, so both ways in sit right under it. */}
        <span className="ml-auto flex items-center gap-2">
          <Link
            href="/analysis/new"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 px-2.5 py-1.5 text-[11px] font-semibold text-foreground/80 transition-colors hover:border-primary/50 hover:text-primary"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} /> New analysis
          </Link>
          <Link
            href="/journal/new"
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-white transition-transform duration-200 hover:-translate-y-px"
            style={{ background: TURQUOISE, boxShadow: `0 2px 12px ${alpha(TURQUOISE, 26)}` }}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} /> Log trade
          </Link>
        </span>
      </div>
    </div>
  );
}
