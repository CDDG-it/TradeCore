"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  TrendingUp, TrendingDown, Loader2, Check, ExternalLink,
  ShieldCheck, Repeat, Target, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getPreMarketExercise, savePreMarketExercise } from "@/lib/supabase/queries";
import { instrumentName } from "@/lib/journal/weeks";
import type { TradeJournalEntry } from "@/lib/types";

const TURQUOISE = "#14B8A6";

/** Most recent `n` trades matching a result, newest first. */
function recent(trades: TradeJournalEntry[], result: "win" | "loss", n: number): TradeJournalEntry[] {
  return trades
    .filter((t) => t.result === result)
    .slice()
    .sort((a, b) => (a.date_time > b.date_time ? -1 : 1))
    .slice(0, n);
}

/** Signed R for a trade, formatted for a badge. */
function tradeRLabel(t: TradeJournalEntry): string {
  if (t.result === "win") return `+${t.rr}R`;
  if (t.result === "loss") return "-1R";
  return "0R";
}

/**
 * Pre-Market Exercises — a pre-session discipline drill.
 *
 * Before the open the trader looks back at their two most recent losses and two
 * most recent wins, then commits in writing to a plan for the day: how each
 * mistake will be prevented, how each thing that worked will be repeated. The
 * act of writing the plan before trading is what reduces the odds of repeating
 * the same error. Persisted per calendar day.
 */
