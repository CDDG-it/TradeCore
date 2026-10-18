"use client";

import { useState } from "react";
import { ChevronRight, ClipboardCheck, NotebookPen, Target } from "lucide-react";
import { AccentPanel } from "@/components/ui/accent-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { thresholds } from "@/lib/trade-profile/config";
import { copy } from "@/lib/trade-profile/content/copy";
import { exerciseById } from "@/lib/trade-profile/content/exercises";
import { traitName } from "@/lib/trade-profile/content/traits";
import { daysBetween, fromKey } from "@/lib/trade-profile/dates";
import { dueRetests, exerciseForDay } from "@/lib/trade-profile/program";
import { CheckinForm } from "@/components/trade-profile/checkin-form";
import { DifficultyPill, Eyebrow, Pill, ProgressLine, Tile } from "@/components/trade-profile/primitives";
import { useDerived, useTradeProfile } from "@/components/trade-profile/store";
import { useProfileNav } from "@/components/trade-profile/nav";

const fmt = (k: string) => fromKey(k).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

/** Where the program stands today: the goal, today's challenge, the check-in, and anything due. */
export function TodayView() {
  const { state, todayKey } = useTradeProfile();
  const { goalTarget, schedule, position } = useDerived();
  const nav = useProfileNav();
  const [showAll, setShowAll] = useState(false);
  const t = copy.today;

  if (!state.goal || !goalTarget || !schedule || !state.programStart || !position) {
    return (
      <AccentPanel accent="primary" eyebrow={t.noGoalTitle} subtitle={t.noGoal}>
        <Button className="mt-4" onClick={() => nav.goTab("goal")}>
          {t.chooseGoal} <ChevronRight />
        </Button>
      </AccentPanel>
    );
  }

  const start = state.programStart;
  const goal = state.goal;
  const todaysId = exerciseForDay(schedule, start, todayKey);
  const today = todaysId ? exerciseById[todaysId] : undefined;
  const week = schedule[position.week - 1];
  const retests = dueRetests(start, todayKey, state.retests.map((r) => r.week));
  // The earliest week without a reflection, offered from that week's sixth day.
  const reflectionWeek = Array.from({ length: thresholds.programWeeks }, (_, i) => i + 1).find(
    (w) => !state.reflections[w] && daysBetween(start, todayKey) >= (w - 1) * 7 + 5,
  );
  const total = thresholds.programWeeks * 7;
  const dayNo = Math.max(0, Math.min(position.dayIndex + 1, total));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
        <Tile className="flex items-start gap-3">
          <Target className="mt-0.5 size-4 shrink-0 text-primary" />
          <div className="min-w-0 text-sm">
            <p className="font-semibold">
              {copy.goal.directions[goal.direction]} · {traitName(goal.trait)}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{goal.ifCue}</p>
            <p className="text-xs leading-relaxed text-foreground/85">→ {goal.thenAction}</p>
          </div>
        </Tile>
        <Tile>
          <div className="mb-2 flex items-baseline justify-between text-xs">
            <span className="font-semibold">
              {copy.common.week} {position.week} <span className="font-normal text-muted-foreground">{copy.common.of} {thresholds.programWeeks}</span>
            </span>
            <span className="tabular-nums text-muted-foreground">
              {copy.common.day} {dayNo} / {total}
            </span>
          </div>
          <ProgressLine value={dayNo / total} />
        </Tile>
      </div>

      {retests.map((w) => (
        <button
          key={w}
          type="button"
          onClick={() => nav.openRetest(w)}
          className="press flex w-full items-center gap-3.5 rounded-2xl border border-ice/35 bg-ice/[0.07] p-4 text-left transition-colors hover:bg-ice/[0.12]"
        >
          <ClipboardCheck className="size-5 shrink-0 text-ice" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">{t.retestDue(w)}</span>
            <span className="text-xs text-muted-foreground">{t.retestCta}</span>
          </span>
          <ChevronRight className="size-4 text-ice" />
        </button>
      ))}

      {!position.started && (
        <Tile>
          <p className="text-sm text-foreground/85">
            {t.notStarted} {fmt(start)}.
          </p>
        </Tile>
      )}
      {position.finished && (
        <Tile>
          <p className="text-sm text-foreground/85">{t.finished}</p>
        </Tile>
      )}

      {today && (
        <AccentPanel
          accent="primary"
          eyebrow={t.challenge}
          title={
            <button type="button" onClick={() => nav.openExercise(today.id)} className="text-left hover:text-primary">
              {today.title}
            </button>
          }
          subtitle={today.goal}
          headerRight={<DifficultyPill level={today.difficulty} />}
        >
          <div className="mt-4 rounded-xl border border-ice/15 bg-ice/[0.06] p-3.5">
            <Eyebrow tone="ice">{t.tradingVersion}</Eyebrow>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{today.tradingVersion}</p>
          </div>
          <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground">
            {t.logging}: {today.logging}
          </p>
          <div className="mt-5 border-t border-border/50 pt-4">
            <div className="mb-3.5 flex items-baseline justify-between">
              <span className="font-heading text-sm font-bold tracking-tight">{copy.checkin.title}</span>
              <span className="text-[11px] text-muted-foreground">{copy.checkin.subtitle}</span>
            </div>
            <CheckinForm key={todayKey} date={todayKey} exerciseId={today.id} goal={goalTarget} />
          </div>
        </AccentPanel>
      )}

      {reflectionWeek && (
        <button
          type="button"
          onClick={() => nav.openReflection(reflectionWeek)}
          className="press flex w-full items-center gap-3.5 rounded-2xl border border-border/60 bg-card p-4 text-left transition-colors hover:border-primary/40"
        >
          <NotebookPen className="size-5 shrink-0 text-primary" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">{t.reflectionDue(reflectionWeek)}</span>
            <span className="text-xs text-muted-foreground">{t.reflectionCta}</span>
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
      )}

      {position.started && !position.finished && week && (
        <section>
          <Eyebrow className="mb-2">{t.thisWeek}</Eyebrow>
          <ul className="grid gap-2 sm:grid-cols-3">
            {week.exerciseIds.map((id) => {
              const ex = exerciseById[id];
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => nav.openExercise(id)}
                    className={cn(
                      "press flex h-full w-full flex-col items-start gap-2 rounded-xl border bg-card p-3.5 text-left transition-colors hover:border-primary/40",
                      id === todaysId ? "border-primary/35" : "border-border/60",
                    )}
                  >
                    <DifficultyPill level={ex.difficulty} />
                    <span className="text-sm font-semibold leading-snug">{ex.title}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {ex.frequency} · {ex.duration}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <button type="button" onClick={() => setShowAll(!showAll)} className="flex w-full items-center justify-between py-1 text-left">
          <Eyebrow>{t.plan}</Eyebrow>
          <ChevronRight className={cn("size-4 text-muted-foreground transition-transform", showAll && "rotate-90")} />
        </button>
        {showAll && (
          <ol className="mt-2 grid gap-2 sm:grid-cols-2">
            {schedule.map((w) => (
              <li key={w.week} className={cn("rounded-xl border p-3.5", w.week === position.week ? "border-primary/40 bg-card" : "border-border/50 bg-card/50")}>
                <p className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-semibold">
                    {copy.common.week} {w.week}
                    {(thresholds.retestWeeks as readonly number[]).includes(w.week) && (
                      <Pill tone="ice" className="ml-2">
                        {t.retestBadge}
                      </Pill>
                    )}
                  </span>
                  <DifficultyPill level={w.targetDifficulty} />
                </p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {w.exerciseIds.map((id) => (
                    <li key={id}>
                      <button type="button" onClick={() => nav.openExercise(id)} className="text-left hover:text-foreground">
                        {exerciseById[id].title}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
