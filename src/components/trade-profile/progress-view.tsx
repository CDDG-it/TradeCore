"use client";

import { ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { EASE_OUT, rise } from "@/lib/motion";
import { CountUp } from "@/components/ui/count-up";
import { copy } from "@/lib/trade-profile/content/copy";
import { weeklyQuestions } from "@/lib/trade-profile/content/reflection";
import { traitName } from "@/lib/trade-profile/content/traits";
import { items } from "@/lib/trade-profile/items";
import { completionRate, retestDiff, stateSeries, streak } from "@/lib/trade-profile/progress";
import { scoreProfile } from "@/lib/trade-profile/scoring";
import { domainOf } from "@/lib/trade-profile/types";
import { StateLine } from "@/components/trade-profile/charts";
import { Tile } from "@/components/trade-profile/primitives";
import { useDerived, useTradeProfile } from "@/components/trade-profile/store";
import { useProfileNav } from "@/components/trade-profile/nav";

export function ProgressView() {
  const { state, todayKey } = useTradeProfile();
  const { profile, goalTarget } = useDerived();
  const nav = useProfileNav();
  const t = copy.progress;
  if (!state.programStart || !goalTarget) return <Tile><p className="text-sm text-muted-foreground">{t.noProgram}</p></Tile>;

  const start = state.programStart;
  const series = stateSeries(state.checkins, start).filter((p) => p.date <= todayKey);
  const rate = completionRate(state.checkins, start, todayKey);
  const s = streak(state.checkins, todayKey);
  const domain = domainOf(goalTarget.trait);
  const reflections = Object.entries(state.reflections).sort(([a], [b]) => Number(b) - Number(a));

  const card = "group rounded-2xl border border-border/60 bg-card transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_18px_40px_-28px_rgba(20,184,166,.45)]";

  /* A gapless bento on wide screens: completion and streak stack beside the
     chart (two rows tall), then retests beside the reflections. Three columns
     by three rows, every cell filled. */
  return (
    <div className="grid gap-4 lg:grid-flow-dense lg:grid-cols-3">
      <motion.section {...rise(0)} className={`${card} p-5`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">{t.completion}</p>
            <p className="mt-1 font-heading text-4xl font-bold tabular-nums tracking-tight"><CountUp value={Math.round(rate * 100)} format={(n) => `${Math.round(n)}%`} /></p>
          </div>
          <Ring value={rate} />
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{t.completionHint}</p>
      </motion.section>

      <motion.section {...rise(1)} className={`${card} flex flex-col p-5 lg:col-span-2 lg:row-span-2`}>
        <h2 className="font-heading text-sm font-bold tracking-tight">{t.stateChart}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{t.stateChartHint}</p>
        <div className="mt-4 flex min-h-56 flex-1 flex-col justify-end">{series.length ? <StateLine data={series} /> : <p className="py-12 text-center text-sm text-muted-foreground">{t.empty}</p>}</div>
      </motion.section>

      <motion.section {...rise(2)} className={`${card} grid grid-cols-2 divide-x divide-border/50`}>
        <div className="p-5">
          <p className="text-xs text-muted-foreground">{t.streak}</p>
          <p className="mt-1 font-heading text-3xl font-bold tabular-nums tracking-tight">
            <CountUp value={s} />
            <span className="ml-1 text-sm font-medium text-muted-foreground">{t.streakUnit(s)}</span>
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs text-muted-foreground">{t.checkins}</p>
          <p className="mt-1 font-heading text-3xl font-bold tabular-nums tracking-tight"><CountUp value={series.length} /></p>
        </div>
      </motion.section>

        <motion.section {...rise(3)} className={`${card} p-5`}>
          <h3 className="font-heading text-sm font-bold tracking-tight">{t.retests}</h3>
          {state.retests.length > 0 && profile ? (
            <ul className="-mx-2 mt-2">
              {state.retests.map((r) => {
                const row = retestDiff(profile, scoreProfile(items, r.answers), domain)[0];
                return (
                  <li key={r.week}>
                    <button type="button" onClick={() => nav.openRetest(r.week)} className="group/row flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-left text-sm transition-colors hover:bg-muted/30">
                      <span className="font-medium">{copy.retest.title(r.week)}</span>
                      <span className="inline-flex items-center gap-2 tabular-nums text-muted-foreground">
                        {row && (
                          <>
                            {Math.round(row.before)} → <span className="font-semibold text-foreground">{Math.round(row.after)}</span>
                          </>
                        )}
                        <ChevronRight className="size-4 transition-transform duration-200 group-hover/row:translate-x-0.5" />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{t.retestsEmpty(traitName(domain))}</p>
          )}
        </motion.section>

        <motion.section {...rise(4)} className={`${card} p-5 lg:col-span-2`}>
          <h3 className="font-heading text-sm font-bold tracking-tight">{t.reflections}</h3>
          {reflections.length > 0 ? (
            <div className="mt-3 grid gap-x-8 divide-y divide-border/50 md:grid-cols-2 md:divide-y-0">
              {reflections.map(([w, r]) => (
                <div key={w} className="py-3 first:pt-0 last:pb-0">
                  <button type="button" onClick={() => nav.openReflection(Number(w))} className="text-sm font-semibold hover:text-primary">
                    {copy.reflection.title(Number(w))}
                  </button>
                  <dl className="mt-1.5 space-y-1.5 text-xs">
                    {weeklyQuestions.map((q, i) => (
                      <div key={q}>
                        <dt className="text-muted-foreground">{q}</dt>
                        <dd className="mt-0.5 text-foreground/85">{r.answers[i] || "-"}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{t.reflectionsEmpty}</p>
          )}
        </motion.section>
    </div>
  );
}

/** Completion as a ring that fills to its share when the section opens. */
function Ring({ value }: { value: number }) {
  const r = 22;
  return (
    <svg viewBox="0 0 56 56" className="size-16 -rotate-90" aria-hidden>
      <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-muted/70" />
      {value > 0 && (
        <motion.circle cx="28" cy="28" r={r} fill="none" stroke="var(--primary)" strokeWidth="5" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: Math.min(1, value) }} transition={{ duration: 1, delay: 0.2, ease: EASE_OUT }} />
      )}
    </svg>
  );
}
