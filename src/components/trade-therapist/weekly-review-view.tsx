"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  format, endOfWeek, startOfDay, startOfWeek, addWeeks, subWeeks,
} from "date-fns";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Loader2, Check, Lock, CheckCircle2,
  ChevronDown, ChevronUp, Trophy, History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getTrades, getWeeklyTradeReviews, getBestTradesOfDay, saveWeeklyTradeReview } from "@/lib/supabase/queries";
import { getWeekGroup, tradeR, formatTotalR } from "@/lib/journal/weeks";
import type { TradeJournalEntry, WeeklyTradeReview, BestTradeOfDay } from "@/lib/types";

const TURQUOISE = "#14B8A6";
const DAY_ABBR = ["Mon", "Tue", "Wed", "Thu", "Fri"];

/**
 * Weekly review — a day-by-day result strip (win / loss / break-even, and
 * whether the best trade was taken) plus the week's reflection. The numbers are
 * live until the week closes; the reflection is the only thing to fill in, and
 * completing it is what the MC Mindscore counts once the week has ended. A
 * toggle brings up the previous week's notes so you can check you held to them.
 */
export function WeeklyReviewView({ weekStart }: { weekStart: string }) {
  const [trades, setTrades] = useState<TradeJournalEntry[] | null>(null);
  const [review, setReview] = useState<WeeklyTradeReview | null>(null);
  const [prevReview, setPrevReview] = useState<WeeklyTradeReview | null>(null);
  const [bestByDay, setBestByDay] = useState<Record<string, BestTradeOfDay>>({});

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

  const weekEnd = useMemo(() => endOfWeek(monday, { weekStartsOn: 1 }), [monday]);
  const ended = weekEnd < startOfDay(new Date());

  const group = useMemo(() => (trades ? getWeekGroup(trades, weekStart) : null), [trades, weekStart]);

  const dirty =
    wentWell !== (review?.lessons ?? "") ||
    toImprove !== (review?.mistakes ?? "") ||
    focus !== (review?.prevention_plan ?? "");
  const complete = Boolean(review && (review.lessons || review.mistakes || review.prevention_plan));
  const prevWritten = Boolean(prevReview && (prevReview.lessons || prevReview.mistakes || prevReview.prevention_plan));

  async function save() {
    setSaving(true); setError(false);
    try {
      const rev = await saveWeeklyTradeReview({
        week_start: weekStart, lessons: wentWell, mistakes: toImprove,
        prevention_plan: focus, best_trade_days: review?.best_trade_days ?? {},
      });
      setReview(rev); setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch { setError(true); } finally { setSaving(false); }
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
    <div className="space-y-4">
      {/* Header */}
      <div>
        <Link href="/trade-therapist?tab=reviews" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to reviews
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
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
          <div className="text-right">
            <p className={cn("text-3xl font-black leading-none", rTone)}>{formatTotalR(group.totalR)}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mt-1">Week R</p>
          </div>
        </div>
      </div>

      {/* Status banner */}
      <div className={cn("flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs",
        ended ? "border-success/25 bg-success/5" : "border-primary/25 bg-primary/5")}>
        {ended ? <CheckCircle2 className="w-4 h-4 text-success shrink-0" /> : <Lock className="w-4 h-4 text-primary shrink-0" />}
        <p className="text-muted-foreground">
          {ended
            ? <>This week is closed. {complete ? "Reflection complete — it counts toward your MC Mindscore." : "Add your reflection below to complete it and count it toward your MC Mindscore."}</>
            : <>This week is still running. It finalises on Sunday — only then does the review count toward your MC Mindscore.</>}
        </p>
      </div>

      {/* Day by day — result + whether the best trade was taken */}
      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <p className="text-sm font-semibold mb-3">Day by day</p>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {group.days.map((d, i) => {
            const has = d.trades.length > 0;
            const r = d.trades.reduce((s, t) => s + tradeR(t), 0);
            const outcome = !has ? null : r > 0 ? "win" : r < 0 ? "loss" : "be";
            const best = bestByDay[d.date];
            const bestTaken = best?.taken_was_best;
            const bestLogged = best && !bestTaken && (
              (best.post_market_analysis ?? "").trim() || (best.notes ?? "").trim() || (best.screenshot_groups ?? []).some((g) => g.urls.length > 0)
            );
            return (
              <div key={d.date} className={cn("rounded-xl border p-3 flex flex-col items-center gap-2",
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
                  <span className="text-lg font-black leading-none text-muted-foreground/30">—</span>
                )}
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold leading-none",
                  bestTaken ? "bg-success/15 text-success"
                    : bestLogged ? "bg-primary/12 text-primary"
                    : "bg-muted/40 text-muted-foreground/60")}>
                  <Trophy className="w-2.5 h-2.5" />
                  {bestTaken ? "Best taken" : bestLogged ? "Best logged" : "No best"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Previous week reference — did I hold to it? */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        <button onClick={() => setShowPrev((v) => !v)}
          className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/30">
          <History className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-semibold flex-1">Last week&apos;s notes — did you hold to them?</span>
          {showPrev ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {showPrev && (
          <div className="border-t border-border/50 px-4 py-3.5 text-xs">
            {!prevWritten ? (
              <p className="text-muted-foreground/70">No reflection was written for last week.</p>
            ) : (
              <div className="space-y-2">
                {prevReview?.mistakes && (
                  <p className="leading-snug"><span className="font-semibold text-destructive">To improve: </span><span className="text-muted-foreground">{prevReview.mistakes}</span></p>
                )}
                {prevReview?.prevention_plan && (
                  <p className="leading-snug"><span className="font-semibold text-primary">Focus set: </span><span className="text-muted-foreground">{prevReview.prevention_plan}</span></p>
                )}
                {prevReview?.lessons && (
                  <p className="leading-snug"><span className="font-semibold text-success">Went well: </span><span className="text-muted-foreground">{prevReview.lessons}</span></p>
                )}
                <p className="pt-1 text-[11px] text-muted-foreground/70">Use &quot;What went well&quot; and &quot;What to improve&quot; below to note whether you held to this.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reflection — compact, problem-first. One short line per field. */}
      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold">Your reflection</p>
          <span className="text-[11px] text-muted-foreground/80">One line each</span>
        </div>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
          {[
            { label: "The problem", value: toImprove, set: setToImprove, ph: "The one mistake to fix…", tone: "var(--destructive)" },
            { label: "What worked", value: wentWell, set: setWentWell, ph: "One thing done well…", tone: "var(--success)" },
            { label: "Focus next week", value: focus, set: setFocus, ph: "One rule to hold…", tone: "#14B8A6" },
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
                placeholder={f.ph}
                className="w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground/40"
              />
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs">
            {error ? <span className="text-destructive">Could not save.</span>
              : saved ? <span className="inline-flex items-center gap-1.5 text-success"><Check className="w-3.5 h-3.5" /> Saved</span>
              : null}
          </span>
          <button
            onClick={save}
            disabled={saving || !dirty}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-px disabled:opacity-40 disabled:hover:translate-y-0"
            style={{ background: TURQUOISE, boxShadow: "0 2px 12px rgba(20,184,166,0.26)" }}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {complete ? "Save reflection" : "Complete review"}
          </button>
        </div>
      </div>
    </div>
  );
}
