"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isToday, isFuture,
} from "date-fns";
import {
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Loader2, Check,
  ExternalLink,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { AccentPanel } from "@/components/ui/accent-panel";
import { ScreenshotUpload } from "@/components/screenshot-upload";
import { cn } from "@/lib/utils";
import {
  getBestTradeOfDay, getBestTradesOfDay, saveBestTradeOfDay, deleteBestTradeOfDay,
} from "@/lib/supabase/queries";
import { tradeR, formatTotalR, instrumentName } from "@/lib/journal/weeks";
import {
  resultColor, resultBands, netRColor, inOrder, alpha,
  WIN_COLOR, LOSS_COLOR, BE_COLOR,
} from "@/lib/journal/colors";
import type { TradeJournalEntry, BestTradeOfDay, ScreenshotGroup } from "@/lib/types";

const TURQUOISE = "#14B8A6";

/** Whether a best-trade entry holds anything worth marking. */
function hasEntry(b: BestTradeOfDay | undefined): boolean {
  if (!b) return false;
  return b.taken_was_best || Boolean((b.post_market_analysis ?? "").trim()) ||
    Boolean((b.notes ?? "").trim()) || (b.screenshot_groups ?? []).some((g) => g.urls.length > 0);
}

/**
 * Daily / best trade of the day — a week calendar of results across the top,
 * and the selected day's trades, post-market recap and best trade below. Pick
 * any day in the week to work through it.
 */
export function DailyBestTrade({
  date, trades, onDateChange, userId, onSaved,
}: {
  date: string; // yyyy-MM-dd
  trades: TradeJournalEntry[];
  onDateChange: (date: string) => void;
  userId: string | null;
  onSaved?: (date: string, entry: BestTradeOfDay | null) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [takenWasBest, setTakenWasBest] = useState(false);
  const [postMarket, setPostMarket] = useState("");
  const [notes, setNotes] = useState("");
  const [groups, setGroups] = useState<ScreenshotGroup[]>([]);
  const [loaded, setLoaded] = useState<BestTradeOfDay | null>(null);
  const [bestByDay, setBestByDay] = useState<Record<string, BestTradeOfDay>>({});

  const d = useMemo(() => new Date(date + "T12:00:00"), [date]);
  const weekStart = useMemo(() => startOfWeek(d, { weekStartsOn: 1 }), [d]);
  const weekEnd = useMemo(() => endOfWeek(d, { weekStartsOn: 1 }), [d]);
  const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart, weekEnd]);

  const tradesByDay = useMemo(() => {
    const map: Record<string, TradeJournalEntry[]> = {};
    trades.forEach((t) => {
      const k = t.date_time.slice(0, 10);
      (map[k] ??= []).push(t);
    });
    return map;
  }, [trades]);

  // All best-trade entries — only for marking which week days are done.
  useEffect(() => {
    getBestTradesOfDay()
      .then((rows) => setBestByDay(Object.fromEntries(rows.map((r) => [r.date.slice(0, 10), r]))))
      .catch(() => {});
  }, []);

  // The selected day's entry.
  useEffect(() => {
    setLoading(true); setError(null); setSaved(false);
    getBestTradeOfDay(date)
      .then((entry) => {
        setLoaded(entry);
        setTakenWasBest(entry?.taken_was_best ?? false);
        setPostMarket(entry?.post_market_analysis ?? "");
        setNotes(entry?.notes ?? "");
        setGroups(entry?.screenshot_groups ?? []);
      })
      .finally(() => setLoading(false));
  }, [date]);

  const dayTrades = useMemo(
    () => (tradesByDay[date] ?? []).slice().sort((a, b) => (a.date_time > b.date_time ? 1 : -1)),
    [tradesByDay, date]
  );
  const dayR = dayTrades.reduce((s, t) => s + tradeR(t), 0);

  // Week-level review progress — only days that were actually traded can be
  // "still to review", so the ratio never punishes a quiet week.
  const isThisWeek = weekDays.some((day) => isToday(day));
  const { tradedDays, reviewedDays } = useMemo(() => {
    let traded = 0, reviewed = 0;
    for (const day of weekDays) {
      const k = format(day, "yyyy-MM-dd");
      if ((tradesByDay[k] ?? []).length === 0) continue;
      traded++;
      if (hasEntry(bestByDay[k])) reviewed++;
    }
    return { tradedDays: traded, reviewedDays: reviewed };
  }, [weekDays, tradesByDay, bestByDay]);

  const dirty =
    takenWasBest !== (loaded?.taken_was_best ?? false) ||
    postMarket !== (loaded?.post_market_analysis ?? "") ||
    notes !== (loaded?.notes ?? "") ||
    JSON.stringify(groups) !== JSON.stringify(loaded?.screenshot_groups ?? []);
  const hasContent = takenWasBest || postMarket.trim() || notes.trim() || groups.some((g) => g.urls.length > 0);

  async function save() {
    setSaving(true); setError(null);
    try {
      const entry = await saveBestTradeOfDay({
        date, taken_was_best: takenWasBest, notes: notes.trim(),
        post_market_analysis: postMarket.trim(), screenshot_groups: groups,
      });
      setLoaded(entry);
      setBestByDay((prev) => ({ ...prev, [date]: entry }));
      setSaved(true);
      onSaved?.(date, entry);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Could not save. Run the post_market_analysis migration in Supabase.");
    } finally {
      setSaving(false);
    }
  }

  async function clearDay() {
    setSaving(true); setError(null);
    try {
      await deleteBestTradeOfDay(date);
      setLoaded(null);
      setBestByDay((prev) => { const n = { ...prev }; delete n[date]; return n; });
      setTakenWasBest(false); setPostMarket(""); setNotes(""); setGroups([]);
      onSaved?.(date, null);
    } catch {
      setError("Could not clear this day.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* ── Week rail ────────────────────────────────────────────────────────
          Deliberately not the Journal's calendar: this one answers "which day
          still needs working through". It carries review state as the primary
          signal, with the day's result bands underneath — one band per trade,
          in the order taken — so a mixed day reads as mixed at a glance. */}
      <AccentPanel accent="primary" className="p-0">
        <div className="flex items-center justify-between gap-3 border-b border-border/40 px-3 py-2.5 sm:px-4">
          <div className="flex items-center gap-1.5">
            <button onClick={() => onDateChange(format(subWeeks(d, 1), "yyyy-MM-dd"))} aria-label="Previous week"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => onDateChange(format(addWeeks(d, 1), "yyyy-MM-dd"))} aria-label="Next week"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
              <ChevronRight className="h-4 w-4" />
            </button>
            {!isThisWeek && (
              <button onClick={() => onDateChange(format(new Date(), "yyyy-MM-dd"))}
                className="ml-1 rounded-lg border border-primary/40 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary transition-colors hover:bg-primary/10">
                Today
              </button>
            )}
          </div>

          <div className="min-w-0 text-center">
            <p className="truncate text-sm font-semibold tracking-tight">
              {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
            </p>
            <p className="mt-0.5 text-[10px] tabular-nums text-muted-foreground/70">
              {tradedDays === 0
                ? "No trades logged this week"
                : `${reviewedDays} of ${tradedDays} traded day${tradedDays !== 1 ? "s" : ""} reviewed`}
            </p>
          </div>

          {/* Review progress — only meaningful once something was traded */}
          <div className="flex w-16 shrink-0 items-center justify-end gap-2">
            {tradedDays > 0 && (
              <>
                <span className="hidden text-[11px] font-bold tabular-nums text-primary sm:inline">
                  {Math.round((reviewedDays / tradedDays) * 100)}%
                </span>
                <span className="h-1.5 w-8 overflow-hidden rounded-full bg-muted/40">
                  <span
                    className="block h-full rounded-full transition-[width] duration-500 ease-out"
                    style={{ width: `${(reviewedDays / tradedDays) * 100}%`, background: TURQUOISE }}
                  />
                </span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 p-2.5 sm:gap-2 sm:p-3">
          {weekDays.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayTradesFor = inOrder(tradesByDay[key] ?? []);
            const traded = dayTradesFor.length > 0;
            const netR = dayTradesFor.reduce((s, t) => s + tradeR(t), 0);
            const selected = key === date;
            const future = isFuture(day) && !isToday(day);
            const best = bestByDay[key];
            const done = Boolean(best?.taken_was_best) || hasEntry(best);
            return (
              <button
                key={key}
                type="button"
                onClick={() => onDateChange(key)}
                disabled={future}
                title={future ? "" : done ? "Reviewed" : traded ? "Traded — not reviewed yet" : "No trades"}
                className={cn(
                  "group relative flex flex-col items-center overflow-hidden rounded-xl border px-1 pb-2 pt-2.5 transition-all duration-300",
                  selected
                    ? "border-primary ring-1 ring-primary/30"
                    : isToday(day)
                    ? "border-primary/40 hover:border-primary/60"
                    : "border-border/40 hover:border-primary/30",
                  future ? "cursor-default opacity-30" : "cursor-pointer hover:-translate-y-0.5"
                )}
                style={traded ? { background: resultBands(dayTradesFor, selected ? 18 : 12) } : undefined}
              >
                {/* Result bar — one full-strength segment per trade */}
                {traded && (
                  <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 flex h-[3px] gap-px">
                    {dayTradesFor.map((t) => (
                      <span
                        key={t.id}
                        className="flex-1 transition-[filter] duration-300 group-hover:brightness-125"
                        style={{ background: resultColor(t), boxShadow: `0 0 8px ${alpha(resultColor(t), 45)}` }}
                      />
                    ))}
                  </span>
                )}
                {/* Selected day gets a soft turquoise floor */}
                {selected && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{ background: `radial-gradient(120% 90% at 50% 100%, ${alpha(TURQUOISE, 16)}, transparent 68%)` }}
                  />
                )}

                <span className="relative text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  <span className="sm:hidden">{format(day, "EEEEE")}</span>
                  <span className="hidden sm:inline">{format(day, "EEE")}</span>
                </span>
                <span
                  className={cn(
                    "relative mt-0.5 text-base font-bold leading-none tabular-nums",
                    selected || isToday(day) ? "text-primary" : "text-foreground/85"
                  )}
                >
                  {format(day, "d")}
                </span>

                {/* Net R — the day's outcome, or a placeholder dot when nothing was taken */}
                {traded ? (
                  <span className="relative mt-1.5 flex items-center gap-1">
                    <span className="text-[11px] font-black leading-none tabular-nums" style={{ color: netRColor(netR) }}>
                      {formatTotalR(netR)}
                    </span>
                    {dayTradesFor.length > 1 && (
                      <span className="rounded-full border border-border/70 bg-background/50 px-1 text-[8px] font-bold leading-[13px] text-muted-foreground/80">
                        {dayTradesFor.length}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="relative mt-2 h-1 w-1 rounded-full bg-muted-foreground/25" />
                )}

                {/* Review state — a filled check once the day has been worked
                    through, an open ring while it is still waiting. */}
                <span
                  aria-hidden
                  className={cn(
                    "relative mt-2 flex h-4 w-4 items-center justify-center rounded-full border transition-colors",
                    done
                      ? "border-transparent bg-primary text-primary-foreground"
                      : traded
                      ? "border-primary/60 text-transparent"
                      : "border-border/50 text-transparent"
                  )}
                >
                  <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                </span>
              </button>
            );
          })}
        </div>

        {/* Legend — review state first, outcome colours second */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/40 px-3 py-2 text-[10px] text-muted-foreground sm:px-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="flex h-3 w-3 items-center justify-center rounded-full bg-primary" /> Reviewed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full border border-primary/60" /> To review
          </span>
          <span className="ml-auto inline-flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: WIN_COLOR }} /> Win</span>
            <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: LOSS_COLOR }} /> Loss</span>
            <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: BE_COLOR }} /> B/E</span>
          </span>
        </div>
      </AccentPanel>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-semibold">{format(d, "EEEE, MMMM d")}</p>
            <p className="text-[11px] text-muted-foreground">
              {dayTrades.length === 0 ? "No trades taken" : `${dayTrades.length} trade${dayTrades.length !== 1 ? "s" : ""} · ${formatTotalR(dayR)}`}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 items-start">
            {/* Left: trades taken + post-market analysis */}
            <div className="space-y-4">
              <AccentPanel accent="primary" eyebrow="Execution" title="Trades taken">
                <div className="mt-4 space-y-1.5">
                  {dayTrades.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground/70">Nothing logged for this day.</p>
                  ) : (
                    dayTrades.map((t) => (
                      <Link
                        key={t.id}
                        href={`/journal/${t.id}`}
                        className="group flex items-center gap-2.5 rounded-lg border border-border/60 px-3 py-2 transition-colors hover:border-primary/40 hover:bg-muted/30"
                      >
                        {t.direction === "long"
                          ? <TrendingUp className="w-4 h-4 shrink-0 text-success" />
                          : <TrendingDown className="w-4 h-4 shrink-0 text-destructive" />}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold leading-none transition-colors group-hover:text-primary">{instrumentName(t.instrument)}</p>
                          <p className="mt-1 text-[10px] capitalize text-muted-foreground leading-none">{t.session} session</p>
                        </div>
                        {t.execution_quality && (
                          <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                            t.execution_quality === "good" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")}>
                            {t.execution_quality === "good" ? "Good" : "Bad"}
                          </span>
                        )}
                        <span className={cn("w-10 shrink-0 text-right text-xs font-bold tabular-nums",
                          t.result === "win" ? "text-success" : t.result === "loss" ? "text-destructive" : "text-warning")}>
                          {t.result === "win" ? `+${t.rr}R` : t.result === "loss" ? "-1R" : "0R"}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary" />
                      </Link>
                    ))
                  )}
                </div>
              </AccentPanel>

              <AccentPanel
                accent="cyan"
                eyebrow="Analysis"
                title="Post-market analysis"
                subtitle="What did the market actually do? Key levels, the setups that appeared, how the day should have been traded."
              >
                <textarea
                  value={postMarket}
                  onChange={(e) => { setPostMarket(e.target.value); setSaved(false); }}
                  rows={7}
                  placeholder="Range held the overnight low, first pullback into VWAP was the A+ long, chased the breakout instead…"
                  className="mt-4 w-full resize-y rounded-lg border border-border/60 bg-background/40 px-3.5 py-3 text-sm leading-relaxed outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                />
              </AccentPanel>
            </div>

            {/* Right: best trade of the day */}
            <AccentPanel
              accent="primary"
              eyebrow="Benchmark"
              title="Best trade of the day"
              subtitle="The single best trade the market offered — take it apart so you recognise it next time."
            >
              <label className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5">
                <span className="text-xs font-medium">The trade I took was already the best available</span>
                <Switch checked={takenWasBest} onCheckedChange={(v) => { setTakenWasBest(v); setSaved(false); }} />
              </label>

              <div className="mt-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">Why this was the better play</p>
                <textarea
                  value={notes}
                  onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
                  rows={4}
                  placeholder="Cleaner level, more room to target, aligned with the daily bias…"
                  className="w-full resize-y rounded-lg border border-border/60 bg-background/40 px-3.5 py-3 text-sm leading-relaxed outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div className="mt-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">Screenshots</p>
                <ScreenshotUpload
                  groups={groups}
                  onChange={(g) => { setGroups(g); setSaved(false); }}
                  storageConfig={userId ? { userId, entityType: "best-trade", entityId: date } : undefined}
                />
              </div>
            </AccentPanel>
          </div>

          {/* Save bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs">
              {error ? <span className="text-destructive">{error}</span>
                : saved ? <span className="inline-flex items-center gap-1.5 text-success"><Check className="w-3.5 h-3.5" /> Saved</span>
                : loaded ? <button onClick={clearDay} disabled={saving} className="text-muted-foreground hover:text-destructive transition-colors">Clear this day</button>
                : null}
            </div>
            <button
              onClick={save}
              disabled={saving || !dirty || !hasContent}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-px disabled:opacity-40 disabled:hover:translate-y-0"
              style={{ background: TURQUOISE, boxShadow: "0 2px 12px rgba(20,184,166,0.26)" }}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {loaded ? "Save changes" : "Save analysis"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
