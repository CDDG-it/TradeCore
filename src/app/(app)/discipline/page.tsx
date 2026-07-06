import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Target, ListChecks, Repeat, ArrowRight, Brain, Activity, TrendingUp, ExternalLink } from "lucide-react";
import { DISCIPLINE_WEIGHTS } from "@/lib/discipline";

export const metadata: Metadata = {
  title: "How discipline works · Tradecore",
};

const TRADE_PCT = Math.round(DISCIPLINE_WEIGHTS.tradeRules * 100);
const HABIT_PCT = Math.round(DISCIPLINE_WEIGHTS.habits * 100);

// The research backing the score, framed for traders. Sources summarised from
// "Samenvatting: Psychologie van Traders".
const SCIENCE = [
  {
    icon: Target,
    title: "Discipline beats raw talent",
    body: "Duckworth and Seligman found self-discipline predicted performance more than twice as strongly as IQ. For a trader that means sticking to your process, day after day, matters more than any single clever read.",
    source: "Duckworth & Seligman (2005), Psychological Science",
    href: "https://journals.sagepub.com/doi/10.1111/j.1467-9280.2005.01641.x",
  },
  {
    icon: Brain,
    title: "Your edge is impulse control",
    body: "Thoma and colleagues found traders outscore others on the Cognitive Reflection Test: they are better at overriding a fast, wrong gut reaction in favour of a considered one. That is exactly the muscle a per-trade rule checklist trains.",
    source: "Thoma et al. (2015), PLOS ONE",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4395391/",
  },
  {
    icon: Repeat,
    title: "Habits build slowly, so consistency is the point",
    body: "Lally and colleagues showed automaticity grows along a curve that flattens into a plateau, with no fixed number of days and large differences per person. Showing up on every applicable day is what actually moves that curve, which is why habits are scored across the whole period and not just today.",
    source: "Lally et al. (2010), European Journal of Social Psychology",
    href: "https://onlinelibrary.wiley.com/doi/10.1002/ejsp.674",
  },
  {
    icon: Activity,
    title: "Stress is physical and measurable",
    body: "A study of 55 professional traders wearing wristband sensors found their bodily stress signals moved with the market and with their own trades. Sleep, recovery and routine habits are what keep that arousal in check so you can execute cleanly, which is why lifestyle habits belong in the score.",
    source: "Psychophysiological study (2022), PLOS ONE",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9312384/",
  },
] as const;

export default function DisciplinePage() {
  return (
    <div className="w-full space-y-10">
      {/* Header */}
      <div>
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
        </Link>
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/12 shrink-0">
            <Target className="w-7 h-7 text-primary" />
          </span>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">How your Discipline Score works</h1>
            <p className="text-base text-muted-foreground mt-1">Part trading process, part daily habits.</p>
          </div>
        </div>
      </div>

      <p className="text-base md:text-lg leading-relaxed text-muted-foreground max-w-4xl">
        Discipline is not only what happens at the screen. It is the whole routine around your trading.
        Your score blends the two things you actually control, over the selected week or month.
      </p>

      {/* The two components */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="rounded-2xl p-6 sm:p-7 border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12">
              <ListChecks className="w-5 h-5 text-primary" />
            </span>
            <span className="text-3xl font-black tabular-nums text-primary">{TRADE_PCT}%</span>
          </div>
          <h2 className="text-lg font-bold">Trade rules</h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            The average of your per-trade discipline checklist. These are the rules you tick off on each
            trade, like followed the plan, respected risk, no impulsive entries, plus your own custom rules.
            This is what happens at the screen, so it stays the dominant signal.
          </p>
        </div>

        <div className="rounded-2xl p-6 sm:p-7 border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/12">
              <Repeat className="w-5 h-5 text-success" />
            </span>
            <span className="text-3xl font-black tabular-nums text-success">{HABIT_PCT}%</span>
          </div>
          <h2 className="text-lg font-bold">Habits</h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            How consistently you complete your habits, measured across <span className="text-foreground font-medium">every
            applicable day</span> in the period. It respects each habit&apos;s daily, weekday or weekend schedule, so showing
            up consistently scores higher than cramming it all into one day.
          </p>
        </div>
      </div>

      {/* Formula */}
      <div className="rounded-2xl p-6 sm:p-8 text-center bg-muted/40 border border-border">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">The formula</p>
        <p className="text-base md:text-xl font-semibold">
          Discipline&nbsp;=&nbsp;
          <span className="text-primary">{TRADE_PCT}% × trade-rule adherence</span>
          &nbsp;+&nbsp;
          <span className="text-success">{HABIT_PCT}% × habit completion</span>
        </p>
        <p className="text-sm text-muted-foreground mt-4 max-w-2xl mx-auto leading-relaxed">
          Trade rules dominate on purpose. Habits nudge the score, they never overpower your actual trading
          process. If one side has no data yet, say no habits set or no scored trades in the period, the other
          stands alone, so you are never punished for a dimension we cannot measure yet.
        </p>
      </div>

      {/* Why habits matter */}
      <div className="rounded-2xl p-6 sm:p-8 bg-primary/6 border border-primary/20">
        <p className="text-sm font-semibold uppercase tracking-wider mb-3 text-primary">
          Why habits make you a better trader
        </p>
        <p className="text-base text-muted-foreground leading-relaxed max-w-4xl">
          Sleep, preparation, journaling and review habits are what keep your decisions stable. A rested, prepared
          trader takes fewer impulsive entries, respects risk, and sticks to the plan when it matters most. The
          discipline you build away from the charts is exactly what shows up on them, which is why habits are part
          of the score rather than a separate box to tick.
        </p>
      </div>

      {/* The science */}
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">The science behind it</h2>
        </div>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-3xl">
          This weighting is not arbitrary. It leans on research into what actually separates strong performers,
          and on how discipline and habits are built. Here is why it matters for traders.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SCIENCE.map((s) => (
            <div key={s.title} className="rounded-2xl p-6 border border-border bg-card flex flex-col">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 mb-4">
                <s.icon className="w-5 h-5 text-primary" />
              </span>
              <h3 className="text-base font-bold">{s.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed flex-1">{s.body}</p>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                {s.source}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Links to the two inputs */}
      <div className="flex flex-wrap gap-3">
        <Link href="/habits" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold transition-colors hover:border-primary/40 hover:text-primary">
          Go to Habits <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <Link href="/journal/new" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold transition-colors hover:border-primary/40 hover:text-primary">
          Log a trade with rules <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
