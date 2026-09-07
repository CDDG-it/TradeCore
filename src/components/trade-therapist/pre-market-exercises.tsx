"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, Loader2, Check, ArrowRight, Images, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccentPanel } from "@/components/ui/accent-panel";
import { TradeDetailDialog } from "@/components/journal/trade-detail-dialog";
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

/** The one line worth carrying onto the card: everything else lives in the dialog. */
function headline(t: TradeJournalEntry, tone: "win" | "loss"): { label: string; text: string } | null {
  const pick = (label: string, text?: string) => (text?.trim() ? { label, text: text.trim() } : null);
  if (tone === "loss") {
    return pick("Mistake", t.mistakes) ?? pick("Mindset", t.psychology_notes) ?? pick("Lesson", t.lessons);
  }
  return (
    pick("Execution", t.execution_notes) ??
    (t.confluences?.length ? { label: "Lined up", text: t.confluences.join(" · ") } : null) ??
    pick("Lesson", t.lessons)
  );
}

function shotCount(t: TradeJournalEntry): number {
  return (t.screenshot_groups ?? []).reduce((n, g) => n + g.urls.length, 0);
}

type Draft = { loss_plans: Record<string, string>; win_plans: Record<string, string>; focus: string };

/**
 * Pre-Market Exercises: a pre-session discipline drill.
 *
 * Before the open the trader looks back at their two most recent losses and two
 * most recent wins, then commits in writing to a plan for the day: how each
 * mistake will be prevented, how each thing that worked will be repeated. The
 * act of writing the plan before trading is what reduces the odds of repeating
 * the same error. Persisted per calendar day.
 *
 * The whole drill is built to fit one laptop screen and to never cost the
 * trader their typing: a trade opens read-only in a dialog (mistakes, notes,
 * charts) instead of navigating to the Journal, and anything typed but not yet
 * saved is kept for the session so switching tabs cannot lose it.
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
  const [loaded, setLoaded] = useState<Draft | null>(null);
  const [viewing, setViewing] = useState<TradeJournalEntry | null>(null);

  const draftKey = `premarket-draft:${date}`;

  useEffect(() => {
    setLoading(true); setError(null); setSaved(false);
    getPreMarketExercise(date)
      .then((ex) => {
        const base: Draft = ex
          ? { loss_plans: ex.loss_plans, win_plans: ex.win_plans, focus: ex.focus }
          : { loss_plans: {}, win_plans: {}, focus: "" };
        setLoaded(base);
        // Unsaved typing from earlier in this session wins over what is stored:
        // leaving the tab and coming back must never wipe the day's plan.
        let draft: Draft | null = null;
        try {
          const raw = sessionStorage.getItem(`premarket-draft:${date}`);
          if (raw) draft = JSON.parse(raw) as Draft;
        } catch { /* no session storage: fall back to the saved plan */ }
        const use = draft ?? base;
        setLossPlans(use.loss_plans ?? {});
        setWinPlans(use.win_plans ?? {});
        setFocus(use.focus ?? "");
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

  // Keep unsaved work for the session; drop it the moment it matches what is stored.
  useEffect(() => {
    if (loading) return;
    try {
      if (dirty) sessionStorage.setItem(draftKey, JSON.stringify({ loss_plans: lossPlans, win_plans: winPlans, focus }));
      else sessionStorage.removeItem(draftKey);
    } catch { /* nothing to do if storage is unavailable */ }
  }, [loading, dirty, draftKey, lossPlans, winPlans, focus]);

  async function save() {
    setSaving(true); setError(null);
    try {
      const clean = (m: Record<string, string>) =>
        Object.fromEntries(Object.entries(m).filter(([, v]) => v.trim()).map(([k, v]) => [k, v.trim()]));
      const payload = { date, loss_plans: clean(lossPlans), win_plans: clean(winPlans), focus: focus.trim() };
      await savePreMarketExercise(payload);
      setLoaded({ loss_plans: payload.loss_plans, win_plans: payload.win_plans, focus: payload.focus });
      setLossPlans(payload.loss_plans);
      setWinPlans(payload.win_plans);
      setFocus(payload.focus);
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
    <div className="flex h-full min-h-0 flex-col gap-2.5">
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
          {/* Today's focus: the single instruction the rest of this page feeds */}
          <AccentPanel accent="primary" className="shrink-0 p-3 pl-4 sm:p-3 sm:pl-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <div className="shrink-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-primary/75">Intention</p>
                <h2 className="mt-0.5 font-heading text-[13px] font-bold leading-none tracking-tight">Today&apos;s one focus</h2>
              </div>
              <input
                value={focus}
                onChange={(e) => { setFocus(e.target.value); setSaved(false); }}
                placeholder="No entry without a confirmed level. Wait for the retest."
                className="min-w-0 flex-1 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-[13px] outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
              />
            </div>
          </AccentPanel>

          <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] gap-2.5 lg:grid-cols-2">
            {/* Losses to prevent */}
            <section className="flex min-h-0 flex-col gap-2.5 overflow-y-auto pr-0.5">
              <h3 className="shrink-0 font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-destructive/80">
                Prevent these losses
              </h3>
              {losses.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border/60 bg-card px-4 py-6 text-center text-xs text-muted-foreground">
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
                    onView={() => setViewing(t)}
                  />
                ))
              )}
            </section>

            {/* Wins to repeat */}
            <section className="flex min-h-0 flex-col gap-2.5 overflow-y-auto pr-0.5">
              <h3 className="shrink-0 font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-success/80">
                Repeat these wins
              </h3>
              {wins.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border/60 bg-card px-4 py-6 text-center text-xs text-muted-foreground">
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
                    onView={() => setViewing(t)}
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
                : dirty && hasContent ? <span className="text-muted-foreground">Unsaved changes are kept while you are here.</span>
                : null}
            </div>
            <button
              onClick={save}
              disabled={saving || !dirty || !hasContent}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-[13px] font-semibold text-white transition-all hover:-translate-y-px disabled:opacity-40 disabled:hover:translate-y-0"
              style={{ background: TURQUOISE, boxShadow: "0 2px 12px color-mix(in oklch, var(--primary) 26%, transparent)" }}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {loaded && hasContent && !dirty ? "Saved" : "Save today's plan"}
            </button>
          </div>
        </>
      )}

      <TradeDetailDialog
        trade={viewing}
        open={viewing !== null}
        onOpenChange={(v) => { if (!v) setViewing(null); }}
      />
    </div>
  );
}

