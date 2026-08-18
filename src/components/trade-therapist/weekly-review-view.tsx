"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  format, endOfWeek, startOfDay, isWithinInterval, startOfWeek, addWeeks, subWeeks,
} from "date-fns";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Loader2, Check, Lock, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getTrades, getWeeklyTradeReviews, saveWeeklyTradeReview } from "@/lib/supabase/queries";
import { getWeekGroup, tradeR, formatTotalR, instrumentName } from "@/lib/journal/weeks";
import { detectPatterns } from "@/lib/psych-edge/patterns";
import { PATTERN_LABELS } from "@/lib/psych-edge/patterns";
import type { TradeJournalEntry, WeeklyTradeReview } from "@/lib/types";

const TURQUOISE = "#14B8A6";
const DAY_ABBR = ["Mon", "Tue", "Wed", "Thu", "Fri"];

function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/15 px-3 py-2.5 text-center">
      <p className={cn("text-xl font-black tabular-nums leading-none", tone)} style={!tone ? { color: TURQUOISE } : undefined}>{value}</p>
      <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * Weekly review — an auto-synced summary of the week plus a short reflection.
 * The numbers compute live from the week's trades; once the week ends they are
 * final. The reflection is the only thing to fill in, and completing it is what
 * the MC Mindscore counts — and only after the week has closed.
 */
