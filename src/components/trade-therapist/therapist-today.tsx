"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, startOfWeek } from "date-fns";
import { ArrowRight, Check, Trophy } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { getBestTradesOfDay, getPreMarketExercise, getWeeklyTradeReviews, type BestTradeListRow } from "@/lib/supabase/queries";
import { isDayReviewed, postMarketDates } from "@/lib/post-market/day-overview";
import { exerciseDefinition } from "@/lib/pre-market/exercises";
import { formatTotalR, getWeekGroup, isReviewOpen, reviewOpensOn, tradeR } from "@/lib/journal/weeks";
import { instrumentName } from "@/lib/instruments";
import { inOrder, netRColor } from "@/lib/journal/colors";
import { bestTradeLogged } from "@/lib/reviews/day-recap";
import { cn } from "@/lib/utils";
import type { PreMarketExercise, TradeJournalEntry, WeeklyTradeReview } from "@/lib/types";

type Tone = "done" | "todo" | "waiting";
type Status = { label: string; tone: Tone };
const DAY_ABBR = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const EASE = [0.23, 1, 0.32, 1] as const;

/**
 * The Therapist's front door. It fills the viewport with where the day stands,
 * in the order a trading day runs: prepare before the open, review after the
 * close, write the week up once it has closed. Nothing starts until the trader
 * picks it, so opening the Therapist never lands in the middle of a question.
 */
