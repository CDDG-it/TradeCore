"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  format, startOfWeek, addWeeks, subWeeks,
} from "date-fns";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Loader2, Check, Lock,
  ChevronDown, ChevronUp, History,
} from "lucide-react";
import { getTrades, getWeeklyTradeReviews, getBestTradesOfDay, saveWeeklyTradeReview, type BestTradeListRow } from "@/lib/supabase/queries";
import { getWeekGroup, reviewOpensOn, isReviewOpen } from "@/lib/journal/weeks";
import type { TradeJournalEntry, WeeklyTradeReview } from "@/lib/types";
import { buildDayRecaps } from "@/lib/reviews/day-recap";
import { WeeklyDayTimeline } from "@/components/trade-therapist/weekly-day-timeline";

const TURQUOISE = "var(--primary)";

/**
 * Weekly review: five chronological day stories, followed by one reflection.
 * The day stories read existing Journal and Post Market records; the reflection
 * is the only new writing and counts toward MC Mindscore after the week closes.
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

      {recaps && <WeeklyDayTimeline days={group.days} recaps={recaps} bestByDay={bestByDay} execRate={group.execRate} goodExec={group.goodExec} badExec={group.badExec} totalR={group.totalR} />}

      {/* Reflection: compact, problem-first. One short line per field. */}
      <div className="weekly-day-card weekly-day-card--quiet rounded-2xl p-4">
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
