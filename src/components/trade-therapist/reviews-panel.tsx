"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  format, startOfWeek, subWeeks, subMonths, startOfMonth, endOfMonth, isWithinInterval,
} from "date-fns";
import {
  Loader2, ArrowRight, CheckCircle2, Circle, Lock, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AccentPanel } from "@/components/ui/accent-panel";
import { getTrades, getWeeklyTradeReviews } from "@/lib/supabase/queries";
import { getWeekGroup, formatTotalR, tradeR, isReviewOpen } from "@/lib/journal/weeks";
import type { TradeJournalEntry, WeeklyTradeReview } from "@/lib/types";

type Mode = "weekly" | "monthly";

/**
 * Reviews — a two-pane surface. On the left a weekly/monthly toggle and the list
 * of periods (collapsible); on the right your review progress and a running
 * digest of exactly what you wrote. It reports only facts and your own words —
 * it makes no assumptions about your mistakes or patterns.
 */
export function ReviewsPanel() {
  const [trades, setTrades] = useState<TradeJournalEntry[] | null>(null);
  const [reviews, setReviews] = useState<WeeklyTradeReview[]>([]);
  const [mode, setMode] = useState<Mode>("weekly");
  const [listOpen, setListOpen] = useState(true);

  useEffect(() => {
    Promise.all([getTrades(), getWeeklyTradeReviews()]).then(([t, r]) => { setTrades(t); setReviews(r); });
  }, []);

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
        // Reviewable once the trading week is over — Friday, not Sunday.
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
  const pct = finishedWeeks.length ? Math.round((doneCount / finishedWeeks.length) * 100) : 0;
  // Current streak of consecutive closed weeks with a written review (newest →
  // back). The week that has only just closed is still yours to write, so an
  // empty one there does not break the streak — the same way today never
  // breaks a habit streak. It simply is not counted yet.
  const chain = finishedWeeks[0] && !written(finishedWeeks[0].review) ? finishedWeeks.slice(1) : finishedWeeks;
  let streak = 0;
  for (const w of chain) { if (written(w.review)) streak++; else break; }

  // Oldest → newest, so the strip reads like a timeline instead of a list.
  const strip = [...weeks].reverse();
  // The closed week most in need of attention — what the empty state points at.
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
      {/* LEFT — toggle + list.
          On a phone this drops below the progress: a year of week rows is a
          reference, not the thing you open the tab to see. */}
      <AccentPanel accent="primary" className="order-2 flex min-h-0 flex-col p-0 pl-1 lg:order-none">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/40 p-3">
          <div className="flex rounded-lg border border-border/60 overflow-hidden">
            {(["weekly", "monthly"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn("px-4 py-1.5 text-xs font-semibold capitalize transition-colors",
                  mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
              >
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
          <div className="max-h-[20rem] min-h-0 flex-1 overflow-y-auto p-3 lg:max-h-none">
            {mode === "weekly" ? (
              <div className="space-y-1.5">
                {weeks.map(({ ws, group, reviewable, current, review }) => {
                  const done = written(review);
                  return (
                    <Link key={ws} href={`/trade-therapist/review/${ws}`}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/30",
                        // A closed week with nothing written is the only row
                        // that is actually asking for something.
                        reviewable && !done ? "border-warning/35 bg-warning/[0.04]" : "border-border/60"
                      )}>
                      {!reviewable ? <Lock className="w-4 h-4 shrink-0 text-primary/70" />
                        : done ? <CheckCircle2 className="w-4 h-4 shrink-0 text-success" />
                        : <Circle className="w-4 h-4 shrink-0 text-muted-foreground/40" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold leading-none transition-colors group-hover:text-primary">
                          Week {group.weekNum}{current && <span className="ml-1.5 font-normal text-primary">· current</span>}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground leading-none">{group.rangeLabel}</p>
                      </div>
                      <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">{group.wins}W {group.losses}L</span>
                      {/* How much of that week was traded to plan. */}
                      <span
                        title={
                          group.execRate == null
                            ? "No trade that week was rated on execution"
                            : `${group.goodExec} of ${group.goodExec + group.badExec} rated trades executed to plan`
                        }
                        className={cn("w-9 shrink-0 text-right text-[11px] font-semibold tabular-nums",
                          group.execRate == null ? "text-muted-foreground/40"
                            : group.execRate >= 70 ? "text-success"
                            : group.execRate >= 40 ? "text-warning"
                            : "text-destructive")}
                      >
                        {group.execRate == null ? "—" : `${group.execRate}%`}
                      </span>
                      <span className={cn("w-12 shrink-0 text-right text-xs font-bold tabular-nums",
                        group.totalR > 0 ? "text-success" : group.totalR < 0 ? "text-destructive" : "text-warning")}>
                        {formatTotalR(group.totalR)}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-1.5">
                {months.map(({ key, label, date }) => {
                  const r = (trades ?? []).filter((t) => isWithinInterval(new Date(t.date_time.slice(0, 10) + "T12:00:00"),
                    { start: startOfMonth(date), end: endOfMonth(date) })).reduce((s, t) => s + tradeR(t), 0);
                  return (
                    <Link key={key} href={`/trade-therapist/review/month/${key}`}
                      className="group flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/30">
                      <span className="flex-1 text-xs font-semibold transition-colors group-hover:text-primary">{label}</span>
                      <span className={cn("text-xs font-bold tabular-nums", r > 0 ? "text-success" : r < 0 ? "text-destructive" : "text-muted-foreground")}>{formatTotalR(r)}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </AccentPanel>

      {/* RIGHT — how the habit is holding, and the line you set for yourself */}
      <div className="order-1 flex min-h-0 flex-col gap-3 lg:order-none">
        {/* Progress you cannot miss: the streak in full size, the ratio beside
            it, and every tracked week as its own cell. */}
        <AccentPanel accent="primary" eyebrow="Consistency" title="Reviews kept" className="shrink-0">
          <div className="mt-3 flex items-end justify-between gap-4">
            <div className="flex items-baseline gap-2">
              <span className="text-[40px] font-black leading-none tabular-nums" style={{ color: streak > 0 ? "var(--primary)" : "var(--muted-foreground)" }}>
                {streak}
              </span>
              <span className="text-xs text-muted-foreground">
                week{streak === 1 ? "" : "s"} in a row
              </span>
            </div>
            <div className="text-right">
              <p className="text-lg font-black leading-none tabular-nums text-foreground">
                {doneCount}<span className="text-muted-foreground/50">/{finishedWeeks.length}</span>
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
weeks done · {pct}%
              </p>
            </div>
          </div>

          {/* One cell per week, oldest first — written, missed, or still open. */}
          <div className="mt-4 flex items-end gap-[3px]">
            {strip.map(({ ws, group, reviewable, current, review }) => {
              const done = written(review);
              const state = !reviewable ? "open" : done ? "done" : "missed";
              return (
                <Link
                  key={ws}
                  href={`/trade-therapist/review/${ws}`}
                  title={
                    `Week ${group.weekNum} · ${group.rangeLabel} — ` +
                    (state === "open" ? "still trading — review opens Friday" : state === "done" ? "reviewed" : "not written")
                  }
                  className={cn(
                    "group/cell h-9 flex-1 rounded-[3px] border transition-all duration-200 hover:-translate-y-0.5",
                    state === "done" && "border-transparent",
                    // A missed week still has to read as a week, not a gap.
                    state === "missed" && "border-border bg-muted-foreground/[0.09]",
                    state === "open" && "border-dashed border-primary/50 bg-primary/5"
                  )}
                  style={state === "done" ? { background: "var(--primary)", boxShadow: "0 0 10px color-mix(in oklch, var(--primary) 35%, transparent)" } : undefined}
                >
                  <span className="sr-only">Week {group.weekNum}</span>
                  {current && <span aria-hidden className="mx-auto mt-1 block h-1 w-1 rounded-full bg-primary" />}
                </Link>
              );
            })}
          </div>
          {/* The two end dates are the first thing to go when the row cannot
              hold the legend as well. */}
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[10px] text-muted-foreground/60">
            <span className="hidden sm:inline">{format(new Date(strip[0].ws + "T12:00:00"), "MMM d")}</span>
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-[2px]" style={{ background: "var(--primary)" }} /> written</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-[2px] border border-border bg-muted-foreground/[0.09]" /> missed</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-[2px] border border-dashed border-primary/50" /> still trading</span>
            </span>
            <span className="hidden sm:inline">this week</span>
          </div>
        </AccentPanel>

        {/* The one line worth carrying into the next session, then the trail of
            the ones before it — so repeating yourself becomes visible. */}
        <AccentPanel accent="cyan" eyebrow="Carried forward" title="What you told yourself" className="flex min-h-0 flex-1 flex-col">
          {!headline ? (
            <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 py-8 text-center">
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
              {/* The headline instruction, in your own words */}
              <Link
                href={`/trade-therapist/review/${latest.week_start}`}
                className="group block shrink-0 border-l-2 pl-3 transition-colors"
                style={{ borderColor: headline.tone }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: headline.tone }}>
                  {headline.label}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">&ldquo;{headline.text}&rdquo;</p>
                <p className="mt-2 text-[10px] text-muted-foreground/60 transition-colors group-hover:text-primary">
                  Week {latestGroup!.weekNum} · {latestGroup!.rangeLabel} →
                </p>
              </Link>

              {earlier.length > 0 && (
                <div className="mt-4 min-h-0 flex-1 overflow-y-auto border-t border-border/40 pt-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Before that
                  </p>
                  <div className="space-y-1">
                    {earlier.map((r) => {
                      const g = getWeekGroup(trades, r.week_start);
                      const line = r.prevention_plan || r.mistakes || r.lessons;
                      return (
                        <Link
                          key={r.week_start}
                          href={`/trade-therapist/review/${r.week_start}`}
                          title={line}
                          className="flex items-baseline gap-2.5 rounded-md px-1 py-1 transition-colors hover:bg-muted/30"
                        >
                          <span className="w-12 shrink-0 text-[10px] font-bold tabular-nums text-muted-foreground/70">
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
