"use client";

import { useMemo, useState } from "react";
import { ArrowRight, ChevronRight, Lightbulb, Wind, Zap } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EASE_OUT, rise } from "@/lib/motion";
import { thresholds } from "@/lib/trade-profile/config";
import { copy } from "@/lib/trade-profile/content/copy";
import { exerciseById, exercises } from "@/lib/trade-profile/content/exercises";
import { focusAreas } from "@/lib/trade-profile/content/focus-areas";
import { insights, type Drill } from "@/lib/trade-profile/content/insights";
import { referenceById } from "@/lib/trade-profile/content/references";
import { traitName } from "@/lib/trade-profile/content/traits";
import { daysBetween } from "@/lib/trade-profile/dates";
import { suggestedGoalFor } from "@/lib/trade-profile/focus";
import { buildProgram } from "@/lib/trade-profile/program";
import { domainOf } from "@/lib/trade-profile/types";
import { DifficultyPill, StatusPill, traitColor } from "@/components/trade-profile/primitives";
import { DrillSheet } from "@/components/trade-profile/for-your-type";
import { InlinePill } from "@/components/trade-profile/motion-bits";
import { useDerived, useTradeProfile } from "@/components/trade-profile/store";
import { useProfileNav } from "@/components/trade-profile/nav";

const RETEST_WEEKS = thresholds.retestWeeks as readonly number[];

/**
 * Today before there is a program. Two things: what the program would be
 * (the goal the profile points to, the first week's real challenges from the
 * same builder the program uses, the twelve weeks ahead), one click from
 * setting it; and something to do today regardless, a drill and a finding
 * that change daily.
 */