/** One reviewed trade: the headline of what happened, then the trader's plan. */
function ReviewCard({
  trade, tone, prompt, placeholder, value, onChange, onView,
}: {
  trade: TradeJournalEntry;
  tone: "win" | "loss";
  prompt: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onView: () => void;
}) {
  const t = trade;
  const isWin = tone === "win";
  const head = headline(t, tone);
  const shots = shotCount(t);

  return (
    <AccentPanel accent={isWin ? "success" : "destructive"} className="flex min-h-[172px] flex-1 flex-col p-3 pl-4 sm:p-3.5 sm:pl-4">
      {/* Trade header: opens the entry in place, so nothing typed here is lost */}
      <button
        type="button"
        onClick={onView}
        title="View this trade: mistakes, notes and charts"
        className="group flex w-full items-center gap-2.5 rounded-lg border border-border/60 px-2.5 py-1.5 text-left transition-colors hover:border-primary/40 hover:bg-muted/30"
      >
        {t.direction === "long"
          ? <TrendingUp className="h-3.5 w-3.5 shrink-0 text-success" />
          : <TrendingDown className="h-3.5 w-3.5 shrink-0 text-destructive" />}
        <span className="truncate text-xs font-bold transition-colors group-hover:text-primary">
          {instrumentName(t.instrument)}
        </span>
        <span className="truncate text-[10px] text-muted-foreground">
          {format(new Date(t.date_time.slice(0, 10) + "T12:00:00"), "MMM d")} · {t.session}
        </span>
        <span className={cn("ml-auto shrink-0 text-xs font-bold tabular-nums",
          isWin ? "text-success" : "text-destructive")}>
          {tradeRLabel(t)}
        </span>
        {shots > 0 && (
          <span className="inline-flex shrink-0 items-center gap-1 text-[10px] tabular-nums text-muted-foreground/70">
            <Images className="h-3 w-3" />{shots}
          </span>
        )}
        <Eye className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary" />
      </button>

      {/* The single most instructive line from the entry: the rest is in the dialog */}
      {head ? (
        <p className="mt-2 flex gap-1.5">
          <span className={cn(
            "mt-px shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
            isWin ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive"
          )}>
            {head.label}
          </span>
          <span className="line-clamp-2 text-[11.5px] leading-snug text-foreground/75">{head.text}</span>
        </p>
      ) : (
        <p className="mt-2 text-[11px] italic text-muted-foreground/70">
          No notes were logged on this trade: write your plan from memory.
        </p>
      )}

      {/* The plan */}
      <div className="mt-2.5 flex min-h-0 flex-1 flex-col border-t border-border/40 pt-2.5">
        <p className="mb-1.5 shrink-0 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">{prompt}</p>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[76px] w-full flex-1 resize-none rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-[13px] leading-relaxed outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
        />
      </div>
    </AccentPanel>
  );
}
