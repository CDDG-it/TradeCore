"use client";

import { ChevronRight } from "lucide-react";
import { AccentPanel } from "@/components/ui/accent-panel";
import { copy } from "@/lib/trade-profile/content/copy";
import { weeklyQuestions } from "@/lib/trade-profile/content/reflection";
import { traitName } from "@/lib/trade-profile/content/traits";
import { items } from "@/lib/trade-profile/items";
import { completionRate, retestDiff, stateSeries, streak } from "@/lib/trade-profile/progress";
import { scoreProfile } from "@/lib/trade-profile/scoring";
import { domainOf } from "@/lib/trade-profile/types";
import { StateLine } from "@/components/trade-profile/charts";
import { Eyebrow, Stat, Tile } from "@/components/trade-profile/primitives";
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2.5">
        <Stat label={t.completion} value={`${Math.round(rate * 100)}%`} />
        <Stat label={t.streak} value={<>{s} <span className="text-sm font-medium text-muted-foreground">{t.streakUnit(s)}</span></>} />
        <Stat label={t.checkins} value={series.length} />
      </div>
      <p className="-mt-2 text-[11px] text-muted-foreground">{t.completionHint}</p>

      <AccentPanel accent="cyan" eyebrow={t.eyebrow} title={t.stateChart} subtitle={t.stateChartHint}>
        <div className="mt-4">{series.length ? <StateLine data={series} /> : <p className="py-10 text-center text-sm text-muted-foreground">{t.empty}</p>}</div>
      </AccentPanel>

      {state.retests.length > 0 && profile && (
        <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
          <Eyebrow className="mb-2">{t.retests}</Eyebrow>
          <ul className="-mx-2">
            {state.retests.map((r) => {
              const row = retestDiff(profile, scoreProfile(items, r.answers), domain)[0];
              return (
                <li key={r.week}>
                  <button type="button" onClick={() => nav.openRetest(r.week)} className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-left text-sm hover:bg-muted/40">
                    <span className="font-medium">{copy.retest.title(r.week)}</span>
                    <span className="inline-flex items-center gap-2 tabular-nums text-muted-foreground">
                      {row && (
                        <>
                          {traitName(domain)} {Math.round(row.before)} → <span className="font-semibold text-foreground">{Math.round(row.after)}</span>
                        </>
                      )}
                      <ChevronRight className="size-4" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {reflections.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
          <Eyebrow className="mb-3">{t.reflections}</Eyebrow>
          <div className="space-y-5">
            {reflections.map(([w, r]) => (
              <div key={w}>
                <button type="button" onClick={() => nav.openReflection(Number(w))} className="mb-2 text-sm font-semibold hover:text-primary">
                  {copy.reflection.title(Number(w))}
                </button>
                <dl className="space-y-2 text-xs">
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
        </div>
      )}
    </div>
  );
}
