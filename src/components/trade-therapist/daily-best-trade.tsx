"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isToday, isFuture,
} from "date-fns";
import {
  ChevronLeft, ChevronRight, Loader2, Check,
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

const TURQUOISE = "var(--primary)";

/** Whether a best-trade entry holds anything worth marking. */
function hasEntry(b: BestTradeOfDay | undefined): boolean {
  if (!b) return false;
  return b.taken_was_best ||
    Boolean((b.notes ?? "").trim()) || (b.screenshot_groups ?? []).some((g) => g.urls.length > 0);
}

/** The two chart slots the best-trade of the day is framed around: the higher
 *  timeframe read and the entry you should have taken. Fresh arrays each call
 *  so state is never shared across days. */
function defaultShotGroups(): ScreenshotGroup[] {
  return [{ label: "HTF", urls: [] }, { label: "Entry", urls: [] }];
}

/** Only the groups that actually hold a chart: what counts as content and what
 *  the "done" marker keys off, so empty HTF/Entry slots never read as filled. */
const withCharts = (g: ScreenshotGroup[]) => g.filter((x) => x.urls.length > 0);

/**
 * Daily / best trade of the day: a week calendar of results across the top,
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
  const [notes, setNotes] = useState("");
  const [groups, setGroups] = useState<ScreenshotGroup[]>(defaultShotGroups());
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

  // All best-trade entries: only for marking which week days are done.
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
        setNotes(entry?.notes ?? "");
        setGroups(entry?.screenshot_groups?.length ? entry.screenshot_groups : defaultShotGroups());
      })
      .finally(() => setLoading(false));
  }, [date]);

  const dayTrades = useMemo(
    () => inOrder(tradesByDay[date] ?? []),
    [tradesByDay, date]
  );
  const dayR = dayTrades.reduce((s, t) => s + tradeR(t), 0);

  // Week-level review progress: only days that were actually traded can be
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

  // Empty HTF/Entry slots never count as a change, so seeding them does not
  // arm the save button on a fresh day.
  const dirty =
    takenWasBest !== (loaded?.taken_was_best ?? false) ||
    notes !== (loaded?.notes ?? "") ||
    JSON.stringify(withCharts(groups)) !== JSON.stringify(withCharts(loaded?.screenshot_groups ?? []));
  const hasContent = takenWasBest || notes.trim() || groups.some((g) => g.urls.length > 0);

  async function save() {
    setSaving(true); setError(null);
    try {
      const entry = await saveBestTradeOfDay({
        date, taken_was_best: takenWasBest, notes: notes.trim(),
        // Post-market analysis was removed from this tab; clear any stored value.
        post_market_analysis: "", screenshot_groups: groups,
      });
      setLoaded(entry);
      setBestByDay((prev) => ({ ...prev, [date]: entry }));
      setSaved(true);
      onSaved?.(date, entry);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Could not save. Please try again.");
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
      setTakenWasBest(false); setNotes(""); setGroups(defaultShotGroups());
      onSaved?.(date, null);
    } catch {
      setError("Could not clear this day.");
    } finally {
      setSaving(false);
    }
  }

  return (
    // The whole tab is meant to sit on one screen: the rail and the save bar
    // are fixed, and the two working columns take the height that is left.
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* ── Week rail ────────────────────────────────────────────────────────
          Deliberately not the Journal's calendar: this one answers "which day
          still needs working through". It carries review state as the primary
          signal, with the day's result bands underneath: one band per trade,
          in the order taken, so a mixed day reads as mixed at a glance. */}
      <AccentPanel accent="primary" className="shrink-0 p-0">
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
              {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
            </p>
            <p className="mt-0.5 text-[10px] tabular-nums text-muted-foreground/70">
              {tradedDays === 0
                ? "No trades logged this week"
                : `${reviewedDays} of ${tradedDays} traded day${tradedDays !== 1 ? "s" : ""} reviewed`}
            </p>
          </div>

          {/* Review progress: only meaningful once something was traded */}
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
                title={future ? "" : done ? "Reviewed" : traded ? "Traded, not reviewed yet" : "No trades"}
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
                {/* Result bar: one full-strength segment per trade */}
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

                {/* Net R: the day's outcome, or a "flat" marker when nothing
                    was taken, so a quiet day reads as a deliberate no-trade and
                    not as missing data. Future days stay blank. */}
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
                ) : future ? (
                  <span className="relative mt-2 h-1 w-1 rounded-full bg-muted-foreground/20" />
                ) : (
                  <span className="relative mt-1.5 flex flex-col items-center gap-0.5" title="No trades this day">
                    <span aria-hidden className="h-[2px] w-4 rounded-full bg-muted-foreground/30" />
                    <span className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground/45">Flat</span>
                  </span>
                )}

                {/* Review state: a filled check once the day has been worked
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

        {/* Legend: review state first, outcome colours second */}
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
        <div className="flex min-h-0 flex-1 items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="flex shrink-0 items-baseline justify-between gap-3">
            <p className="text-sm font-semibold">{format(d, "EEEE, MMMM d")}</p>
            <p className="text-[11px] text-muted-foreground">
              {dayTrades.length === 0 ? "No trades taken" : `${dayTrades.length} trade${dayTrades.length !== 1 ? "s" : ""} · ${formatTotalR(dayR)}`}
            </p>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-2">
            {/* ── LEFT: your verdict + why the better trade was better ───────
                The one call this tab exists to make - was the trade you took
                the best one available - and, when it was not, the room to write
                out why the trade you should have taken was the better one. */}
            <AccentPanel accent="primary" eyebrow="Verdict" title="Was your trade the best trade?" className="flex min-h-0 flex-col">
              <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3">
                {/* The toggle: a full-width bar so the day's verdict is the
                    first thing the eye lands on, its state carried by colour. */}
                <label
                  className={cn(
                    "flex shrink-0 cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors",
                    takenWasBest ? "border-success/45 bg-success/[0.07]" : "border-border/60 bg-muted/20"
                  )}
                >
                  <span className="min-w-0">
                    <span className={cn("block text-sm font-bold leading-tight transition-colors", takenWasBest ? "text-success" : "text-foreground/90")}>
                      {takenWasBest ? "Yes - I took the best available trade" : "The trade I took was the best available"}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground/75">
                      On a flat day, staying out can be the best trade too.
                    </span>
                  </span>
                  <Switch checked={takenWasBest} onCheckedChange={(v) => { setTakenWasBest(v); setSaved(false); }} />
                </label>

                {/* The explanation: why the better trade was the better one to
                    take. Only really needed when your trade was not the best. */}
                <div className="flex min-h-0 flex-1 flex-col">
                  <p className="mb-2 shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
                    {takenWasBest ? "Why this was the best trade" : "Why the better trade was the better one"}
                  </p>
                  <textarea
                    value={notes}
                    onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
                    placeholder={takenWasBest
                      ? "What made your trade the highest-quality play on the board..."
                      : "The cleaner level, more room to target, aligned with the daily bias - why the trade you should have taken beat the one you did..."}
                    className="min-h-[140px] w-full flex-1 resize-none rounded-lg border border-border/60 bg-background/40 px-3.5 py-3 text-sm leading-relaxed outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>
            </AccentPanel>

            {/* ── RIGHT: the trade you should have taken ─────────────────────
                The HTF read and the entry of the better trade, uploaded into
                two fixed slots. A small link to your actual trade's log sits on
                top for reference - the chart of what should have happened is the
                point, not a thumbnail of what did. */}
            <AccentPanel
              accent="primary"
              eyebrow="The better trade"
              title="Screenshots you should have taken"
              className="flex min-h-0 flex-col"
            >
              <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3">
                {/* Reference link to the actual trade log - not a picture. */}
                {dayTrades.length > 0 && (
                  <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border/40 pb-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
                      Your actual {dayTrades.length > 1 ? "trades" : "trade"}
                    </span>
                    {dayTrades.map((t) => (
                      <Link
                        key={t.id}
                        // `from` so the trade page sends you back here, not into
                        // the journal, when you were only checking the trade.
                        href={`/journal/${t.id}?from=trade-therapist`}
                        className="group inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-2.5 py-1 text-xs font-semibold transition-colors hover:border-primary/40 hover:bg-muted/30 hover:text-primary"
                      >
                        {instrumentName(t.instrument)}
                        <span className={cn("tabular-nums",
                          t.result === "win" ? "text-success" : t.result === "loss" ? "text-destructive" : "text-warning")}>
                          {t.result === "win" ? `+${t.rr}R` : t.result === "loss" ? "-1R" : "0R"}
                        </span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground/40 transition-colors group-hover:text-primary" />
                      </Link>
                    ))}
                  </div>
                )}

                {/* The HTF + entry charts of the trade you should have taken. */}
                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                  <ScreenshotUpload
                    groups={groups}
                    onChange={(g) => { setGroups(g); setSaved(false); }}
                    storageConfig={userId ? { userId, entityType: "best-trade", entityId: date } : undefined}
                  />
                </div>
              </div>
            </AccentPanel>
          </div>

          {/* Save bar */}
          <div className="flex shrink-0 items-center justify-between gap-3">
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
              style={{ background: TURQUOISE, boxShadow: "0 2px 12px color-mix(in oklch, var(--primary) 26%, transparent)" }}
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
