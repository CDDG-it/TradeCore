"use client";

import { useState } from "react";
import { ArrowRight, ChevronRight, ClipboardCheck, NotebookPen } from "lucide-react";
import { AccentPanel } from "@/components/ui/accent-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { thresholds } from "@/lib/trade-profile/config";
import { copy } from "@/lib/trade-profile/content/copy";
import { exerciseById } from "@/lib/trade-profile/content/exercises";
import { traitName } from "@/lib/trade-profile/content/traits";
import { daysBetween, fromKey } from "@/lib/trade-profile/dates";
import { dueRetests, exerciseForDay, type ProgramWeek } from "@/lib/trade-profile/program";
import { CheckinForm } from "@/components/trade-profile/checkin-form";
import { DifficultyPill, Tile } from "@/components/trade-profile/primitives";
import { useDerived, useTradeProfile } from "@/components/trade-profile/store";
import { useProfileNav } from "@/components/trade-profile/nav";

const fmt = (k: string) => fromKey(k).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
const RETEST_WEEKS = thresholds.retestWeeks as readonly number[];

/**
 * Where the program stands today. A two-column workspace on desktop: the
 * challenge and the week on the left, the trader's own levers (where they are,
 * the check-in, anything due) in a rail on the right.
 */
export function TodayView() {
  const { state, todayKey } = useTradeProfile();
  const { goalTarget, schedule, position } = useDerived();
  const nav = useProfileNav();
  const [showAll, setShowAll] = useState(false);
  const t = copy.today;

  if (!state.goal || !goalTarget || !schedule || !state.programStart || !position) {
    return (
      <AccentPanel accent="primary" title={t.noGoalTitle} subtitle={t.noGoal}>
        <Button className="mt-4" onClick={() => nav.goTab("goal")}>
          {t.chooseGoal} <ArrowRight />
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
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start">
      {/* ── The work ─────────────────────────────────────────── */}
      <div className="min-w-0 space-y-4">
        {today ? (
          <AccentPanel accent="primary" className="sm:p-6 sm:pl-7">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-muted-foreground">{t.challenge}</p>
              <DifficultyPill level={today.difficulty} />
            </div>
            <button type="button" onClick={() => nav.openExercise(today.id)} className="group mt-2 block text-left">
              <h2 className="font-heading text-2xl font-bold leading-tight tracking-tight [text-wrap:balance] group-hover:text-primary sm:text-[28px]">
                {today.title}
              </h2>
              <p className="mt-1.5 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">{today.goal}</p>
            </button>

            <div className="mt-5 rounded-xl border border-ice/15 bg-ice/[0.05] p-4">
              <p className="text-xs font-semibold text-ice">{t.tradingVersion}</p>
              <p className="mt-1.5 max-w-[65ch] text-[15px] leading-relaxed text-foreground/90">{today.tradingVersion}</p>
            </div>
            <p className="mt-3 max-w-[65ch] text-xs leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground/70">{t.logging}.</span> {today.logging}
            </p>
          </AccentPanel>
        ) : (
          <Tile>
            <p className="text-sm text-foreground/85">{position.finished ? t.finished : `${t.notStarted} ${fmt(start)}.`}</p>
          </Tile>
        )}

        {position.started && !position.finished && week && (
          <section className="rounded-2xl border border-border/60 bg-card">
            <h3 className="px-4 pt-4 font-heading text-sm font-bold tracking-tight sm:px-5">
              {t.thisWeek} <span className="font-medium text-muted-foreground">· {copy.common.week} {position.week}</span>
            </h3>
            <ul className="mt-2 divide-y divide-border/50">
              {week.exerciseIds.map((id) => {
                const ex = exerciseById[id];
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => nav.openExercise(id)}
                      className="press flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/30 sm:px-5"
                    >
                      <span className={cn("size-1.5 shrink-0 rounded-full", id === todaysId ? "bg-primary" : "bg-transparent")} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{ex.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {ex.frequency}, {ex.duration.toLowerCase()}
                        </span>
                      </span>
                      <DifficultyPill level={ex.difficulty} />
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </button>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              aria-expanded={showAll}
              className="flex w-full items-center justify-between border-t border-border/50 px-4 py-3 text-left text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-5"
            >
              {t.plan}
              <ChevronRight className={cn("size-4 transition-transform duration-200", showAll && "rotate-90")} />
            </button>
            {showAll && <WeekPlan schedule={schedule} current={position.week} onOpen={nav.openExercise} />}
          </section>
        )}
      </div>

      {/* ── The rail ─────────────────────────────────────────── */}
      <aside className="min-w-0 space-y-4">
        <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-heading text-[28px] font-bold leading-none tracking-tight tabular-nums">
              {copy.common.week} {position.week}
              <span className="ml-1 text-base font-semibold text-muted-foreground">/ {thresholds.programWeeks}</span>
            </p>
            <p className="text-xs tabular-nums text-muted-foreground">
              {copy.common.day} {dayNo} {copy.common.of} {total}
            </p>
          </div>
          <WeekStrip current={position.week} started={position.started} />
          <div className="mt-4 border-t border-border/50 pt-3.5 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-semibold">
                {copy.goal.directions[goal.direction]} {traitName(goal.trait)}
              </p>
              <button type="button" onClick={() => nav.goTab("goal")} className="shrink-0 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                {t.changeGoal}
              </button>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {goal.ifCue}
              <br />
              <span className="text-foreground/85">{goal.thenAction}</span>
            </p>
          </div>
        </div>

        {retests.map((w) => (
          <DueRow key={w} icon={<ClipboardCheck className="size-4 text-ice" />} tone="ice" title={t.retestDue(w)} hint={t.retestCta} onClick={() => nav.openRetest(w)} />
        ))}
        {reflectionWeek && (
          <DueRow
            icon={<NotebookPen className="size-4 text-primary" />}
            tone="primary"
            title={t.reflectionDue(reflectionWeek)}
            hint={t.reflectionCta}
            onClick={() => nav.openReflection(reflectionWeek)}
          />
        )}

        {today && (
          <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
            <div className="mb-4 flex items-baseline justify-between">
              <h3 className="font-heading text-sm font-bold tracking-tight">{copy.checkin.title}</h3>
              <span className="text-[11px] text-muted-foreground">{copy.checkin.subtitle}</span>
            </div>
            <CheckinForm key={todayKey} date={todayKey} exerciseId={today.id} goal={goalTarget} />
          </div>
        )}
      </aside>
    </div>
  );
}

/** Twelve segments: done, this week, still to come. Retest weeks carry a notch. */
function WeekStrip({ current, started }: { current: number; started: boolean }) {
  return (
    <div className="mt-4 grid grid-cols-12 gap-1" aria-hidden>
      {Array.from({ length: thresholds.programWeeks }, (_, i) => i + 1).map((w) => (
        <span key={w} className="relative">
          <span
            className={cn(
              "block h-1.5 rounded-full transition-colors",
              started && w < current ? "bg-primary/70" : started && w === current ? "bg-primary" : "bg-muted/70",
            )}
          />
          {RETEST_WEEKS.includes(w) && <span className="absolute -top-1.5 left-1/2 h-1 w-px -translate-x-1/2 bg-ice" />}
        </span>
      ))}
    </div>
  );
}

function DueRow({ icon, tone, title, hint, onClick }: { icon: React.ReactNode; tone: "ice" | "primary"; title: string; hint: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "press flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
        tone === "ice" ? "border-ice/30 bg-ice/[0.06] hover:bg-ice/[0.1]" : "border-primary/25 bg-primary/[0.05] hover:bg-primary/[0.09]",
      )}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-background/50">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </span>
      <ArrowRight className="size-4 text-muted-foreground" />
    </button>
  );
}

function WeekPlan({ schedule, current, onOpen }: { schedule: ProgramWeek[]; current: number; onOpen: (id: string) => void }) {
  return (
    <ol className="grid gap-x-6 gap-y-4 border-t border-border/50 px-4 py-4 sm:grid-cols-2 sm:px-5">
      {schedule.map((w) => (
        <li key={w.week} className={cn(w.week < current && "opacity-60")}>
          <p className="mb-1 flex items-center gap-2 text-xs font-semibold">
            <span className={cn(w.week === current && "text-primary")}>
              {copy.common.week} {w.week}
            </span>
            {RETEST_WEEKS.includes(w.week) && <span className="text-[11px] font-medium text-ice">{copy.today.retestBadge}</span>}
          </p>
          <ul className="space-y-0.5 text-xs text-muted-foreground">
            {w.exerciseIds.map((id) => (
              <li key={id}>
                <button type="button" onClick={() => onOpen(id)} className="text-left hover:text-foreground">
                  {exerciseById[id].title}
                </button>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