export function WeeklyReviewView({ weekStart }: { weekStart: string }) {
  const [trades, setTrades] = useState<TradeJournalEntry[] | null>(null);
  const [review, setReview] = useState<WeeklyTradeReview | null>(null);

  const [wentWell, setWentWell] = useState("");
  const [toImprove, setToImprove] = useState("");
  const [focus, setFocus] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([getTrades(), getWeeklyTradeReviews()]).then(([t, reviews]) => {
      setTrades(t);
      const r = reviews.find((rev) => rev.week_start === weekStart) ?? null;
      setReview(r);
      setWentWell(r?.lessons ?? "");
      setToImprove(r?.mistakes ?? "");
      setFocus(r?.prevention_plan ?? "");
    });
  }, [weekStart]);

  const valid = /^\d{4}-\d{2}-\d{2}$/.test(weekStart);
  const monday = useMemo(() => (valid ? new Date(weekStart + "T12:00:00") : new Date()), [weekStart, valid]);
  const weekEnd = useMemo(() => endOfWeek(monday, { weekStartsOn: 1 }), [monday]);
  const ended = weekEnd < startOfDay(new Date());

  const stats = useMemo(() => {
    if (!trades) return null;
    const group = getWeekGroup(trades, weekStart);
    const weekTrades = group.trades;
    const wins = weekTrades.filter((t) => t.result === "win");
    const avgRR = wins.length ? (wins.reduce((s, t) => s + t.rr, 0) / wins.length).toFixed(1) : "—";
    const good = weekTrades.filter((t) => t.execution_quality === "good").length;
    const rated = good + weekTrades.filter((t) => t.execution_quality === "bad").length;
    const execRate = rated ? Math.round((good / rated) * 100) : null;
    const winRate = weekTrades.length ? Math.round((wins.length / weekTrades.length) * 100) : null;

    const best = [...weekTrades].sort((a, b) => tradeR(b) - tradeR(a))[0] ?? null;
    const worst = weekTrades.length > 1 ? [...weekTrades].sort((a, b) => tradeR(a) - tradeR(b))[0] : null;

    // Patterns that fired inside this week.
    const patterns = detectPatterns(trades, [])
      .filter((e) => isWithinInterval(new Date(e.date + "T12:00:00"), { start: monday, end: weekEnd }));
    const patternCounts = new Map<string, number>();
    patterns.forEach((e) => patternCounts.set(e.type, (patternCounts.get(e.type) ?? 0) + 1));

    return { group, avgRR, execRate, winRate, best, worst, patternCounts };
  }, [trades, weekStart, monday, weekEnd]);

  const dirty =
    wentWell !== (review?.lessons ?? "") ||
    toImprove !== (review?.mistakes ?? "") ||
    focus !== (review?.prevention_plan ?? "");

  const complete = Boolean(review && (review.lessons || review.mistakes || review.prevention_plan));

  async function save() {
    setSaving(true); setError(false);
    try {
      const rev = await saveWeeklyTradeReview({
        week_start: weekStart,
        lessons: wentWell,
        mistakes: toImprove,
        prevention_plan: focus,
        best_trade_days: review?.best_trade_days ?? {},
      });
      setReview(rev);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  if (!valid) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-sm">Invalid week.</p>
        <Link href="/trade-therapist?tab=reviews" className="text-primary text-sm hover:underline mt-2 inline-block">Back to reviews</Link>
      </div>
    );
  }
  if (!trades || !stats) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  const { group } = stats;
  const rTone = group.totalR > 0 ? "text-success" : group.totalR < 0 ? "text-destructive" : "text-warning";
  const prevWeek = format(subWeeks(monday, 1), "yyyy-MM-dd");
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
            <Link href={`/trade-therapist/review/${prevWeek}`} aria-label="Previous week"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                Week {group.weekNum} · {group.year}
              </span>
              <h1 className="text-2xl font-black tracking-tight mt-1.5">Weekly review</h1>
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
            ? <>This week is closed and its numbers are final. {complete ? "Reflection complete — it counts toward your MC Mindscore." : "Add your reflection below to complete it and count it toward your MC Mindscore."}</>
            : <>This week is still running. The numbers update live and finalise on Sunday — only then does the review count toward your MC Mindscore.</>}
        </p>
      </div>

      {/* Auto stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <Metric label="Trades" value={String(group.trades.length)} tone="text-foreground" />
        <Metric label="Win rate" value={stats.winRate == null ? "—" : `${stats.winRate}%`} />
        <Metric label="Avg R:R" value={stats.avgRR === "—" ? "—" : `${stats.avgRR}R`} tone="text-primary" />
        <Metric label="Good exec" value={stats.execRate == null ? "—" : `${stats.execRate}%`} tone="text-success" />
        <Metric label="Wins" value={String(group.wins)} tone="text-success" />
        <Metric label="Losses" value={String(group.losses)} tone="text-destructive" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2 items-start">
        {/* Per-day breakdown */}
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold mb-2.5">Day by day</p>
          <div className="space-y-1.5">
            {group.days.map((d, i) => {
              const r = d.trades.reduce((s, t) => s + tradeR(t), 0);
              const has = d.trades.length > 0;
              return (
                <div key={d.date} className="flex items-center gap-3">
                  <span className="w-9 shrink-0 text-[11px] font-semibold text-muted-foreground">{DAY_ABBR[i]}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted/40 overflow-hidden relative">
                    {has && (
                      <div className={cn("h-full rounded-full", r >= 0 ? "bg-success" : "bg-destructive")}
                        style={{ width: `${Math.min(100, Math.abs(r) / Math.max(1, Math.max(...group.days.map((x) => Math.abs(x.trades.reduce((s, t) => s + tradeR(t), 0))))) * 100)}%` }} />
                    )}
                  </div>
                  <span className={cn("w-12 shrink-0 text-right text-[11px] font-bold tabular-nums",
                    !has ? "text-muted-foreground/40" : r > 0 ? "text-success" : r < 0 ? "text-destructive" : "text-warning")}>
                    {has ? formatTotalR(r) : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Highlights + patterns */}
        <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold mb-2">Highlights</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-success/25 bg-success/5 px-3 py-2">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Best trade</p>
                <p className="mt-1 text-xs font-bold text-success">{stats.best ? `${instrumentName(stats.best.instrument)} ${formatTotalR(tradeR(stats.best))}` : "—"}</p>
              </div>
              <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Worst trade</p>
                <p className="mt-1 text-xs font-bold text-destructive">{stats.worst ? `${instrumentName(stats.worst.instrument)} ${formatTotalR(tradeR(stats.worst))}` : "—"}</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">Behaviour flagged</p>
            {stats.patternCounts.size === 0 ? (
              <p className="text-xs text-muted-foreground/70">No behavioural patterns detected this week.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {[...stats.patternCounts.entries()].map(([type, count]) => (
                  <span key={type} className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning">
                    {PATTERN_LABELS[type as keyof typeof PATTERN_LABELS]} · {count}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reflection */}
      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <p className="text-sm font-semibold">Your reflection</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">The only part to fill in — three short notes to close the week.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {[
            { label: "What went well", value: wentWell, set: setWentWell, ph: "Held the plan on Tuesday, sat out the chop…" },
            { label: "What to improve", value: toImprove, set: setToImprove, ph: "Sized up after the Monday loss…" },
            { label: "Focus next week", value: focus, set: setFocus, ph: "One setup, no trades before the open…" },
          ].map((f) => (
            <div key={f.label}>
              <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">{f.label}</p>
              <textarea
                value={f.value}
                onChange={(e) => { f.set(e.target.value); setSaved(false); }}
                rows={4}
                placeholder={f.ph}
                className="w-full resize-y rounded-lg border border-border/60 bg-background/40 px-3 py-2.5 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/50"
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
