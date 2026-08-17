"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Target, Flame, ClipboardCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getTrades, getHabits, getHabitCompletions, getPsychEdgeSessions, getBestTradesOfDay, getWeeklyTradeReviews, getAnalyses,
} from "@/lib/supabase/queries";
import {
  bandColorFor, computeMindScoreAll,
  type MindPeriod, type MindScore, type MindInputs, type MindComponent,
} from "@/lib/mind-score/mind-score";

const TURQUOISE = "#14B8A6";
const alpha = (c: string, pct: number) => `color-mix(in oklch, ${c} ${pct}%, transparent)`;

const PERIOD_LABEL: Record<MindPeriod, string> = { week: "This week", month: "This month", all: "All time" };

/** Plain-language identity for each of the three parts of the score.
 *  No weights, no "points" — just what it means and how it feels. */
const PART_META: Record<MindComponent["key"], { icon: typeof Target; title: string; sub: string; accent: string }> = {
  rules:      { icon: Target,         title: "Following your rules", sub: "Sticking to your plan on every trade",     accent: "#14B8A6" },
  habits:     { icon: Flame,          title: "Daily habits",         sub: "The routines you keep away from the charts", accent: "#06B6D4" },
  objectives: { icon: ClipboardCheck, title: "Doing the work",       sub: "Reviews, prep and logging your best trade",  accent: "#14B8A6" },
};

/** The MC Mindscore — deliberately simple: one big number, one bar, and three
 *  plain-language parts that show what lifts it. Self-loading, drops into a tab. */
export function MindScoreBreakdown() {
  const [data, setData] = useState<MindInputs | null>(null);
  const [period, setPeriod] = useState<MindPeriod>("month");

  useEffect(() => {
    Promise.all([
      getTrades(), getHabits(), getHabitCompletions(),
      getPsychEdgeSessions(), getBestTradesOfDay(), getWeeklyTradeReviews(), getAnalyses(),
    ]).then(([trades, habits, completions, psychSessions, bestTrades, weeklyReviews, analyses]) => {
      setData({ trades, habits, completions, psychSessions, bestTrades, weeklyReviews, analyses });
    }).catch(() => setData({ trades: [], habits: [], completions: [], psychSessions: [], bestTrades: [], weeklyReviews: [], analyses: [] }));
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

  return (
    <div className="space-y-4">
      {/* Pick a period — each shows its own score */}
      <div className="grid grid-cols-3 gap-2.5">
        {(["week", "month", "all"] as MindPeriod[]).map((p) => {
          const s = scores[p];
          const active = period === p;
          const c = s.pending ? TURQUOISE : bandColorFor(s.total);
          return (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left transition-colors",
                active ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30 hover:bg-muted/30"
              )}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{PERIOD_LABEL[p]}</p>
              <span className="text-2xl font-black tabular-nums leading-none" style={{ color: c }}>
                {s.pending ? "·" : s.total == null ? "—" : s.total}
              </span>
            </button>
          );
        })}
      </div>

      {/* Hero — the one number, or a friendly "just getting started" note */}
      {score.pending ? <PendingHero period={period} /> : <ScoreHero score={score} />}

      {/* What makes up the score — three plain-language parts */}
      <ScoreParts score={score} muted={score.pending} />

      {/* The work that lifts it */}
      <ObjectivesList score={score} />
    </div>
  );
}

/* ── Hero: the score, big and clear ───────────────────────────────────── */
function ScoreHero({ score }: { score: MindScore }) {
  const c = bandColorFor(score.total);
  const pct = score.total ?? 0;
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border"
          style={{ borderColor: alpha(c, 40), background: alpha(c, 10) }}
        >
          <span className="text-3xl font-black tabular-nums leading-none" style={{ color: c }}>
            {score.total == null ? "—" : score.total}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold" style={{ color: c }}>{score.total == null ? "No data yet" : score.band.label}</p>
          <p className="text-xs text-muted-foreground leading-snug mt-0.5">{score.band.description}</p>
        </div>
      </div>

      {/* One simple bar, 0 → 100 */}
      <div className="mt-4">
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted-foreground/12">
          <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, background: c }} />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] font-medium text-muted-foreground/70">
          <span>0</span>
          <span>Higher is better</span>
          <span>100</span>
        </div>
      </div>
    </div>
  );
}

/* ── Hero: fresh period, nothing logged yet ───────────────────────────── */
function PendingHero({ period }: { period: MindPeriod }) {
  const label = period === "week" ? "week" : period === "month" ? "month" : "period";
  return (
    <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5">
      <div className="flex items-center gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border"
          style={{ borderColor: alpha(TURQUOISE, 40), background: alpha(TURQUOISE, 12) }}
        >
          <Sparkles className="h-7 w-7" style={{ color: TURQUOISE }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold" style={{ color: TURQUOISE }}>A fresh {label}</p>
          <p className="text-xs text-muted-foreground leading-snug mt-0.5">
            Your score is still being calculated — it builds up as you log trades,
            tick your habits and do the work. Nothing to worry about yet.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── The three parts, in plain language ───────────────────────────────── */
function ScoreParts({ score, muted }: { score: MindScore; muted: boolean }) {
  return (
    <div className="space-y-2.5">
      {score.components.map((comp) => {
        const meta = PART_META[comp.key];
        const Icon = meta.icon;
        const has = comp.applicable && comp.value != null;
        const value = comp.value ?? 0;
        const accent = muted || !has ? "var(--muted-foreground)" : meta.accent;
        return (
          <div key={comp.key} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: has && !muted ? alpha(meta.accent, 12) : "var(--muted)" }}
            >
              <Icon className="h-5 w-5" style={{ color: accent }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold truncate">{meta.title}</p>
                <span className="text-sm font-black tabular-nums shrink-0" style={{ color: accent }}>
                  {has ? `${value}%` : "—"}
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted-foreground/12">
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{ width: `${has ? value : 0}%`, background: accent }}
                />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground leading-snug">{meta.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Objectives — a simple checklist of the work that lifts the score ──── */
function ObjectivesList({ score }: { score: MindScore }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-sm font-semibold mb-2.5">What lifts your score</p>
      <div className="space-y-2">
        {score.objectives.map((o) => {
          const done = o.rate >= 1;
          const capped = Math.min(o.progress, o.target);
          return (
            <Link
              key={o.key}
              href={o.href}
              className="flex items-center gap-3 rounded-lg border border-border/70 px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-muted/30"
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold",
                  done ? "border-transparent text-white" : "border-border text-muted-foreground"
                )}
                style={done ? { background: "#22c55e" } : undefined}
              >
                {done ? "✓" : capped}
              </span>
              <span className="text-sm font-medium flex-1 truncate">{o.label}</span>
              <span className={cn("text-xs font-bold tabular-nums shrink-0", done ? "text-success" : "text-muted-foreground")}>
                {capped}/{o.target}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
