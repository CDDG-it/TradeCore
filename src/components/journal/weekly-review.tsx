"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  format, startOfISOWeek, endOfISOWeek, eachDayOfInterval,
  getISOWeek, getISOWeekYear, isToday,
} from "date-fns";
import { Star, Check, AlertTriangle, Lightbulb, ListChecks, Loader2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getTrades, getWeeklyTradeReviews, saveWeeklyTradeReview } from "@/lib/supabase/queries";
import type { TradeJournalEntry, WeeklyTradeReview } from "@/lib/types";

const INSTRUMENT_NAMES: Record<string, string> = {
  NQ: "Nasdaq", MNQ: "Nasdaq", ES: "SP500", MES: "SP500",
  GOLD: "Gold", GC: "Gold", XAUUSD: "Gold", CL: "Crude Oil",
  EURUSD: "EUR/USD", GBPUSD: "GBP/USD", BTC: "Bitcoin",
};
const instrumentName = (s: string) => INSTRUMENT_NAMES[(s ?? "").toUpperCase()] ?? s;

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// R contribution of a single trade
function tradeR(t: TradeJournalEntry): number {
  if (t.result === "win") return t.rr;
  if (t.result === "loss") return -1;
  return 0;
}

type WeekGroup = {
  weekStart: string;        // yyyy-MM-dd (Monday)
  weekNum: number;
  year: number;
  rangeLabel: string;
  days: { date: string; trades: TradeJournalEntry[] }[];
  trades: TradeJournalEntry[];
  wins: number;
  losses: number;
  bes: number;
  totalR: number;
};

export function WeeklyReview() {
  const [trades, setTrades] = useState<TradeJournalEntry[]>([]);
  const [reviews, setReviews] = useState<Record<string, WeeklyTradeReview>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTrades(), getWeeklyTradeReviews()]).then(([t, r]) => {
      setTrades(t);
      const map: Record<string, WeeklyTradeReview> = {};
      r.forEach((rev) => { map[rev.week_start] = rev; });
      setReviews(map);
      setLoading(false);
    });
  }, []);

  const weeks = useMemo<WeekGroup[]>(() => {
    const byWeek: Record<string, TradeJournalEntry[]> = {};
    trades.forEach((t) => {
      const d = new Date(t.date_time.slice(0, 10) + "T12:00:00");
      const ws = format(startOfISOWeek(d), "yyyy-MM-dd");
      (byWeek[ws] ??= []).push(t);
    });

    return Object.entries(byWeek)
      .map(([weekStart, weekTrades]) => {
        const start = new Date(weekStart + "T12:00:00");
        const end = endOfISOWeek(start);
        const dayList = eachDayOfInterval({ start, end }).map((day) => {
          const key = format(day, "yyyy-MM-dd");
          return { date: key, trades: weekTrades.filter((t) => t.date_time.slice(0, 10) === key) };
        });
        return {
          weekStart,
          weekNum: getISOWeek(start),
          year: getISOWeekYear(start),
          rangeLabel: `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`,
          days: dayList,
          trades: weekTrades,
          wins: weekTrades.filter((t) => t.result === "win").length,
          losses: weekTrades.filter((t) => t.result === "loss").length,
          bes: weekTrades.filter((t) => t.result === "break-even").length,
          totalR: weekTrades.reduce((s, t) => s + tradeR(t), 0),
        };
      })
      .sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  }, [trades]);

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  if (weeks.length === 0) return (
    <div className="bg-card border border-border/50 rounded-xl p-12 text-center">
      <p className="text-sm text-muted-foreground">No trades to review yet.</p>
      <Link href="/journal/new" className="text-xs text-primary hover:underline mt-2 inline-block">
        Log your first trade
      </Link>
    </div>
  );

  return (
    <div className="space-y-5">
      {weeks.map((week) => (
        <WeekCard
          key={week.weekStart}
          week={week}
          review={reviews[week.weekStart]}
          onSaved={(rev) => setReviews((prev) => ({ ...prev, [rev.week_start]: rev }))}
        />
      ))}
    </div>
  );
}