export function TherapistToday({
  trades,
  onPreMarket,
  onPostMarket,
}: {
  trades: TradeJournalEntry[];
  onPreMarket: () => void;
  /** Opens the Post Market tab on `date`; `start` begins or resumes the guided review. */
  onPostMarket: (date: string, start: boolean) => void;
}) {
  const reduceMotion = useReducedMotion();
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const [preMarket, setPreMarket] = useState<PreMarketExercise | null | undefined>(undefined);
  const [reviews, setReviews] = useState<Record<string, BestTradeListRow> | null>(null);
  const [week, setWeek] = useState<WeeklyTradeReview | null | undefined>(undefined);

  useEffect(() => {
    getPreMarketExercise(today).then(setPreMarket).catch(() => setPreMarket(null));
    getBestTradesOfDay().then((rows) => setReviews(Object.fromEntries(rows.map((row) => [row.date.slice(0, 10), row])))).catch(() => setReviews({}));
    getWeeklyTradeReviews().then((rows) => setWeek(rows.find((row) => row.week_start === weekStart) ?? null)).catch(() => setWeek(null));
  }, [today, weekStart]);

  const tradesByDay = useMemo(() => {
    const map: Record<string, TradeJournalEntry[]> = {};
    for (const trade of trades) (map[trade.date_time.slice(0, 10)] ??= []).push(trade);
    return map;
  }, [trades]);
  const group = useMemo(() => getWeekGroup(trades, weekStart), [trades, weekStart]);

  const loading = preMarket === undefined || reviews === null || week === undefined;
  const rows = reviews ?? {};

  const todayTrades = inOrder(tradesByDay[today] ?? []);
  const todayR = todayTrades.reduce((total, trade) => total + tradeR(trade), 0);
  const todayRow = rows[today];
  const todayReviewed = isDayReviewed(todayRow);
  const todayInProgress = !todayReviewed && Boolean(todayRow?.review_step && todayRow.review_step !== "complete");
  const backlog = postMarketDates(trades, Object.values(rows), today)
    .filter((date) => date !== today && (tradesByDay[date]?.length ?? 0) > 0 && !isDayReviewed(rows[date]))
    .slice(0, 4);

  const preDone = Boolean(preMarket?.completed_at);
  const weekOpen = isReviewOpen(weekStart);
  const weekDone = Boolean(week && (week.lessons || week.mistakes || week.prevention_plan));
  const tradedDays = group.days.filter((d) => d.trades.length > 0);
  const reviewedDays = tradedDays.filter((d) => isDayReviewed(rows[d.date])).length;
  const missedDays = group.days.filter((d) => bestTradeLogged(rows[d.date])).length;

  // The one card that matters now: prepare first, review once you have traded,
  // write the week up once it has closed.
  const focus: "pre" | "post" | "week" | null =
    !preDone && todayTrades.length === 0 ? "pre"
      : !todayReviewed && (todayTrades.length > 0 || backlog.length > 0) ? "post"
      : weekOpen && !weekDone ? "week"
      : null;

  const preStatus: Status = preDone ? { label: "Done", tone: "done" } : { label: "Not started", tone: "todo" };
  const postStatus: Status = todayReviewed ? { label: "Reviewed", tone: "done" }
    : todayInProgress ? { label: "In progress", tone: "todo" }
    : todayTrades.length ? { label: "To review", tone: "todo" }
    : { label: "No trades yet", tone: "waiting" };
  const weekStatus: Status = weekDone ? { label: "Complete", tone: "done" }
    : weekOpen ? { label: "Ready to write", tone: "todo" }
    : { label: `Opens ${format(reviewOpensOn(weekStart), "EEEE")}`, tone: "waiting" };

  const headline = loading ? "Loading your day..."
    : focus === "pre" ? "Prepare before the open."
    : focus === "post" ? "Review the session while it is fresh."
    : focus === "week" ? "The week is closed. Write it up."
    : "You are up to date.";

  const exercise = preMarket ? exerciseDefinition(preMarket.exercise_type) : null;
  const weekRTone = group.totalR > 0 ? "text-success" : group.totalR < 0 ? "text-destructive" : "text-muted-foreground";

  return (
    <div className="h-full overflow-y-auto lg:overflow-hidden">
      <div className="flex min-h-full flex-col gap-3 lg:h-full">
        {/* Hero: the day, the one thing to do now, and the week at a glance. */}
        <motion.header
          initial={{ opacity: 0, transform: reduceMotion ? "none" : "translateY(6px)" }}
          animate={{ opacity: 1, transform: "translateY(0px)" }}
          transition={{ duration: 0.24, ease: EASE }}
          className="relative shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-card/65 p-5 sm:p-6"
        >
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-primary">Today · {format(now, "EEEE")}</p>
              <h2 className="mt-1.5 font-heading text-2xl font-bold tracking-tight sm:text-3xl">{format(now, "d MMMM yyyy")}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{headline}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex gap-5 sm:pr-5 sm:border-r sm:border-border/50">
                <Stat label="Week R" value={formatTotalR(group.totalR)} className={weekRTone} />
                <Stat label="Execution" value={group.execRate == null ? "-" : `${group.execRate}%`} className={group.execRate == null ? "text-muted-foreground/60" : group.execRate >= 70 ? "text-success" : group.execRate >= 40 ? "text-warning" : "text-destructive"} />
                <Stat label="Reviewed" value={`${reviewedDays}/${tradedDays.length}`} />
              </div>
              <div className="grid grid-cols-5 gap-1.5" aria-label="This week">
                {group.days.map((d, i) => {
                  const r = d.trades.reduce((total, trade) => total + tradeR(trade), 0);
                  const isToday = d.date === today;
                  const future = d.date > today;
                  const reviewed = isDayReviewed(rows[d.date]);
                  return (
                    <button
                      key={d.date}
                      type="button"
                      disabled={future}
                      onClick={() => onPostMarket(d.date, false)}
                      className={cn(
                        "flex w-14 flex-col items-center gap-1 rounded-lg border px-1.5 py-2 transition-colors disabled:opacity-35 sm:w-16",
                        isToday ? "border-primary/50 bg-primary/[.07]" : "border-border/50 bg-background/30 hover:border-primary/40"
                      )}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{DAY_ABBR[i]}</span>
                      <span className="text-xs font-bold tabular-nums" style={{ color: d.trades.length ? netRColor(r) : undefined }}>
                        {d.trades.length ? formatTotalR(r) : "-"}
                      </span>
                      <span className={cn("h-1 w-5 rounded-full", reviewed ? "bg-success" : d.trades.length && !future ? "bg-primary/35" : "bg-border")} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.header>

        {/* The day in three steps, filling the rest of the viewport. */}
        <div className="grid flex-1 gap-3 lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)]">
          <Panel index={0} reduceMotion={reduceMotion} active={focus === "pre"} step="01" eyebrow="Before the open" title="Pre-market exercise" status={loading ? null : preStatus}
            action={<PanelButton primary={focus === "pre"} onClick={onPreMarket}>{preDone ? "View exercise" : "Start exercise"}</PanelButton>}>
            {preDone && preMarket ? (
              <div className="space-y-3">
                {exercise && <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">{exercise.title}</p>}
                {preMarket.focus && <Quote label="Today's focus" tone="var(--primary)">{preMarket.focus}</Quote>}
                {preMarket.commitment_text && <Quote label="Commitment" tone="var(--success)">{preMarket.commitment_text}</Quote>}
              </div>
            ) : (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Five minutes before the open. Look back at recent trades, choose one focus and commit to it.</p>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />An exercise chosen from how your recent sessions went</li>
                  <li className="flex gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />One focus for today</li>
                  <li className="flex gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />A commitment you check after the close</li>
                </ul>
              </div>
            )}
          </Panel>

          <Panel index={1} reduceMotion={reduceMotion} active={focus === "post"} step="02" eyebrow="After the close" title="Post Market review" status={loading ? null : postStatus}
            action={
              <div className="flex flex-wrap items-center gap-3">
                <PanelButton primary={focus === "post"} onClick={() => onPostMarket(today, !todayReviewed)}>
                  {todayReviewed ? "View day" : todayInProgress ? "Continue review" : "Start review"}
                </PanelButton>
                {!todayReviewed && (
                  <button type="button" onClick={() => onPostMarket(today, false)} className="text-xs font-semibold text-muted-foreground transition-colors hover:text-primary">
                    Day overview
                  </button>
                )}
              </div>
            }>
            <div className="space-y-4">
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">Today&apos;s trades</p>
                  {todayTrades.length > 0 && <span className="text-sm font-bold tabular-nums" style={{ color: netRColor(todayR) }}>{formatTotalR(todayR)}</span>}
                </div>
                {todayTrades.length ? (
                  <div className="mt-2 space-y-1">
                    {todayTrades.map((trade) => (
                      <div key={trade.id} className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/30 px-2.5 py-2 text-xs">
                        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", trade.execution_quality === "good" ? "bg-success" : trade.execution_quality === "bad" ? "bg-destructive" : "bg-border")} title={trade.execution_quality ? `Execution ${trade.execution_quality}` : "Execution not rated"} />
                        <span className="min-w-0 flex-1 truncate font-semibold">{instrumentName(trade.instrument)} <span className="font-normal capitalize text-muted-foreground">{trade.direction}</span></span>
                        <span className="text-[10px] text-muted-foreground">{trade.execution_time || trade.session}</span>
                        <span className="w-14 text-right font-bold tabular-nums" style={{ color: netRColor(tradeR(trade)) }}>{formatTotalR(tradeR(trade))}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">No trades logged yet today. A day you stay out still gets a review: was staying out the right call?</p>
                )}
              </div>

              {todayRow && (todayRow.taken_was_best || bestTradeLogged(todayRow)) && (
                <div className={cn("flex items-start gap-2 rounded-lg border px-3 py-2 text-xs", todayRow.taken_was_best ? "border-success/25 bg-success/5" : "border-ice/25 bg-ice/5")}>
                  <Trophy className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", todayRow.taken_was_best ? "text-success" : "text-ice")} />
                  <span className="text-muted-foreground"><span className="font-semibold text-foreground">{todayRow.taken_was_best ? "Best trade taken." : "A better trade was there."}</span> {todayRow.notes}</span>
                </div>
              )}

              {backlog.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">Still to review</p>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    {backlog.map((date) => {
                      const r = (tradesByDay[date] ?? []).reduce((total, trade) => total + tradeR(trade), 0);
                      return (
                        <button key={date} type="button" onClick={() => onPostMarket(date, true)}
                          className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-background/30 px-2.5 py-2 text-xs transition-colors hover:border-primary/40">
                          <span className="font-medium">{format(new Date(`${date}T12:00:00`), "EEE d MMM")}</span>
                          <span className="font-semibold tabular-nums" style={{ color: netRColor(r) }}>{formatTotalR(r)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Panel>

          <Panel index={2} reduceMotion={reduceMotion} active={focus === "week"} step="03" eyebrow="End of the week" title="Weekly review" status={loading ? null : weekStatus}
            action={
              <Link href={`/trade-therapist/review/${weekStart}`}
                className={cn("inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-colors",
                  focus === "week" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border/60 text-foreground hover:border-primary/40 hover:text-primary")}>
                {weekDone ? "Open review" : weekOpen ? "Write review" : "Preview week"} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <MiniStat label="Trading days" value={`${tradedDays.length}/5`} />
                <MiniStat label="Days reviewed" value={`${reviewedDays}/${tradedDays.length}`} />
                <MiniStat label="Missed winners" value={String(missedDays)} tone={missedDays ? "text-ice" : undefined} />
                <MiniStat label="Good execution" value={`${group.goodExec}/${group.goodExec + group.badExec}`} />
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {weekDone ? "This week's reflection is written. Open it to check last week's focus against how you traded."
                  : weekOpen ? "Each day is laid out for you: what went wrong, the lesson, the winner you missed. Sum it up in three lines."
                  : `Unlocks ${format(reviewOpensOn(weekStart), "EEEE d MMMM")}, once the week's last session is behind you.`}
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Panel({ index, reduceMotion, active, step, eyebrow, title, status, action, children }: {
  index: number;
  reduceMotion: boolean | null;
  active: boolean;
  step: string;
  eyebrow: string;
  title: string;
  status: Status | null;
  action: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, transform: reduceMotion ? "none" : "translateY(8px)" }}
      animate={{ opacity: 1, transform: "translateY(0px)" }}
      transition={{ duration: 0.26, delay: reduceMotion ? 0 : 0.06 + index * 0.05, ease: EASE }}
      className={cn(
        "relative flex min-h-72 flex-col overflow-hidden rounded-2xl border bg-card/65 lg:min-h-0",
        active ? "border-primary/45 shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary)_16%,transparent),0_28px_70px_-44px_rgba(0,0,0,.6)]" : "border-border/60"
      )}
    >
      {active && <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />}
      <div className="flex shrink-0 items-start justify-between gap-3 px-5 pt-5">
        <div>
          <p className="font-heading text-xs font-bold tabular-nums text-muted-foreground/50">{step}</p>
          <p className={cn("mt-3 text-[10px] font-semibold uppercase tracking-[.16em]", active ? "text-primary" : "text-muted-foreground")}>{eyebrow}</p>
          <h3 className="mt-1 font-heading text-lg font-bold tracking-tight">{title}</h3>
        </div>
        {status && <StatusPill status={status} />}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
      <div className="shrink-0 border-t border-border/50 px-5 py-3.5">{action}</div>
    </motion.section>
  );
}

function StatusPill({ status }: { status: Status }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold leading-none",
      status.tone === "done" ? "bg-success/12 text-success" : status.tone === "todo" ? "bg-primary/12 text-primary" : "bg-muted/40 text-muted-foreground")}>
      {status.tone === "done" && <Check className="h-3 w-3" />}
      {status.label}
    </span>
  );
}

function PanelButton({ primary, onClick, children }: { primary: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={cn("inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-colors",
        primary ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border/60 text-foreground hover:border-primary/40 hover:text-primary")}>
      {children} <ArrowRight className="h-3.5 w-3.5" />
    </button>
  );
}

function Quote({ label, tone, children }: { label: string; tone: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/30 p-3">
      <div className="mb-1 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone }} />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className="text-sm leading-snug">{children}</p>
    </div>
  );
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <p className={cn("font-heading text-xl font-bold leading-none tabular-nums", className)}>{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground/70">{label}</p>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/30 px-3 py-2.5">
      <p className={cn("font-heading text-lg font-bold leading-none tabular-nums", tone)}>{value}</p>
      <p className="mt-1 text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
