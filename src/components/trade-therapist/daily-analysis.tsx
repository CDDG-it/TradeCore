"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, addDays, subDays, isToday, isFuture } from "date-fns";
import {
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Loader2, Check,
  Trophy, LineChart, ExternalLink,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ScreenshotUpload } from "@/components/screenshot-upload";
import { cn } from "@/lib/utils";
import {
  getBestTradeOfDay, saveBestTradeOfDay, deleteBestTradeOfDay,
} from "@/lib/supabase/queries";
import { tradeR, formatTotalR, instrumentName } from "@/lib/journal/weeks";
import type { TradeJournalEntry, BestTradeOfDay, ScreenshotGroup } from "@/lib/types";

const TURQUOISE = "#14B8A6";

/**
 * Daily analysis — the post-market half of the routine. For one calendar day it
 * shows the trades that were actually taken (with outcomes, linking to each log
 * entry), then captures a full post-market recap of the session and the best
 * trade the market offered. Reaches further than the old best-trade dialog: the
 * session write-up sits alongside the best-trade capture, on one screen.
 */
export function DailyAnalysis({
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

  const d = useMemo(() => new Date(date + "T12:00:00"), [date]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSaved(false);
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
    () => trades
      .filter((t) => t.date_time.slice(0, 10) === date)
      .sort((a, b) => (a.date_time > b.date_time ? 1 : -1)),
    [trades, date]
  );
  const dayR = dayTrades.reduce((s, t) => s + tradeR(t), 0);

  const dirty =
    takenWasBest !== (loaded?.taken_was_best ?? false) ||
    postMarket !== (loaded?.post_market_analysis ?? "") ||
    notes !== (loaded?.notes ?? "") ||
    JSON.stringify(groups) !== JSON.stringify(loaded?.screenshot_groups ?? []);

  const hasContent =
    takenWasBest || postMarket.trim() || notes.trim() || groups.some((g) => g.urls.length > 0);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const entry = await saveBestTradeOfDay({
        date,
        taken_was_best: takenWasBest,
        notes: notes.trim(),
        post_market_analysis: postMarket.trim(),
        screenshot_groups: groups,
      });
      setLoaded(entry);
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
    setSaving(true);
    setError(null);
    try {
      await deleteBestTradeOfDay(date);
      setLoaded(null);
      setTakenWasBest(false); setPostMarket(""); setNotes(""); setGroups([]);
      onSaved?.(date, null);
    } catch {
      setError("Could not clear this day.");
    } finally {
      setSaving(false);
    }
  }

  const canGoNext = !isToday(d) && !isFuture(d);

  return (
    <div className="space-y-4">
      {/* Day navigation */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3">
        <button
          onClick={() => onDateChange(format(subDays(d, 1), "yyyy-MM-dd"))}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <p className="text-sm font-bold tracking-tight">{format(d, "EEEE, MMMM d")}</p>
          <p className="text-[11px] text-muted-foreground">
            {dayTrades.length === 0
              ? "No trades taken"
              : `${dayTrades.length} trade${dayTrades.length !== 1 ? "s" : ""} · ${formatTotalR(dayR)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isToday(d) && (
            <button
              onClick={() => onDateChange(format(new Date(), "yyyy-MM-dd"))}
              className="rounded-lg border border-border/60 px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              Today
            </button>
          )}
          <button
            onClick={() => canGoNext && onDateChange(format(addDays(d, 1), "yyyy-MM-dd"))}
            disabled={!canGoNext}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-30 disabled:hover:border-border/60 disabled:hover:text-muted-foreground"
            aria-label="Next day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 items-start">
          {/* Left: trades taken + post-market analysis */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-card p-4">
              <p className="text-sm font-semibold">Trades taken</p>
              <div className="mt-2.5 space-y-1.5">
                {dayTrades.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground/70">
                    Nothing logged for this day.
                  </p>
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
                        <p className="text-xs font-bold leading-none transition-colors group-hover:text-primary">
                          {instrumentName(t.instrument)}
                        </p>
                        <p className="mt-1 text-[10px] capitalize text-muted-foreground leading-none">{t.session} session</p>
                      </div>
                      {t.execution_quality && (
                        <span className={cn(
                          "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                          t.execution_quality === "good" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                        )}>
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
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex items-center gap-2">
                <LineChart className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold">Post-market analysis</p>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                What did the market actually do? Key levels, the setups that appeared, how the day should have been traded.
              </p>
              <textarea
                value={postMarket}
                onChange={(e) => { setPostMarket(e.target.value); setSaved(false); }}
                rows={7}
                placeholder="Range held the overnight low, first pullback into VWAP was the A+ long, chased the breakout instead…"
                className="mt-2.5 w-full resize-y rounded-lg border border-border/60 bg-background/40 px-3 py-2.5 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/50"
              />
            </div>
          </div>

          {/* Right: best trade of the day */}
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10">
                <Trophy className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Best trade of the day</p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                  The single best trade the market offered — take it apart so you recognise it next time.
                </p>
              </div>
            </div>

            <label className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5">
              <span className="text-xs font-medium">The trade I took was already the best available</span>
              <Switch checked={takenWasBest} onCheckedChange={(v) => { setTakenWasBest(v); setSaved(false); }} />
            </label>

            <div className="mt-3">
              <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Why this was the better play</p>
              <textarea
                value={notes}
                onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
                rows={4}
                placeholder="Cleaner level, more room to target, aligned with the daily bias…"
                className="w-full resize-y rounded-lg border border-border/60 bg-background/40 px-3 py-2.5 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/50"
              />
            </div>

            <div className="mt-3">
              <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Screenshots</p>
              <ScreenshotUpload
                groups={groups}
                onChange={(g) => { setGroups(g); setSaved(false); }}
                storageConfig={userId ? { userId, entityType: "best-trade", entityId: date } : undefined}
              />
            </div>
          </div>
        </div>
      )}

      {/* Save bar */}
      {!loading && (
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs">
            {error ? (
              <span className="text-destructive">{error}</span>
            ) : saved ? (
              <span className="inline-flex items-center gap-1.5 text-success"><Check className="w-3.5 h-3.5" /> Saved</span>
            ) : loaded ? (
              <button onClick={clearDay} disabled={saving} className="text-muted-foreground hover:text-destructive transition-colors">
                Clear this day
              </button>
            ) : null}
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
      )}
    </div>
  );
}
