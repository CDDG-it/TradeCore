"use client";

import { ChevronRight } from "lucide-react";
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

  const stats = [
    { label: t.completion, value: `${Math.round(rate * 100)}%` },
    { label: t.streak, value: s, unit: t.streakUnit(s) },
    { label: t.checkins, value: series.length },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start">
      <div className="min-w-0 space-y-4">
        {/* One strip, three numbers: no card per stat. */}
        <section className="grid grid-cols-3 divide-x divide-border/50 rounded-2xl border border-border/60 bg-card">
          {stats.map((x) => (
            <div key={x.label} className="px-4 py-4 sm:px-5">
              <p className="text-xs text-muted-foreground">{x.label}</p>
              <p className="mt-1 font-heading text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">
                {x.value}
                {x.unit && <span className="ml-1 text-sm font-medium text-muted-foreground">{x.unit}</span>}
              </p>
            </div>
          ))}
        </section>
        <p className="-mt-2 px-1 text-[11px] text-muted-foreground">{t.completionHint}</p>

        <section className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
          <h2 className="font-heading text-sm font-bold tracking-tight">{t.stateChart}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{t.stateChartHint}</p>
          <div className="mt-4">{series.length ? <StateLine data={series} /> : <p className="py-12 text-center text-sm text-muted-foreground">{t.empty}</p>}</div>
        </section>
      </div>

      <aside className="min-w-0 space-y-4">
        <section className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
          <h3 className="font-heading text-sm font-bold tracking-tight">{t.retests}</h3>
          {state.retests.length > 0 && profile ? (
            <ul className="-mx-2 mt-2">
              {state.retests.map((r) => {
                const row = retestDiff(profile, scoreProfile(items, r.answers), domain)[0];
                return (
                  <li key={r.week}>
                    <button type="button" onClick={() => nav.openRetest(r.week)} className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-left text-sm transition-colors hover:bg-muted/30">
                      <span className="font-medium">{copy.retest.title(r.week)}</span>
                      <span className="inline-flex items-center gap-2 tabular-nums text-muted-foreground">
                        {row && (
                          <>
                            {Math.round(row.before)} → <span className="font-semibold text-foreground">{Math.round(row.after)}</span>
                          </>
                        )}
                        <ChevronRight className="size-4" />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{t.retestsEmpty(traitName(domain))}</p>
          )}
        </section>

        <section className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
          <h3 className="font-heading text-sm font-bold tracking-tight">{t.reflections}</h3>
          {reflections.length > 0 ? (
            <div className="mt-3 divide-y divide-border/50">
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
        </section>
      </aside>
    </div>
  );
}