export function PreMarketExercises({
  trades, date,
}: {
  trades: TradeJournalEntry[];
  date: string; // yyyy-MM-dd
}) {
  const losses = useMemo(() => recent(trades, "loss", 2), [trades]);
  const wins = useMemo(() => recent(trades, "win", 2), [trades]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [lossPlans, setLossPlans] = useState<Record<string, string>>({});
  const [winPlans, setWinPlans] = useState<Record<string, string>>({});
  const [focus, setFocus] = useState("");
  const [loaded, setLoaded] = useState<{
    loss_plans: Record<string, string>;
    win_plans: Record<string, string>;
    focus: string;
  } | null>(null);

  useEffect(() => {
    setLoading(true); setError(null); setSaved(false);
    getPreMarketExercise(date)
      .then((ex) => {
        const base = ex
          ? { loss_plans: ex.loss_plans, win_plans: ex.win_plans, focus: ex.focus }
          : { loss_plans: {}, win_plans: {}, focus: "" };
        setLossPlans(base.loss_plans);
        setWinPlans(base.win_plans);
        setFocus(base.focus);
        setLoaded(base);
      })
      .finally(() => setLoading(false));
  }, [date]);

  const dirty =
    JSON.stringify(lossPlans) !== JSON.stringify(loaded?.loss_plans ?? {}) ||
    JSON.stringify(winPlans) !== JSON.stringify(loaded?.win_plans ?? {}) ||
    focus !== (loaded?.focus ?? "");
  const hasContent =
    focus.trim().length > 0 ||
    Object.values(lossPlans).some((v) => v.trim()) ||
    Object.values(winPlans).some((v) => v.trim());

  async function save() {
    setSaving(true); setError(null);
    try {
      const clean = (m: Record<string, string>) =>
        Object.fromEntries(Object.entries(m).filter(([, v]) => v.trim()).map(([k, v]) => [k, v.trim()]));
      const payload = { date, loss_plans: clean(lossPlans), win_plans: clean(winPlans), focus: focus.trim() };
      await savePreMarketExercise(payload);
      setLoaded({ loss_plans: payload.loss_plans, win_plans: payload.win_plans, focus: payload.focus });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Could not save. Run the pre_market_exercise migration in Supabase.");
    } finally {
      setSaving(false);
    }
  }

  const noHistory = losses.length === 0 && wins.length === 0;

  return (
    <div className="space-y-5">
      {/* Intro */}
      <div className="rounded-2xl border border-border/60 bg-gradient-to-b from-muted/25 to-transparent p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10">
            <Target className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-tight">Warm up before the open</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              Your last two losses and two wins are below. Write down, in your own
              words, how you will stop each mistake from repeating today — and how
              you will reproduce what worked. Committing to the plan before you
              trade is what keeps you from making the same error twice.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : noHistory ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card px-6 py-12 text-center">
          <p className="text-sm font-medium">No trades to review yet</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
            Once you have logged some wins and losses in the Journal, they will
            appear here for your pre-market review.
          </p>
          <Link
            href="/journal"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 text-xs font-semibold transition-colors hover:border-primary/40 hover:text-primary"
          >
            Go to Journal <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <>
          {/* Today's focus */}
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Today's one focus</p>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Distil the review into a single instruction you will hold all session.
            </p>
            <input
              value={focus}
              onChange={(e) => { setFocus(e.target.value); setSaved(false); }}
              placeholder="No entry without a confirmed level. Wait for the retest."
              className="mt-3 w-full rounded-lg border border-border/60 bg-background/40 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/50"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2 items-start">
            {/* Losses to prevent */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-destructive" />
                <h3 className="text-sm font-semibold">Prevent these losses</h3>
              </div>
              {losses.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border/60 bg-card px-4 py-8 text-center text-xs text-muted-foreground">
                  No losses on record. Keep protecting your downside.
                </p>
              ) : (
                losses.map((t) => (
                  <ReviewCard
                    key={t.id}
                    trade={t}
                    tone="loss"
                    prompt="How I'll prevent this today"
                    placeholder="I over-sized after two green trades. Today I cap risk at 1R per trade, no exceptions."
                    value={lossPlans[t.id] ?? ""}
                    onChange={(v) => { setLossPlans((p) => ({ ...p, [t.id]: v })); setSaved(false); }}
                  />
                ))
              )}
            </section>

            {/* Wins to repeat */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-success" />
                <h3 className="text-sm font-semibold">Repeat these wins</h3>
              </div>
              {wins.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border/60 bg-card px-4 py-8 text-center text-xs text-muted-foreground">
                  No wins on record yet. Your best trades will show here.
                </p>
              ) : (
                wins.map((t) => (
                  <ReviewCard
                    key={t.id}
                    trade={t}
                    tone="win"
                    prompt="How I'll repeat this today"
                    placeholder="Waited for the pullback into the level and let it run to target. Same patience today."
                    value={winPlans[t.id] ?? ""}
                    onChange={(v) => { setWinPlans((p) => ({ ...p, [t.id]: v })); setSaved(false); }}
                  />
                ))
              )}
            </section>
          </div>

          {/* Save bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs">
              {error ? <span className="text-destructive">{error}</span>
                : saved ? <span className="inline-flex items-center gap-1.5 text-success"><Check className="h-3.5 w-3.5" /> Plan saved for {format(new Date(date + "T12:00:00"), "MMM d")}</span>
                : null}
            </div>
            <button
              onClick={save}
              disabled={saving || !dirty || !hasContent}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-px disabled:opacity-40 disabled:hover:translate-y-0"
              style={{ background: TURQUOISE, boxShadow: "0 2px 12px rgba(20,184,166,0.26)" }}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {loaded && hasContent && !dirty ? "Saved" : "Save today's plan"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** One reviewed trade: the facts of what happened, then the trader's plan. */
function ReviewCard({
  trade, tone, prompt, placeholder, value, onChange,
}: {
  trade: TradeJournalEntry;
  tone: "win" | "loss";
  prompt: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const t = trade;
  const isWin = tone === "win";
  // The most instructive fields to surface, in order of usefulness.
  const takeaways: { label: string; text: string }[] = [];
  if (isWin) {
    if (t.confluences?.length) takeaways.push({ label: "What lined up", text: t.confluences.join(" · ") });
    if (t.execution_notes?.trim()) takeaways.push({ label: "Execution", text: t.execution_notes.trim() });
    if (t.lessons?.trim()) takeaways.push({ label: "Lesson", text: t.lessons.trim() });
  } else {
    if (t.mistakes?.trim()) takeaways.push({ label: "Mistake", text: t.mistakes.trim() });
    if (t.psychology_notes?.trim()) takeaways.push({ label: "Mindset", text: t.psychology_notes.trim() });
    if (t.lessons?.trim()) takeaways.push({ label: "Lesson", text: t.lessons.trim() });
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      {/* Trade header */}
      <Link
        href={`/journal/${t.id}`}
        className="group flex items-center gap-2.5 rounded-lg border border-border/60 px-3 py-2 transition-colors hover:border-primary/40 hover:bg-muted/30"
      >
        {t.direction === "long"
          ? <TrendingUp className="h-4 w-4 shrink-0 text-success" />
          : <TrendingDown className="h-4 w-4 shrink-0 text-destructive" />}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold leading-none transition-colors group-hover:text-primary">{instrumentName(t.instrument)}</p>
          <p className="mt-1 text-[10px] text-muted-foreground leading-none">
            {format(new Date(t.date_time.slice(0, 10) + "T12:00:00"), "MMM d")} · {t.session} session
          </p>
        </div>
        <span className={cn("shrink-0 text-xs font-bold tabular-nums",
          isWin ? "text-success" : "text-destructive")}>
          {tradeRLabel(t)}
        </span>
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary" />
      </Link>

      {/* Takeaways from the trade's own journal entry */}
      <div className="mt-3 space-y-2">
        {takeaways.length === 0 ? (
          <p className="text-[11px] italic text-muted-foreground/70">
            No notes were logged on this trade — write your plan from memory.
          </p>
        ) : (
          takeaways.map((tk) => (
            <div key={tk.label} className="flex gap-2">
              <span className={cn(
                "mt-px shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                isWin ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive"
              )}>
                {tk.label}
              </span>
              <p className="text-[12px] leading-snug text-foreground/80">{tk.text}</p>
            </div>
          ))
        )}
      </div>

      {/* The plan */}
      <div className="mt-3.5 border-t border-border/40 pt-3">
        <p className="mb-1.5 text-[11px] font-semibold text-muted-foreground">{prompt}</p>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className="w-full resize-y rounded-lg border border-border/60 bg-background/40 px-3 py-2.5 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/50"
        />
      </div>
    </div>
  );
}
