"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, Loader2, Check, ExternalLink, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccentPanel } from "@/components/ui/accent-panel";
import { getPreMarketExercise, savePreMarketExercise } from "@/lib/supabase/queries";
import { instrumentName } from "@/lib/journal/weeks";
import type { TradeJournalEntry } from "@/lib/types";

const TURQUOISE = "var(--primary)";

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
    <div className="flex h-full min-h-0 flex-col gap-3">
      {loading ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : noHistory ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card px-6 py-12 text-center">
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
          {/* Today's focus — the single instruction the rest of this page feeds */}
          <AccentPanel accent="primary" className="shrink-0 py-3.5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="shrink-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/75">Intention</p>
                <h2 className="mt-0.5 font-heading text-sm font-bold tracking-tight">Today&apos;s one focus</h2>
              </div>
              <input
                value={focus}
                onChange={(e) => { setFocus(e.target.value); setSaved(false); }}
                placeholder="No entry without a confirmed level. Wait for the retest."
                className="min-w-0 flex-1 rounded-lg border border-border/60 bg-background/40 px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
              />
            </div>
          </AccentPanel>

          <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-2">
            {/* Losses to prevent */}
            <section className="flex min-h-0 flex-col gap-2.5 overflow-y-auto pr-1">
              <h3 className="shrink-0 font-heading text-sm font-bold uppercase tracking-[0.14em] text-destructive/80">
                Prevent these losses
              </h3>
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
            <section className="flex min-h-0 flex-col gap-2.5 overflow-y-auto pr-1">
              <h3 className="shrink-0 font-heading text-sm font-bold uppercase tracking-[0.14em] text-success/80">
                Repeat these wins
              </h3>
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
          <div className="flex shrink-0 items-center justify-between gap-3">
            <div className="text-xs">
              {error ? <span className="text-destructive">{error}</span>
                : saved ? <span className="inline-flex items-center gap-1.5 text-success"><Check className="h-3.5 w-3.5" /> Plan saved for {format(new Date(date + "T12:00:00"), "MMM d")}</span>
                : null}
            </div>
            <button
              onClick={save}
              disabled={saving || !dirty || !hasContent}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-px disabled:opacity-40 disabled:hover:translate-y-0"
              style={{ background: TURQUOISE, boxShadow: "0 2px 12px color-mix(in oklch, var(--primary) 26%, transparent)" }}
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
    <AccentPanel accent={isWin ? "success" : "destructive"}>
      {/* Trade header */}
      <Link
        href={`/journal/${t.id}`}
        className="group relative flex items-center gap-2.5 rounded-lg border border-border/60 px-3 py-2 transition-colors hover:border-primary/40 hover:bg-muted/30"
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
      <div className="mt-4 border-t border-border/40 pt-3.5">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">{prompt}</p>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className="w-full resize-y rounded-lg border border-border/60 bg-background/40 px-3.5 py-3 text-sm leading-relaxed outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
        />
      </div>
    </AccentPanel>
  );
}
