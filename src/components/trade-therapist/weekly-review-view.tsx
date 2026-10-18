"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  format, startOfWeek, addWeeks, subWeeks,
} from "date-fns";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Loader2, Check, Lock,
  ChevronDown, ChevronUp, Trophy, History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getTrades, getWeeklyTradeReviews, getBestTradesOfDay, saveWeeklyTradeReview, type BestTradeListRow } from "@/lib/supabase/queries";
import { getWeekGroup, tradeR, formatTotalR, reviewOpensOn, isReviewOpen } from "@/lib/journal/weeks";
import type { TradeJournalEntry, WeeklyTradeReview } from "@/lib/types";
import { bestTradeLogged, buildDayRecaps, summarizeDayRecaps } from "@/lib/reviews/day-recap";
import { DailyBreakdown } from "@/components/trade-therapist/daily-breakdown";

const TURQUOISE = "var(--primary)";
const DAY_ABBR = ["Mon", "Tue", "Wed", "Thu", "Fri"];

/**
 * Weekly review: a day-by-day result strip (win / loss / break-even, and
 * whether the best trade was taken) plus the week's reflection. The numbers are
 * live until the week closes; the reflection is the only thing to fill in, and
 * completing it is what the MC Mindscore counts once the trading week is over. A
 * toggle brings up the previous week's notes so you can check you held to them.
 */