function StatPill({ label, value, tone }: { label: string; value: number | string; tone: "win" | "loss" | "be" }) {
  const cls = tone === "win" ? "text-success" : tone === "loss" ? "text-destructive" : "text-warning";
  return (
    <div className="text-center">
      <p className={cn("text-lg font-bold leading-none", cls)}>{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mt-1">{label}</p>
    </div>
  );
}

function WeekCard({
  week,
  review,
  onSaved,
}: {
  week: WeekGroup;
  review?: WeeklyTradeReview;
  onSaved: (r: WeeklyTradeReview) => void;
}) {
  const [mistakes, setMistakes] = useState(review?.mistakes ?? "");
  const [lessons, setLessons] = useState(review?.lessons ?? "");
  const [prevention, setPrevention] = useState(review?.prevention_plan ?? "");
  const [bestDays, setBestDays] = useState<Record<string, boolean>>(review?.best_trade_days ?? {});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const dirty =
    mistakes !== (review?.mistakes ?? "") ||
    lessons !== (review?.lessons ?? "") ||
    prevention !== (review?.prevention_plan ?? "") ||
    JSON.stringify(bestDays) !== JSON.stringify(review?.best_trade_days ?? {});

  function toggleBest(date: string) {
    setBestDays((prev) => ({ ...prev, [date]: !prev[date] }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(false);
    try {
      const rev = await saveWeeklyTradeReview({
        week_start: week.weekStart,
        mistakes,
        lessons,
        prevention_plan: prevention,
        best_trade_days: bestDays,
      });
      onSaved(rev);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // Most likely the weekly_trade_reviews table has not been created yet.
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  const totalRLabel = `${week.totalR >= 0 ? "+" : ""}${week.totalR.toFixed(1)}R`;
  const rColor = week.totalR > 0 ? "text-success" : week.totalR < 0 ? "text-destructive" : "text-warning";

  return (
    <Card className={cn("border-2", week.totalR > 0 ? "border-success/30" : week.totalR < 0 ? "border-destructive/30" : "border-border/60")}>
      <CardContent className="p-5 space-y-5">
        {/* ── Header: week + stats ── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                W{week.weekNum} · {week.year}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1.5">{week.rangeLabel}</p>
          </div>
          <div className="flex items-center gap-5">
            <StatPill label="Wins" value={week.wins} tone="win" />
            <StatPill label="Losses" value={week.losses} tone="loss" />
            <StatPill label="B/E" value={week.bes} tone="be" />
            <div className="text-center pl-4 border-l border-border/50">
              <p className={cn("text-2xl font-black leading-none", rColor)}>{totalRLabel}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mt-1">Week R</p>
            </div>
          </div>
        </div>

        {/* ── Per-day strip: trades + "best trade taken" toggle ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {week.days.map((day, i) => {
            const dayDate = new Date(day.date + "T12:00:00");
            const best = !!bestDays[day.date];
            return (
              <div
                key={day.date}
                className={cn(
                  "rounded-xl border p-2 flex flex-col gap-1.5 min-h-[112px]",
                  isToday(dayDate) ? "border-primary/40 bg-primary/5" : "border-border/40 bg-muted/15"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {DAY_LABELS[i]} {format(dayDate, "d")}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleBest(day.date)}
                    title={best ? "Best trade taken — click to unset" : "Mark: took the best trade (or rightly stayed out)"}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn("w-3.5 h-3.5", best ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")}
                    />
                  </button>
                </div>

                <div className="flex-1 flex flex-col gap-1">
                  {day.trades.length === 0 ? (
                    <span className="text-[10px] text-muted-foreground/40 mt-1">No trades</span>
                  ) : (
                    day.trades.map((t) => (
                      <Link
                        key={t.id}
                        href={`/journal/${t.id}`}
                        className={cn(
                          "flex items-center justify-between rounded-md px-1.5 py-1 text-[11px] font-bold leading-none transition-colors",
                          t.result === "win" ? "bg-success/15 text-success hover:bg-success/25"
                            : t.result === "loss" ? "bg-destructive/15 text-destructive hover:bg-destructive/25"
                            : "bg-warning/15 text-warning hover:bg-warning/25"
                        )}
                      >
                        <span className="truncate">{instrumentName(t.instrument)}</span>
                        <span className="shrink-0 ml-1">
                          {t.result === "win" ? `+${t.rr}R` : t.result === "loss" ? "-1R" : "0R"}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Reflection fields ── */}
        <div className="grid md:grid-cols-3 gap-3">
          <ReviewField
            icon={AlertTriangle} iconClass="text-destructive"
            label="Mistakes made" placeholder="What went wrong this week?"
            value={mistakes} onChange={(v) => { setMistakes(v); setSaved(false); }}
          />
          <ReviewField
            icon={Lightbulb} iconClass="text-warning"
            label="Lessons learned" placeholder="What did the week teach you?"
            value={lessons} onChange={(v) => { setLessons(v); setSaved(false); }}
          />
          <ReviewField
            icon={ListChecks} iconClass="text-success"
            label="Prevention plan" placeholder="Step by step, how do you avoid this next week?"
            value={prevention} onChange={(v) => { setPrevention(v); setSaved(false); }}
          />
        </div>

        {/* ── Footer: save ── */}
        <div className="flex items-center justify-end gap-3">
          {saved && !dirty && (
            <span className="text-xs text-success flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          {saveError && (
            <span className="text-xs text-destructive">Could not save. Run the latest SQL migration.</span>
          )}
          <Link
            href={`/journal/${week.trades[0]?.id ?? ""}`}
            className="text-xs text-primary flex items-center gap-1 hover:underline"
          >
            Open trades <ArrowRight className="w-3 h-3" />
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-px disabled:opacity-40 disabled:hover:translate-y-0"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {saving ? "Saving" : "Save review"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewField({
  icon: Icon, iconClass, label, placeholder, value, onChange,
}: {
  icon: React.ElementType;
  iconClass: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
        <Icon className={cn("w-3.5 h-3.5", iconClass)} />
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-y rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary/40 focus:bg-card"
      />
    </div>
  );
}
