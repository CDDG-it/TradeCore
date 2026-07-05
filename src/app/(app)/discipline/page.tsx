import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Target, ListChecks, Repeat, ArrowRight } from "lucide-react";
import { DISCIPLINE_WEIGHTS } from "@/lib/discipline";

export const metadata: Metadata = {
  title: "How discipline works — Tradecore",
};

const TRADE_PCT = Math.round(DISCIPLINE_WEIGHTS.tradeRules * 100);
const HABIT_PCT = Math.round(DISCIPLINE_WEIGHTS.habits * 100);

export default function DisciplinePage() {
  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
        </Link>
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: "oklch(0.72 0.22 45 / 0.12)" }}
          >
            <Target className="w-5 h-5" style={{ color: "oklch(0.72 0.22 45)" }} />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">How your Discipline Score works</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Part trading process, part daily habits.</p>
          </div>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        Discipline isn&apos;t only what happens at the screen — it&apos;s the whole routine around your trading.
        Your score blends the two things you actually control, over the selected week or month:
      </p>

      {/* The two components */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5 border border-border/60 bg-card">
          <div className="flex items-center justify-between mb-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "oklch(0.72 0.22 45 / 0.12)" }}>
              <ListChecks className="w-4 h-4" style={{ color: "oklch(0.72 0.22 45)" }} />
            </span>
            <span className="text-lg font-black tabular-nums" style={{ color: "oklch(0.72 0.22 45)" }}>{TRADE_PCT}%</span>
          </div>
          <h2 className="text-sm font-bold">Trade rules</h2>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            The average of your per-trade discipline checklist — the rules you tick off on each trade
            (followed the plan, respected risk, no impulsive entries, and your own custom rules). This is
            what happens at the screen, so it stays the dominant signal.
          </p>
        </div>

        <div className="rounded-2xl p-5 border border-border/60 bg-card">
          <div className="flex items-center justify-between mb-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "oklch(0.58 0.17 145 / 0.12)" }}>
              <Repeat className="w-4 h-4" style={{ color: "oklch(0.58 0.17 145)" }} />
            </span>
            <span className="text-lg font-black tabular-nums" style={{ color: "oklch(0.58 0.17 145)" }}>{HABIT_PCT}%</span>
          </div>
          <h2 className="text-sm font-bold">Habits</h2>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            How consistently you complete your habits — measured across <span className="text-foreground font-medium">every
            applicable day</span> in the period (respecting each habit&apos;s daily / weekday / weekend schedule), so showing
            up consistently scores higher than cramming it all into one day.
          </p>
        </div>
      </div>

      {/* Formula */}
      <div className="rounded-2xl p-5 text-center" style={{ background: "oklch(0.10 0.003 28)", border: "1px solid oklch(0.18 0.005 28)" }}>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">The formula</p>
        <p className="text-sm font-semibold">
          Discipline&nbsp;=&nbsp;
          <span style={{ color: "oklch(0.72 0.22 45)" }}>{TRADE_PCT}% × trade-rule adherence</span>
          &nbsp;+&nbsp;
          <span style={{ color: "oklch(0.58 0.17 145)" }}>{HABIT_PCT}% × habit completion</span>
        </p>
        <p className="text-xs text-muted-foreground mt-3 max-w-xl mx-auto leading-relaxed">
          Trade rules dominate on purpose — habits nudge the score, they never overpower your actual trading process.
          If one side has no data yet (no habits set, or no scored trades in the period), the other stands alone —
          you&apos;re never punished for a dimension we can&apos;t measure yet.
        </p>
      </div>

      {/* Why habits matter */}
      <div className="rounded-2xl p-6" style={{ background: "oklch(0.72 0.22 45 / 0.06)", border: "1px solid oklch(0.72 0.22 45 / 0.20)" }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: "oklch(0.72 0.22 45)" }}>
          Why habits make you a better trader
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Sleep, preparation, journaling and review habits are what keep your decisions stable. A rested, prepared
          trader takes fewer impulsive entries, respects risk, and sticks to the plan when it matters most. The
          discipline you build away from the charts is exactly what shows up on them — that&apos;s why habits are part
          of the score, not a separate box to tick.
        </p>
      </div>

      {/* Links to the two inputs */}
      <div className="flex flex-wrap gap-3">
        <Link href="/habits" className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-4 py-2.5 text-sm font-semibold transition-colors hover:border-primary/40 hover:text-primary">
          Go to Habits <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <Link href="/journal/new" className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-4 py-2.5 text-sm font-semibold transition-colors hover:border-primary/40 hover:text-primary">
          Log a trade with rules <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
