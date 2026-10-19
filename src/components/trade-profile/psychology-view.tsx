"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, Wind, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { EASE_OUT, SPRING, rise } from "@/lib/motion";
import { CountUp } from "@/components/ui/count-up";
import { GrowBar } from "@/components/ui/grow-bar";
import { copy } from "@/lib/trade-profile/content/copy";
import { insights, type Drill } from "@/lib/trade-profile/content/insights";
import { traitName } from "@/lib/trade-profile/content/traits";
import { stateSeries } from "@/lib/trade-profile/progress";
import {
  FEARS, MIN_CASES, demoJournal, fearLevel, readFears, readPatterns,
  type FearId, type PatternId, type PatternReading, type PatternRecap, type PatternRuleCheck, type PatternTrade,
} from "@/lib/trade-profile/psychology";
import { domainOf } from "@/lib/trade-profile/types";
import { getAllTradeRuleChecks, getBestTradesOfDay, getTrades } from "@/lib/supabase/queries";
import { StateLine } from "@/components/trade-profile/charts";
import { traitColor } from "@/components/trade-profile/primitives";
import { DrillSheet } from "@/components/trade-profile/for-your-type";
import { useDerived, useTradeProfile } from "@/components/trade-profile/store";

type Journal = { trades: PatternTrade[]; ruleChecks: PatternRuleCheck[]; recaps: PatternRecap[] };

const LEVEL_COLOR = { low: "var(--win)", moderate: "var(--be)", elevated: "var(--loss)" } as const;
const PATTERN_ORDER: PatternId[] = ["quickReentry", "rulesAfterLoss", "overtrading", "missedBetter", "badAfterLoss"];
/** For "rules kept", higher is better; for the rest, higher is the pressure showing. */
const HIGHER_IS_BETTER: Partial<Record<PatternId, boolean>> = { rulesAfterLoss: true };

/** The trader's journal: their own trades when signed in, a matching sample in the demo. */
function useJournal(): Journal | null {
  const { demo, todayKey } = useTradeProfile();
  const demoData = useMemo(() => (demo ? demoJournal(demo.personaId, todayKey) : null), [demo, todayKey]);
  const [live, setLive] = useState<Journal | null>(null);
  useEffect(() => {
    if (demo) return;
    let active = true;
    Promise.all([getTrades(), getAllTradeRuleChecks(), getBestTradesOfDay()])
      .then(([trades, ruleChecks, recaps]) => {
        if (!active) return;
        setLive({
          trades: trades.map((t) => ({ id: t.id, date_time: t.date_time, result: t.result, execution_time: t.execution_time, execution_end_time: t.execution_end_time, execution_quality: t.execution_quality })),
          ruleChecks: ruleChecks.map((c) => ({ trade_id: c.trade_id, status: c.status })),
          recaps: recaps.map((r) => ({ date: r.date, taken_was_best: r.taken_was_best, review_step: r.review_step })),
        });
      })
      .catch(() => { if (active) setLive({ trades: [], ruleChecks: [], recaps: [] }); });
    return () => { active = false; };
  }, [demo]);
  return demoData ?? live;
}

/**
 * Psychology: the fears and pressure points the profile is prone to, each
 * read twice: what the facet scores suggest, and what the trader's own journal
 * shows around it. Selecting a fear shows both side by side with the drills
 * that address it.
 */