export function StartProgram() {
  const { profile, focus } = useDerived();
  const { todayKey } = useTradeProfile();
  const nav = useProfileNav();
  const [drill, setDrill] = useState<Drill | null>(null);
  const t = copy.today;
  const area = focus?.primary.id ?? "maintain";
  const goal = suggestedGoalFor(area);
  // The same builder the program uses, so the preview is the week the trader would get.
  const firstWeek = useMemo(() => (goal ? buildProgram(exercises, goal, area)[0]?.exerciseIds ?? [] : []), [goal, area]);
  if (!profile || !focus) return null;

  const content = insights[area];
  // A different drill and finding each day, the same all day.
  const dayIndex = Math.abs(daysBetween("2026-01-01", todayKey));
  const daily = content.drills[dayIndex % content.drills.length];
  const fact = content.facts[dayIndex % content.facts.length];
  const ref = referenceById[fact.ref];
  const current = goal ? (goal.trait.length === 1 ? profile.domains[goal.trait as keyof typeof profile.domains] : profile.facets[goal.trait as keyof typeof profile.facets]) : undefined;
  const color = goal ? traitColor[domainOf(goal.trait)] : "var(--primary)";

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start">
      {/* ── The program, one goal away ─────────────────────────── */}
      <motion.section {...rise(0)} className="relative overflow-hidden rounded-2xl border border-primary/25 bg-card p-5 sm:p-6">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: color }} />
        <h2 className="relative font-heading text-[clamp(1.4rem,2.4vw,1.9rem)] font-bold leading-tight tracking-[-0.025em] [text-wrap:balance]">{t.startTitle}</h2>
        <p className="relative mt-2 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">{t.startLead}</p>

        <div className="relative mt-5 rounded-xl border border-border/60 bg-background/40 p-4">
          <p className="text-[11px] font-semibold text-foreground/70">{t.suggested}</p>
          {goal ? (
            <>
              <p className="mt-1.5 font-heading text-lg font-bold tracking-tight">
                {copy.goal.directions[goal.direction]} {traitName(goal.trait)}
                {current !== undefined && <InlinePill code={domainOf(goal.trait)} value={current} />}
                {current !== undefined && <span className="text-sm font-semibold tabular-nums text-muted-foreground">{Math.round(current)}</span>}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{focusAreas[area].goalRationale}</p>
            </>
          ) : (
            <p className="mt-1.5 text-sm text-foreground/85">{t.noSuggestion}</p>
          )}
        </div>

        {firstWeek.length > 0 && (
          <div className="relative mt-4">
            <p className="text-[11px] font-semibold text-foreground/70">{t.firstWeek}</p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {firstWeek.map((id, i) => {
                const ex = exerciseById[id];
                return (
                  <motion.li key={id} initial={{ opacity: 0, transform: "translateY(6px)" }} animate={{ opacity: 1, transform: "translateY(0px)" }} transition={{ duration: 0.3, delay: 0.2 + i * 0.06, ease: EASE_OUT }}>
                    <button type="button" onClick={() => nav.openExercise(id)} className="group flex w-full items-center gap-3 rounded-xl border border-border/50 bg-background/30 p-3 text-left transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/35">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold group-hover:text-primary">{ex.title}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">{ex.frequency}, {ex.duration.toLowerCase()}</span>
                      </span>
                      <DifficultyPill level={ex.difficulty} />
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
                    </button>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        )}

        {/* The twelve weeks ahead, the first one lit, the retests marked. */}
        <div className="relative mt-5">
          <div className="grid grid-cols-12 gap-1" aria-hidden>
            {Array.from({ length: thresholds.programWeeks }, (_, i) => i + 1).map((w) => (
              <span key={w} className="relative">
                <span className="block h-1.5 overflow-hidden rounded-full bg-muted/70">
                  {w === 1 && <motion.span className="block h-full w-full origin-left rounded-full bg-primary shadow-[0_0_10px_rgba(20,184,166,.6)]" initial={{ transform: "scaleX(0)" }} animate={{ transform: "scaleX(1)" }} transition={{ duration: 0.5, delay: 0.3, ease: EASE_OUT }} />}
                </span>
                {RETEST_WEEKS.includes(w) && <span className="absolute -top-1.5 left-1/2 h-1 w-px -translate-x-1/2 bg-ice" />}
              </span>
            ))}
          </div>
          <p className="mt-2 flex justify-between text-[10px] text-muted-foreground"><span>{t.weeks}</span><span className="text-ice">{t.retests}</span></p>
        </div>

        <div className="relative mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button size="lg" className="group" onClick={() => nav.goTab("goal")}>
            {goal ? t.setGoal : t.chooseGoal} <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </Button>
          {goal && (
            <button type="button" onClick={() => nav.goTab("goal")} className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">{t.otherGoal}</button>
          )}
        </div>
      </motion.section>

      {/* ── Something to do today regardless ───────────────────── */}
      <aside className="min-w-0 space-y-3">
        <motion.div {...rise(1)}>
          <p className="font-heading text-sm font-bold tracking-tight">{t.meanwhile}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t.meanwhileLead}</p>
        </motion.div>

        <motion.button {...rise(2)} type="button" onClick={() => setDrill(daily)}
          className="group relative block w-full overflow-hidden rounded-2xl border border-border/60 bg-card p-4 text-left transition-[border-color,box-shadow] duration-300 hover:border-primary/35 hover:shadow-[0_18px_40px_-28px_rgba(20,184,166,.5)]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-primary">{t.drillOfDay}</span>
            <span className="text-[11px] text-muted-foreground">{daily.duration}</span>
          </div>
          <div className="mt-3 flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
              {daily.breath ? <Wind className="size-5" /> : <Zap className="size-5" />}
            </span>
            <span className="min-w-0">
              <span className="block font-heading text-[15px] font-bold tracking-tight">{daily.title}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{daily.when}</span>
            </span>
          </div>
          <span className={cn("mt-3 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-transform duration-200 group-hover:translate-x-0.5")}>
            {t.tryIt} <ArrowRight className="size-3" />
          </span>
        </motion.button>

        <motion.div {...rise(3)} className="rounded-2xl border border-border/60 bg-card p-4">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ice"><Lightbulb className="size-3.5" />{t.factOfDay}</p>
          <p className="mt-2 font-heading text-[15px] font-semibold leading-snug tracking-tight">{fact.text}</p>
          {ref && <div className="mt-2.5"><StatusPill status={ref.status} /></div>}
        </motion.div>
      </aside>

      <DrillSheet drill={drill} onClose={() => setDrill(null)} />
    </div>
  );
}