export function WeeklyReviewView({ weekStart }: { weekStart: string }) {
  const router = useRouter();
  const [trades, setTrades] = useState<TradeJournalEntry[] | null>(null);
  const [review, setReview] = useState<WeeklyTradeReview | null>(null);
  const [prevReview, setPrevReview] = useState<WeeklyTradeReview | null>(null);
  const [bestByDay, setBestByDay] = useState<Record<string, BestTradeListRow>>({});

  const [wentWell, setWentWell] = useState("");
  const [toImprove, setToImprove] = useState("");
  const [focus, setFocus] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);
  const [showPrev, setShowPrev] = useState(false);

  const valid = /^\d{4}-\d{2}-\d{2}$/.test(weekStart);
  const monday = useMemo(() => (valid ? new Date(weekStart + "T12:00:00") : new Date()), [weekStart, valid]);
  const prevWeekKey = useMemo(() => format(subWeeks(monday, 1), "yyyy-MM-dd"), [monday]);

  useEffect(() => {
    Promise.all([getTrades(), getWeeklyTradeReviews(), getBestTradesOfDay()]).then(([t, reviews, best]) => {
      setTrades(t);
      const r = reviews.find((rev) => rev.week_start === weekStart) ?? null;
      setReview(r);
      setPrevReview(reviews.find((rev) => rev.week_start === prevWeekKey) ?? null);
      setWentWell(r?.lessons ?? "");
      setToImprove(r?.mistakes ?? "");
      setFocus(r?.prevention_plan ?? "");
      setBestByDay(Object.fromEntries(best.map((b) => [b.date.slice(0, 10), b])));
    });
  }, [weekStart, prevWeekKey]);

  // The trading week is what matters, not the calendar one: the review opens on
  // Friday, and only from then can it be saved or counted by the Mindscore.
  const opensOn = useMemo(() => reviewOpensOn(weekStart), [weekStart]);
  const open = useMemo(() => isReviewOpen(weekStart), [weekStart]);

  const group = useMemo(() => (trades ? getWeekGroup(trades, weekStart) : null), [trades, weekStart]);
  // What each day already says in the journal and the Post Market review, laid
  // out so the week's reflection can be written from it.
  const recaps = useMemo(() => {
    if (!group || !trades) return null;
    return buildDayRecaps(group.days, new Map(trades.map((t) => [t.id, t])), bestByDay);
  }, [group, trades, bestByDay]);

  const dirty =
    wentWell !== (review?.lessons ?? "") ||
    toImprove !== (review?.mistakes ?? "") ||
    focus !== (review?.prevention_plan ?? "");
  const complete = Boolean(review && (review.lessons || review.mistakes || review.prevention_plan));
  const prevWritten = Boolean(prevReview && (prevReview.lessons || prevReview.mistakes || prevReview.prevention_plan));

  async function save() {
    if (!open) return;
    setSaving(true); setError(false);
    try {
      const rev = await saveWeeklyTradeReview({
        week_start: weekStart, lessons: wentWell, mistakes: toImprove,
        prevention_plan: focus, best_trade_days: review?.best_trade_days ?? {},
      });
      setReview(rev);
      // Done here: send them back to the reviews overview rather than leaving
      // them parked on the review they just finished.
      router.push("/trade-therapist?tab=reviews");
    } catch { setError(true); setSaving(false); }
  }

  if (!valid) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-sm">Invalid week.</p>
        <Link href="/trade-therapist?tab=reviews" className="text-primary text-sm hover:underline mt-2 inline-block">Back to reviews</Link>
      </div>
    );
  }
  if (!trades || !group) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  const rTone = group.totalR > 0 ? "text-success" : group.totalR < 0 ? "text-destructive" : "text-warning";
  const nextWeek = format(addWeeks(monday, 1), "yyyy-MM-dd");
  const nextDisabled = startOfWeek(addWeeks(monday, 1), { weekStartsOn: 1 }) > new Date();

  return (
    <div className="weekly-review-page space-y-4">
      {/* Header */}
      <div>
        <Link href="/trade-therapist?tab=reviews" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to reviews
        </Link>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2">
            <Link href={`/trade-therapist/review/${prevWeekKey}`} aria-label="Previous week"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                Week {group.weekNum} · {group.year}
              </span>
              <h1 className="text-xl font-black tracking-tight mt-1.5">Weekly review</h1>
              <p className="text-sm text-muted-foreground">{group.rangeLabel}</p>
            </div>
            {!nextDisabled && (
              <Link href={`/trade-therapist/review/${nextWeek}`} aria-label="Next week"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Day by day: result + whether the best trade was taken */}
      <div className="rounded-2xl border border-border/60 bg-card p-3 sm:p-4">
        <p className="mb-2 text-sm font-semibold">Day by day</p>
        <div className="grid grid-cols-5 gap-1.5 lg:grid-cols-[repeat(5,minmax(0,1fr))_minmax(10rem,auto)] lg:gap-2">
          {group.days.map((d, i) => {
            const has = d.trades.length > 0;
            const r = d.trades.reduce((s, t) => s + tradeR(t), 0);
            const outcome = !has ? null : r > 0 ? "win" : r < 0 ? "loss" : "be";
            const best = bestByDay[d.date];
            const bestTaken = best?.taken_was_best;
            // Charts are not part of this test: the list read leaves
            // `screenshot_groups` behind so a week strip never pulls every
            // reviewed day's images. Words still count, as they did.
            const bestLogged = bestTradeLogged(best);
            return (
              <div key={d.date} className={cn("flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2",
                outcome === "win" ? "border-success/25 bg-success/5"
                  : outcome === "loss" ? "border-destructive/25 bg-destructive/5"
                  : outcome === "be" ? "border-warning/25 bg-warning/5"
                  : "border-border/40 bg-muted/10")}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{DAY_ABBR[i]}</p>
                {outcome ? (
                  <span className={cn("text-lg font-black leading-none",
                    outcome === "win" ? "text-success" : outcome === "loss" ? "text-destructive" : "text-warning")}>
                    {outcome === "win" ? "W" : outcome === "loss" ? "L" : "BE"}
                  </span>
                ) : (
                  <span className="text-lg font-black leading-none text-muted-foreground/30">-</span>
                )}
                <span className={cn("inline-flex max-w-full items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none",
                  bestTaken ? "bg-success/15 text-success"
                    : bestLogged ? "bg-primary/12 text-primary"
                    : "bg-muted/40 text-muted-foreground/60")}>
                  <Trophy className="size-2.5 shrink-0" />
                  <span className="truncate">{bestTaken ? "Best taken" : bestLogged ? "Best logged" : "No best"}</span>
                </span>
              </div>
            );
          })}
          <div className="col-span-5 flex items-center justify-end gap-5 border-t border-border/50 pt-2 lg:col-span-1 lg:flex-col lg:items-end lg:justify-center lg:gap-2 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
            <div className="text-right">
              <p className={cn("text-lg font-black leading-none tabular-nums", group.execRate == null ? "text-muted-foreground/50" : group.execRate >= 70 ? "text-success" : group.execRate >= 40 ? "text-warning" : "text-destructive")}>{group.execRate == null ? "-" : `${group.execRate}%`}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground/70">Execution {group.goodExec + group.badExec > 0 && <span className="normal-case tracking-normal tabular-nums">{group.goodExec}/{group.goodExec + group.badExec}</span>}</p>
            </div>
            <div className="text-right">
              <p className={cn("text-lg font-black leading-none tabular-nums", rTone)}>{formatTotalR(group.totalR)}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground/70">Week R</p>
            </div>
          </div>
        </div>
      </div>

      {recaps && <DailyBreakdown recaps={recaps} summary={summarizeDayRecaps(recaps)} />}

      {/* Reflection: compact, problem-first. One short line per field. */}
      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">Your reflection</p>
          <button type="button" onClick={() => setShowPrev((v) => !v)} aria-expanded={showPrev}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground">
            <History className="size-3.5 text-primary" /> Last week&apos;s notes
            {showPrev ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
        </div>
        {showPrev && (
          <div className="mt-3 rounded-xl border border-border/50 bg-background/40 p-3 text-xs">
            {!prevWritten ? <p className="text-muted-foreground/70">No reflection was written for last week.</p> : (
              <div className="space-y-2">
                {prevReview?.mistakes && <p className="leading-snug"><span className="font-semibold text-destructive">The problem: </span><span className="text-muted-foreground">{prevReview.mistakes}</span></p>}
                {prevReview?.prevention_plan && <p className="leading-snug"><span className="font-semibold text-primary">Focus set: </span><span className="text-muted-foreground">{prevReview.prevention_plan}</span></p>}
                {prevReview?.lessons && <p className="leading-snug"><span className="font-semibold text-success">What worked: </span><span className="text-muted-foreground">{prevReview.lessons}</span></p>}
                <p className="pt-1 text-[11px] text-muted-foreground/70">Did you hold to these? Use your reflection below to capture what changed.</p>
              </div>
            )}
          </div>
        )}
        <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
          {[
            { label: "The problem", value: toImprove, set: setToImprove, ph: "The one mistake to fix...", tone: "var(--destructive)" },
            { label: "What worked", value: wentWell, set: setWentWell, ph: "One thing done well...", tone: "var(--success)" },
            { label: "Focus next week", value: focus, set: setFocus, ph: "One rule to hold...", tone: "var(--primary)" },
          ].map((f) => (
            <div
              key={f.label}
              className="rounded-xl border border-border/50 bg-background/40 p-2.5 transition-colors focus-within:border-primary/40"
            >
              <div className="mb-1.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: f.tone }} />
                <p className="text-[11px] font-semibold text-muted-foreground">{f.label}</p>
              </div>
              <textarea
                value={f.value}
                onChange={(e) => { f.set(e.target.value); setSaved(false); }}
                rows={3}
                disabled={!open}
                placeholder={open ? f.ph : "Opens Friday"}
                className="w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground/40 disabled:cursor-not-allowed"
              />
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs">
            {error ? <span className="text-destructive">Could not save.</span>
              : saved ? <span className="inline-flex items-center gap-1.5 text-success"><Check className="w-3.5 h-3.5" /> Saved</span>
              : !open ? <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Lock className="w-3.5 h-3.5" /> Unlocks {format(opensOn, "EEE d MMM")}</span>
              : null}
          </span>
          <button
            onClick={save}
            title={open ? undefined : `The review opens on ${format(opensOn, "EEEE d MMMM")}, once the trading week is over`}
            disabled={saving || !dirty || !open}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-px disabled:opacity-40 disabled:hover:translate-y-0"
            style={{ background: TURQUOISE, boxShadow: "0 2px 12px color-mix(in oklch, var(--primary) 26%, transparent)" }}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {!open ? "Opens Friday" : complete ? "Save reflection" : "Complete review"}
          </button>
        </div>
      </div>
    </div>
  );
}
