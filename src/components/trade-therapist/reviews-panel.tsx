"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  format, startOfWeek, subWeeks, subMonths, startOfMonth, endOfMonth, isWithinInterval,
} from "date-fns";
import {
  Loader2, ArrowRight, CheckCircle2, Circle, Lock, ChevronDown, ChevronUp, Quote,
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { AccentPanel } from "@/components/ui/accent-panel";
import { ReviewConsistency } from "@/components/trade-therapist/review-consistency";
import { getTrades, getWeeklyTradeReviews } from "@/lib/supabase/queries";
import { getWeekGroup, formatTotalR, tradeR, isReviewOpen } from "@/lib/journal/weeks";
import type { TradeJournalEntry, WeeklyTradeReview } from "@/lib/types";

type Mode = "weekly" | "monthly";

/**
 * Reviews: a two-pane surface. On the left a weekly/monthly toggle and the list
 * of periods (collapsible); on the right your review progress and a running
 * digest of exactly what you wrote. It reports only facts and your own words:
 * it makes no assumptions about your mistakes or patterns.
 */
export type ReviewsSeed = { trades: TradeJournalEntry[]; reviews: WeeklyTradeReview[] };

export function ReviewsPanel({ seed }: { seed?: ReviewsSeed } = {}) {
  const [trades, setTrades] = useState<TradeJournalEntry[] | null>(seed?.trades ?? null);
  const [reviews, setReviews] = useState<WeeklyTradeReview[]>(seed?.reviews ?? []);
  const [mode, setMode] = useState<Mode>("weekly");
  const [listOpen, setListOpen] = useState(true);

  useEffect(() => {
    if (seed) return;
    Promise.all([getTrades(), getWeeklyTradeReviews()]).then(([t, r]) => { setTrades(t); setReviews(r); });
  }, [seed]);

  const reviewByWeek = useMemo(() => new Map(reviews.map((r) => [r.week_start, r])), [reviews]);
  const written = (r?: WeeklyTradeReview) => Boolean(r && (r.lessons || r.mistakes || r.prevention_plan));

  const weeks = useMemo(() => {
    if (!trades) return [];
    const now = new Date();
    return Array.from({ length: 12 }).map((_, i) => {
      const monday = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
      const ws = format(monday, "yyyy-MM-dd");
      return {
        ws, group: getWeekGroup(trades, ws),
        // Reviewable once the trading week is over: Friday, not Sunday.
        reviewable: isReviewOpen(ws, now),
        current: i === 0, review: reviewByWeek.get(ws),
      };
    });
  }, [trades, reviewByWeek]);

  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }).map((_, i) => {
      const m = startOfMonth(subMonths(now, i));
      return { key: format(m, "yyyy-MM"), label: format(m, "MMMM yyyy"), date: m };
    });
  }, []);

  const writtenNotes = useMemo(
    () => reviews.filter((r) => written(r)).sort((a, b) => b.week_start.localeCompare(a.week_start)).slice(0, 8),
    [reviews]
  );

  if (!trades) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  const finishedWeeks = weeks.filter((w) => w.reviewable);
  const doneCount = finishedWeeks.filter((w) => written(w.review)).length;
  // Current streak of consecutive closed weeks with a written review (newest →
  // back). The week that has only just closed is still yours to write, so an
  // empty one there does not break the streak: the same way today never
  // breaks a habit streak. It simply is not counted yet.
  const chain = finishedWeeks[0] && !written(finishedWeeks[0].review) ? finishedWeeks.slice(1) : finishedWeeks;
  let streak = 0;
  for (const w of chain) { if (written(w.review)) streak++; else break; }

  // Oldest → newest, so the strip reads like a timeline instead of a list.
  const strip = [...weeks].reverse();
  // The closed week most in need of attention: what the empty state points at.
  const nextToWrite = finishedWeeks.find((w) => !written(w.review));

  // The line that actually carries forward: the focus you set for the week
  // ahead. Falls back to what you wrote instead, so the panel is never blank
  // when a review exists.
  const latest = writtenNotes[0];
  const latestGroup = latest ? getWeekGroup(trades, latest.week_start) : null;
  const headline = latest
    ? latest.prevention_plan
      ? { label: "Focus you set", text: latest.prevention_plan, tone: "var(--primary)" }
      : latest.mistakes
      ? { label: "What you wanted to fix", text: latest.mistakes, tone: "var(--loss)" }
      : { label: "What worked", text: latest.lessons, tone: "var(--win)" }
    : null;
  const earlier = writtenNotes.slice(1, 5);

  return (
    // `minmax(0,1fr)` on the single-column phone layout, not the implicit
    // `auto`: an auto column is sized to its content's minimum, so the panels
    // grew wider than the screen and their own `overflow-hidden` quietly cut
    // the numbers and quotes off at the right edge.
    <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      {/* LEFT: toggle + list.
          On a phone this drops below the progress: a year of week rows is a
          reference, not the thing you open the tab to see. */}
      <AccentPanel accent="primary" className="order-2 flex min-h-0 flex-col p-0 lg:order-none">
        {/* Header: a proper segmented control with a sliding active pill, and a
            quiet expand/collapse for when the list is only a reference. */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/40 p-3">
          <div className="relative flex rounded-lg border border-border/60 bg-muted/25 p-0.5">
            {(["weekly", "monthly"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "relative z-10 rounded-[7px] px-4 py-1.5 text-xs font-semibold capitalize transition-colors",
                  mode === m ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {mode === m && (
                  <motion.span
                    layoutId="reviews-mode-pill"
                    className="absolute inset-0 -z-10 rounded-[7px] bg-primary"
                    style={{ boxShadow: "0 2px 10px color-mix(in oklch, var(--primary) 30%, transparent)" }}
                    transition={{ type: "spring", stiffness: 480, damping: 36 }}
                  />
                )}
                {m}
              </button>
            ))}
          </div>
          <button
            onClick={() => setListOpen((v) => !v)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            {listOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {listOpen ? "Collapse" : "Expand"}
          </button>
        </div>

        {listOpen && (
          <div className="max-h-[22rem] min-h-0 flex-1 overflow-y-auto p-2.5 lg:max-h-none">
            {mode === "weekly" ? (
              <div className="space-y-2">
                {weeks.map(({ ws, group, reviewable, current, review }, i) => {
                  const done = written(review);
                  // Three states, one visual language: a coloured status rail
                  // down the left edge, a matching icon, and - for the one week
                  // actually asking for attention - a soft warning wash.
                  const needs = reviewable && !done;
                  const railColor = !reviewable
                    ? "var(--primary)"
                    : done
                    ? "var(--success)"
                    : "var(--warning)";
                  return (
                    <Link
                      key={ws}
                      href={`/trade-therapist/review/${ws}`}
                      style={{ "--i": i } as CSSProperties}
                      className={cn(
                        "rise-in press group relative flex items-stretch gap-3 overflow-hidden rounded-xl border pl-0 pr-3 py-2.5 hover:border-primary/40 hover:bg-muted/25",
                        needs ? "border-warning/40 bg-warning/[0.05]" : "border-border/60"
                      )}
                    >
                      {/* Status rail */}
                      <span aria-hidden className="w-1 shrink-0 rounded-full" style={{ background: railColor }} />

                      <span className="flex shrink-0 items-center pl-1.5">
                        {!reviewable ? <Lock className="h-4 w-4 text-primary/70" />
                          : done ? <CheckCircle2 className="h-4 w-4 text-success" />
                          : <Circle className="h-4 w-4 text-warning/70" />}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 text-sm font-bold leading-none transition-colors group-hover:text-primary">
                          Week {group.weekNum}
                          {current && (
                            <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                              Current
                            </span>
                          )}
                        </p>
                        <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] leading-none text-muted-foreground">
                          <span>{group.rangeLabel}</span>
                          <span className="text-muted-foreground/40">·</span>
                          <span className="font-semibold tabular-nums">{group.wins}W {group.losses}L</span>
                          {group.execRate != null && (
                            <>
                              <span className="text-muted-foreground/40">·</span>
                              <span
                                title={`${group.goodExec} of ${group.goodExec + group.badExec} rated trades executed to plan`}
                                className={cn("font-semibold tabular-nums",
                                  group.execRate >= 70 ? "text-success"
                                    : group.execRate >= 40 ? "text-warning"
                                    : "text-destructive")}
                              >
                                {group.execRate}% exec
                              </span>
                            </>
                          )}
                        </p>
                        {needs && (
                          <p className="mt-1.5 text-[10px] font-semibold text-warning">Closed - not written yet</p>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-col items-end justify-center gap-1">
                        <span className={cn("text-sm font-black tabular-nums",
                          group.totalR > 0 ? "text-success" : group.totalR < 0 ? "text-destructive" : "text-warning")}>
                          {formatTotalR(group.totalR)}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {months.map(({ key, label, date }, i) => {
                  const r = (trades ?? []).filter((t) => isWithinInterval(new Date(t.date_time.slice(0, 10) + "T12:00:00"),
                    { start: startOfMonth(date), end: endOfMonth(date) })).reduce((s, t) => s + tradeR(t), 0);
                  const railColor = r > 0 ? "var(--success)" : r < 0 ? "var(--destructive)" : "var(--muted-foreground)";
                  return (
                    <Link
                      key={key}
                      href={`/trade-therapist/review/month/${key}`}
                      style={{ "--i": i } as CSSProperties}
                      className="rise-in press group relative flex items-stretch gap-3 overflow-hidden rounded-xl border border-border/60 py-3 pl-0 pr-3 hover:border-primary/40 hover:bg-muted/25"
                    >
                      <span aria-hidden className="w-1 shrink-0 rounded-full" style={{ background: railColor }} />
                      <span className="flex-1 self-center pl-1.5 text-sm font-semibold transition-colors group-hover:text-primary">{label}</span>
                      <span className={cn("self-center text-sm font-black tabular-nums", r > 0 ? "text-success" : r < 0 ? "text-destructive" : "text-muted-foreground")}>{formatTotalR(r)}</span>
                      <ArrowRight className="h-3.5 w-3.5 self-center text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </AccentPanel>

      {/* RIGHT: how the habit is holding, and the line you set for yourself */}
      <div className="order-1 flex min-h-0 flex-col gap-3 lg:order-none">
        <ReviewConsistency
          className="shrink-0"
          streak={streak}
          done={doneCount}
          closed={finishedWeeks.length}
          nextToWrite={nextToWrite ? { ws: nextToWrite.ws, weekNum: nextToWrite.group.weekNum } : null}
          cells={strip.map(({ ws, group, reviewable, current, review }) => ({
            ws, weekNum: group.weekNum, rangeLabel: group.rangeLabel, current,
            state: !reviewable ? "open" : written(review) ? "done" : "missed",
          }))}
        />

        {/* The one line worth carrying into the next session, then the trail of
            the ones before it, so repeating yourself becomes visible. Framed as
            a note to self: a quoted instruction you set, in your own hand. */}
        <AccentPanel accent="cyan" eyebrow="Carried forward" title="What you told yourself" className="flex min-h-0 flex-1 flex-col">
          {!headline ? (
            <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 py-8 text-center">
              <Quote className="h-5 w-5 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">Nothing written yet.</p>
              <p className="max-w-xs text-[11px] leading-relaxed text-muted-foreground/70">
                Close out a week and the focus you set for the next one lands here, so you start the week with your own
                instruction in front of you.
              </p>
              {nextToWrite && (
                <Link
                  href={`/trade-therapist/review/${nextToWrite.ws}`}
                  className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  Write week {nextToWrite.group.weekNum}&apos;s review <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          ) : (
            <div className="mt-3 flex min-h-0 flex-1 flex-col">
              {/* The headline instruction, framed as a pull-quote card in the
                  tone of what it is: focus, fix, or what worked. */}
              <Link
                href={`/trade-therapist/review/${latest.week_start}`}
                className="group relative block shrink-0 overflow-hidden rounded-xl border p-4 transition-all hover:-translate-y-0.5"
                style={{
                  borderColor: `color-mix(in oklch, ${headline.tone} 35%, transparent)`,
                  background: `color-mix(in oklch, ${headline.tone} 7%, transparent)`,
                }}
              >
                <Quote
                  aria-hidden
                  className="absolute -right-1 -top-1 h-12 w-12 opacity-[0.08]"
                  style={{ color: headline.tone }}
                />
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: headline.tone }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: headline.tone }} />
                  {headline.label}
                </p>
                <p className="relative mt-2 text-[15px] font-medium leading-relaxed text-foreground/90">
                  &ldquo;{headline.text}&rdquo;
                </p>
                <p className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground/60 transition-colors group-hover:text-primary">
                  Week {latestGroup!.weekNum} · {latestGroup!.rangeLabel}
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </p>
              </Link>

              {earlier.length > 0 && (
                <div className="mt-4 min-h-0 flex-1 overflow-y-auto border-t border-border/40 pt-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Before that
                  </p>
                  <div className="space-y-1.5">
                    {earlier.map((r) => {
                      const g = getWeekGroup(trades, r.week_start);
                      const line = r.prevention_plan || r.mistakes || r.lessons;
                      return (
                        <Link
                          key={r.week_start}
                          href={`/trade-therapist/review/${r.week_start}`}
                          title={line}
                          className="group flex items-baseline gap-2.5 rounded-lg border border-transparent px-2 py-1.5 transition-colors hover:border-border/50 hover:bg-muted/25"
                        >
                          <span className="w-10 shrink-0 text-[10px] font-bold tabular-nums text-muted-foreground/70 transition-colors group-hover:text-primary">
                            Wk {g.weekNum}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">{line}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </AccentPanel>
      </div>
    </div>
  );
}