export function PsychologyView() {
  const { state, demo, todayKey } = useTradeProfile();
  const { profile, focus } = useDerived();
  const journal = useJournal();
  const t = copy.psychology;
  const type = focus?.primary.id ?? "maintain";
  const fears = useMemo(() => (profile ? readFears(profile, type) : []), [profile, type]);
  const patterns = useMemo(() => (journal ? readPatterns(journal, todayKey) : null), [journal, todayKey]);
  const [picked, setPicked] = useState<FearId | null>(null);
  const [drill, setDrill] = useState<Drill | null>(null);
  if (!profile || !fears.length) return null;

  const selected = fears.find((f) => f.fear.id === picked) ?? fears[0];
  const series = state.programStart ? stateSeries(state.checkins, state.programStart).filter((p) => p.date <= todayKey) : [];

  return (
    <div className="space-y-4">
      <motion.header {...rise(0)} className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold tracking-tight">{t.title}</h2>
          <p className="mt-1 max-w-[62ch] text-sm text-muted-foreground">{t.lead}</p>
        </div>
        {demo && <p className="text-[11px] text-muted-foreground">{t.demoJournal}</p>}
      </motion.header>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)]">
        {/* ── The fears, the type's own first ──────────────────────── */}
        <motion.section {...rise(1)} className="rounded-2xl border border-border/60 bg-card p-4" aria-label={t.fears}>
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-heading text-sm font-bold tracking-tight">{t.fears}</h3>
            <span className="text-[11px] text-muted-foreground">{t.fearsHint}</span>
          </div>
          <ul className="-mx-2 mt-2 space-y-0.5">
            {fears.map(({ fear, intensity, ofType }, i) => {
              const on = fear.id === selected.fear.id;
              const level = fearLevel(intensity);
              return (
                <motion.li key={fear.id} initial={{ opacity: 0, transform: "translateX(-8px)" }} animate={{ opacity: 1, transform: "translateX(0px)" }} transition={{ duration: 0.3, delay: 0.1 + i * 0.05, ease: EASE_OUT }}>
                  <button type="button" onClick={() => setPicked(fear.id)} aria-pressed={on} className="relative isolate flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left">
                    {on && <motion.span layoutId="psych-fear" className="absolute inset-0 -z-10 rounded-xl border border-white/[0.08] bg-muted/40" transition={SPRING} />}
                    <Ring value={intensity} color={LEVEL_COLOR[level]} delay={0.15 + i * 0.05} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold tracking-tight">{t.fearsText[fear.id].title}</span>
                        {ofType && <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-primary">{t.ofType}</span>}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">{t.fearsText[fear.id].atScreen}</span>
                    </span>
                    <span className="shrink-0 text-[11px] font-semibold" style={{ color: LEVEL_COLOR[level] }}>{t.levels[level]}</span>
                  </button>
                </motion.li>
              );
            })}
          </ul>
        </motion.section>

        {/* ── The selected fear, read twice ────────────────────────── */}
        <motion.section {...rise(2)} className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 sm:p-5" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={selected.fear.id} initial={{ opacity: 0, transform: "translateY(6px)" }} animate={{ opacity: 1, transform: "translateY(0px)" }} exit={{ opacity: 0, transition: { duration: 0.1 } }} transition={{ duration: 0.22, ease: EASE_OUT }}>
              <h3 className="font-heading text-[clamp(1.3rem,2vw,1.6rem)] font-bold tracking-tight">{t.fearsText[selected.fear.id].title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.fearsText[selected.fear.id].atScreen}</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/50 bg-background/30 p-3.5">
                  <p className="text-[11px] font-semibold text-foreground/70">{t.profileSignal}</p>
                  <p className="mt-1 font-heading text-3xl font-bold tabular-nums" style={{ color: LEVEL_COLOR[fearLevel(selected.intensity)] }}>
                    <CountUp value={selected.intensity} duration={0.7} changeDuration={0.35} />
                    <span className="ml-1.5 text-sm font-semibold">{t.levels[fearLevel(selected.intensity)]}</span>
                  </p>
                  <p className="mt-2 text-[10px] text-muted-foreground">{t.drivenBy}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {selected.fear.facets.map(({ facet, dir }) => {
                      const color = traitColor[domainOf(facet)];
                      return (
                        <span key={facet} className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px]" style={{ borderColor: `color-mix(in oklch, ${color} 40%, transparent)`, background: `color-mix(in oklch, ${color} 10%, transparent)` }}>
                          <span className="size-1.5 rounded-full" style={{ background: color }} />
                          {dir === "high" ? "High" : "Low"} {traitName(facet)}
                          <span className="font-bold tabular-nums">{Math.round(profile.facets[facet] ?? 0)}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
                <PatternCard reading={patterns?.[selected.fear.pattern] ?? null} loading={!patterns} />
              </div>

              <p className="mt-4 text-[11px] font-semibold text-foreground/70">{t.helps}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {insights[selected.fear.types.includes(type) ? type : selected.fear.types[0]].drills.map((d) => (
                  <button key={d.id} type="button" onClick={() => setDrill(d)} className="group flex items-start gap-2.5 rounded-xl border border-border/50 bg-background/30 p-2.5 text-left transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/35">
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">{d.breath ? <Wind className="size-3.5" /> : <Zap className="size-3.5" />}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold group-hover:text-primary">{d.title}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><Clock className="size-2.5" />{d.duration}</span>
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.section>
      </div>

      {/* ── Every pattern at a glance ───────────────────────────────── */}
      <motion.section {...rise(3)} aria-label={t.patterns}>
        <div className="mb-2.5 flex items-baseline justify-between gap-3">
          <h3 className="font-heading text-sm font-bold tracking-tight">{t.patterns}</h3>
          <span className="text-[11px] text-muted-foreground">{t.patternsHint}</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {PATTERN_ORDER.map((id, i) => {
            const reading = patterns?.[id] ?? null;
            const fear = FEARS.find((f) => f.pattern === id)!;
            const on = fear.id === selected.fear.id;
            const value = reading?.value ?? null;
            return (
              <motion.button key={id} type="button" onClick={() => setPicked(fear.id)}
                initial={{ opacity: 0, transform: "translateY(8px)" }} animate={{ opacity: 1, transform: "translateY(0px)" }} transition={{ duration: 0.3, delay: 0.25 + i * 0.05, ease: EASE_OUT }}
                className={cn("rounded-2xl border bg-card p-3.5 text-left transition-[border-color,transform] duration-200 hover:-translate-y-0.5", on ? "border-primary/40" : "border-border/60 hover:border-border")}>
                <p className="truncate text-[11px] font-semibold text-foreground/75">{t.patternTitle[id]}</p>
                <p className="mt-1 font-heading text-2xl font-bold tabular-nums">
                  {value === null ? <span className="text-base text-muted-foreground">n/a</span> : <CountUp value={Math.round(value * 100)} format={(n) => `${Math.round(n)}%`} />}
                </p>
                <GrowBar className="mt-2 h-1 bg-muted/50" fillClassName={value === null ? "bg-muted-foreground/30" : HIGHER_IS_BETTER[id] ? "bg-win" : "bg-primary"} value={value ?? 0} delay={0.3 + i * 0.05} />
                <p className="mt-1.5 text-[10px] text-muted-foreground">{reading ? t.cases(reading.n) : t.loading}</p>
              </motion.button>
            );
          })}
        </div>
      </motion.section>

      {series.length > 1 && (
        <motion.section {...rise(4)} className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-heading text-sm font-bold tracking-tight">{t.trend}</h3>
            <span className="text-[11px] text-muted-foreground">{t.trendHint}</span>
          </div>
          <div className="mt-3"><StateLine data={series} /></div>
        </motion.section>
      )}

      <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">{t.disclaimer}</p>
      <DrillSheet drill={drill} onClose={() => setDrill(null)} />
    </div>
  );
}

/** The journal side of a fear: the figure, the comparison where there is one, and what it means. */
function PatternCard({ reading, loading }: { reading: PatternReading | null; loading: boolean }) {
  const t = copy.psychology;
  if (loading || !reading) {
    return <div className="rounded-xl border border-border/50 bg-background/30 p-3.5"><p className="text-[11px] font-semibold text-foreground/70">{t.journalSignal}</p><div className="mt-2 h-16 animate-pulse rounded-lg bg-muted/30" /></div>;
  }
  const pct = reading.value === null ? null : Math.round(reading.value * 100);
  const baseline = reading.baseline === null ? null : Math.round(reading.baseline * 100);
  const baselineText = reading.id === "rulesAfterLoss" ? t.baseline.rulesAfterLoss : reading.id === "badAfterLoss" ? t.baseline.badAfterLoss : null;
  return (
    <div className="rounded-xl border border-border/50 bg-background/30 p-3.5">
      <p className="text-[11px] font-semibold text-foreground/70">{t.journalSignal}</p>
      {pct === null ? (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t.notEnough(MIN_CASES)}</p>
      ) : (
        <>
          <p className="mt-1 font-heading text-3xl font-bold tabular-nums"><CountUp value={pct} format={(n) => `${Math.round(n)}%`} duration={0.7} changeDuration={0.35} /></p>
          <p className="mt-1 text-xs leading-relaxed text-foreground/85">{t.patternText[reading.id](pct)}</p>
          <GrowBar className="mt-2 h-1.5 bg-muted/50" fillClassName={HIGHER_IS_BETTER[reading.id] ? "bg-win" : "bg-primary"} value={pct / 100} />
          {baseline !== null && baselineText && (
            <>
              <GrowBar className="mt-1.5 h-1.5 bg-muted/50" fillClassName="bg-muted-foreground/50" value={baseline / 100} delay={0.15} />
              <p className="mt-1 text-[10px] text-muted-foreground">{baselineText(baseline)}</p>
            </>
          )}
          <p className="mt-1 text-[10px] text-muted-foreground">{t.cases(reading.n)}</p>
        </>
      )}
    </div>
  );
}

/** A small ring filled to a 0..100 value. */
function Ring({ value, color, delay = 0 }: { value: number; color: string; delay?: number }) {
  return (
    <span className="relative grid size-10 shrink-0 place-items-center">
      <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="3.5" className="text-muted/60" />
        <motion.circle cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: Math.max(0.02, value / 100) }} transition={{ duration: 0.8, delay, ease: EASE_OUT }} />
      </svg>
      <span className="text-[10px] font-bold tabular-nums">{value}</span>
    </span>
  );
}
