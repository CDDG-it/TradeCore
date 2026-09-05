"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccentPanel } from "@/components/ui/accent-panel";
import {
  getTrades, getHabits, getHabitCompletions, getPsychEdgeSessions, getBestTradesOfDay, getWeeklyTradeReviews, getAnalyses,
  getCommitmentAdherenceLogs,
} from "@/lib/supabase/queries";
import {
  bandColorFor, computeMindScoreAll,
  type MindPeriod, type MindScore, type MindInputs, type MindComponent,
} from "@/lib/mind-score/mind-score";

const TURQUOISE = "#14B8A6";
const alpha = (c: string, pct: number) => `color-mix(in oklch, ${c} ${pct}%, transparent)`;

const PERIOD_LABEL: Record<MindPeriod, string> = { week: "This week", month: "This month", all: "All time" };

/** Plain-language identity for each of the three parts of the score. */
const PART_META: Record<MindComponent["key"], { title: string; sub: string; accent: string }> = {
  rules:      { title: "Following your rules", sub: "Sticking to your plan on every trade",      accent: "#14B8A6" },
  habits:     { title: "Daily habits",         sub: "The routines you keep away from the charts", accent: "#06B6D4" },
  objectives: { title: "Doing the work",       sub: "Reviews, prep and logging your best trade",  accent: "#14B8A6" },
};

/**
 * The MC Mindscore — one number, one bar, three plain-language parts.
 * Laid out to fit a single screen: no internal scrolling, no jargon.
 */
export function MindScoreBreakdown() {
  const [data, setData] = useState<MindInputs | null>(null);
  const [period, setPeriod] = useState<MindPeriod>("month");

  useEffect(() => {
    Promise.all([
      getTrades(), getHabits(), getHabitCompletions(),
      getPsychEdgeSessions(), getBestTradesOfDay(), getWeeklyTradeReviews(), getAnalyses(),
      getCommitmentAdherenceLogs(),
    ]).then(([trades, habits, completions, psychSessions, bestTrades, weeklyReviews, analyses, adherenceLogs]) => {
      setData({ trades, habits, completions, psychSessions, bestTrades, weeklyReviews, analyses, adherenceLogs });
    }).catch(() => setData({ trades: [], habits: [], completions: [], psychSessions: [], bestTrades: [], weeklyReviews: [], analyses: [], adherenceLogs: [] }));
  }, []);

  const scores = useMemo(() => (data ? computeMindScoreAll(data) : null), [data]);
  const score = scores?.[period] ?? null;

  if (!scores || !score) {
    return (
      <div className="flex items-center justify-center h-56">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const c = score.pending ? TURQUOISE : bandColorFor(score.total);

  return (
    <div className="space-y-3">
      {/* Period switch — each shows its own score */}
      <div className="grid grid-cols-3 gap-2">
        {(["week", "month", "all"] as MindPeriod[]).map((p) => {
          const s = scores[p];
          const active = period === p;
          const pc = s.pending ? TURQUOISE : bandColorFor(s.total);
          return (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                "flex items-baseline justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors",
                active ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30 hover:bg-muted/30"
              )}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{PERIOD_LABEL[p]}</span>
              <span className="text-lg font-black tabular-nums leading-none" style={{ color: pc }}>
                {s.pending ? "·" : s.total == null ? "—" : s.total}
              </span>
            </button>
          );
        })}
      </div>

      {/* Hero — the score, or a friendly "just getting started" note.
          The spine takes the band colour, so the panel reads at a glance. */}
      <div
        className="relative overflow-hidden rounded-2xl border p-5 pl-6"
        style={{
          borderColor: alpha(c, 30),
          background: alpha(c, 6),
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 32px -18px rgba(0,0,0,0.8)",
        }}
      >
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-1"
          style={{ background: `linear-gradient(180deg, ${c}, ${alpha(c, 12)})` }}
        />
        <div className="relative flex items-center gap-3.5">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border"
            style={{ borderColor: alpha(c, 40), background: alpha(c, 12) }}
          >
            <span className="text-2xl font-black tabular-nums leading-none" style={{ color: c }}>
              {score.pending ? "·" : score.total == null ? "—" : score.total}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold" style={{ color: c }}>
              {score.pending
                ? `A fresh ${period === "week" ? "week" : period === "month" ? "month" : "period"}`
                : score.total == null ? "No data yet" : score.band.label}
            </p>
            <p className="text-[11px] leading-snug text-muted-foreground">
              {score.pending
                ? "Your score is still being calculated — it builds up as you log trades, tick your habits and do the work."
                : score.band.description}
            </p>
            {/* One simple bar, 0 → 100 */}
            {!score.pending && score.total != null && (
              <div className="mt-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted-foreground/12">
                  <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${score.total}%`, background: c }} />
                </div>
                <div className="mt-1 flex justify-between text-[9px] font-medium text-muted-foreground/70">
                  <span>0</span>
                  <span>Higher is better</span>
                  <span>100</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* The three parts + the work that lifts the score, side by side */}
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-3 md:grid-cols-2">
        <AccentPanel accent="primary" eyebrow="Breakdown" title="What makes up the score">
          <div className="mt-4 space-y-2">
          {score.components.map((comp) => {
            const meta = PART_META[comp.key];
            const has = comp.applicable && comp.value != null;
            const value = comp.value ?? 0;
            const accent = score.pending || !has ? "var(--muted-foreground)" : meta.accent;
            return (
              <div key={comp.key} className="rounded-lg border border-border bg-card px-3 py-2">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs font-semibold truncate">{meta.title}</p>
                  <span className="text-xs font-black tabular-nums shrink-0" style={{ color: accent }}>
                    {has ? `${value}%` : "—"}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted-foreground/12">
                  <div
                    className="h-full rounded-full transition-[width] duration-700"
                    style={{ width: `${has ? value : 0}%`, background: accent }}
                  />
                </div>
                <p className="mt-1 text-[10px] leading-snug text-muted-foreground">{meta.sub}</p>
              </div>
            );
          })}
          </div>
        </AccentPanel>

        <AccentPanel
          accent="cyan"
          eyebrow="Next steps"
          title="What lifts your score"
        >
          <div className="mt-4 space-y-1.5">
            {score.objectives.map((o) => {
              const done = o.rate >= 1;
              const capped = Math.min(o.progress, o.target);
              const pct = Math.round(o.rate * 100);
              return (
                <Link
                  key={o.key}
                  href={o.href}
                  className="block rounded-md border border-border/70 px-2.5 py-1.5 transition-colors hover:border-primary/30 hover:bg-muted/30"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] font-medium truncate">{o.label}</span>
                    <span className={cn("text-[10px] font-bold tabular-nums shrink-0", done ? "text-success" : "text-muted-foreground")}>
                      {capped}/{o.target}
                    </span>
                  </div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted-foreground/12">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: done ? "var(--color-success)" : TURQUOISE }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </AccentPanel>
      </div>
    </div>
  );
}
