"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { format, isToday } from "date-fns";
import {
  ArrowLeft, AlertTriangle, Lightbulb, ListChecks, Check, Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getTrades, getWeeklyTradeReviews, saveWeeklyTradeReview } from "@/lib/supabase/queries";
import { getWeekGroup, instrumentName, DAY_LABELS, formatTotalR } from "@/lib/journal/weeks";
import type { TradeJournalEntry, WeeklyTradeReview } from "@/lib/types";

export default function WeeklyReviewDetailPage({ params }: { params: Promise<{ week: string }> }) {
  const { week } = use(params);

  const [trades, setTrades] = useState<TradeJournalEntry[] | null>(null);
  const [review, setReview] = useState<WeeklyTradeReview | null>(null);

  const [mistakes, setMistakes] = useState("");
  const [lessons, setLessons] = useState("");
  const [prevention, setPrevention] = useState("");
  const [bestDays, setBestDays] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    Promise.all([getTrades(), getWeeklyTradeReviews()]).then(([t, reviews]) => {
      setTrades(t);
      const r = reviews.find((rev) => rev.week_start === week) ?? null;
      setReview(r);
      setMistakes(r?.mistakes ?? "");
      setLessons(r?.lessons ?? "");
      setPrevention(r?.prevention_plan ?? "");
      setBestDays(r?.best_trade_days ?? {});
    });
  }, [week]);

  const isValid = /^\d{4}-\d{2}-\d{2}$/.test(week);

  if (!isValid) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-sm">Invalid week.</p>
        <Link href="/journal" className="text-primary text-sm hover:underline mt-2 inline-block">← Back to journal</Link>
      </div>
    );
  }

  if (trades === null) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  const group = getWeekGroup(trades, week);
  const rColor = group.totalR > 0 ? "text-success" : group.totalR < 0 ? "text-destructive" : "text-warning";

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
        week_start: week,
        mistakes,
        lessons,
        prevention_plan: prevention,
        best_trade_days: bestDays,
      });
      setReview(rev);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <Link href="/journal" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Journal
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-primary/10 text-primary">
              W{group.weekNum} · {group.year}
            </span>
            <h1 className="text-2xl font-bold tracking-tight mt-2">Weekly Review</h1>
            <p className="text-sm text-muted-foreground mt-1">{group.rangeLabel}</p>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3 text-sm font-bold">
              <span className="text-success">{group.wins}W</span>
              <span className="text-destructive">{group.losses}L</span>
              <span className="text-warning">{group.bes}BE</span>
            </div>
            <div className="text-right pl-4 border-l border-border/50">
              <p className={cn("text-3xl font-black leading-none", rColor)}>{formatTotalR(group.totalR)}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mt-1">Week R</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main split: left = week trades, right = mistakes + lessons */}
      <div className="grid lg:grid-cols-2 gap-6 items-stretch">

      {/* LEFT — Per-day rows: trades + best-trade toggle */}
      <Card className="bg-card border-border/50">
        <CardContent className="p-4 sm:p-5 flex flex-col gap-2.5 h-full">
          <div>
            <p className="text-sm font-bold">Trades this week</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">Did you take the best trade each day?</p>
          </div>
          {group.days.map((day, i) => {
            const dayDate = new Date(day.date + "T12:00:00");
            const best = !!bestDays[day.date];
            return (
              <div
                key={day.date}
                className={cn(
                  "flex items-center gap-4 rounded-xl border p-3 transition-colors",
                  isToday(dayDate) ? "border-primary/40 bg-primary/5" : "border-border/40 bg-muted/15"
                )}
              >
                <div className="w-16 shrink-0">
                  <p className={cn("text-sm font-bold", isToday(dayDate) ? "text-primary" : "text-foreground/85")}>
                    {DAY_LABELS[i]}
                  </p>
                  <p className="text-xs text-muted-foreground">{format(dayDate, "MMM d")}</p>
                </div>

                <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-0">
                  {day.trades.length === 0 ? (
                    <span className="text-xs text-muted-foreground/40">No trades</span>
                  ) : (
                    day.trades.map((t) => (
                      <Link
                        key={t.id}
                        href={`/journal/${t.id}`}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold transition-colors",
                          t.result === "win" ? "bg-success/15 text-success hover:bg-success/25"
                            : t.result === "loss" ? "bg-destructive/15 text-destructive hover:bg-destructive/25"
                            : "bg-warning/15 text-warning hover:bg-warning/25"
                        )}
                      >
                        {instrumentName(t.instrument)}
                        <span className="opacity-80">
                          {t.result === "win" ? `+${t.rr}R` : t.result === "loss" ? "-1R" : "0R"}
                        </span>
                      </Link>
                    ))
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground hidden sm:block">Best trade</span>
                  <Switch checked={best} onChange={() => toggleBest(day.date)} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* RIGHT — Mistakes + Lessons */}
      <div className="flex flex-col gap-6">
        <ReviewField fill
          icon={AlertTriangle} iconClass="text-destructive"
          label="Mistakes made"
          placeholder="What went wrong this week? Be specific about the setups, the moments, and the decisions."
          value={mistakes} onChange={(v) => { setMistakes(v); setSaved(false); }}
        />
        <ReviewField fill
          icon={Lightbulb} iconClass="text-warning"
          label="Lessons learned"
          placeholder="What did the week teach you about your process, your edge, and yourself?"
          value={lessons} onChange={(v) => { setLessons(v); setSaved(false); }}
        />
      </div>

      </div>

      {/* BOTTOM — Prevention plan, full width */}
      <ReviewField
        icon={ListChecks} iconClass="text-success"
        label="Prevention plan for next week"
        placeholder="Step by step, how do you make sure these mistakes do not happen again next week?"
        value={prevention} onChange={(v) => { setPrevention(v); setSaved(false); }}
      />

      {/* Save */}
      <div className="flex items-center justify-end gap-3">
        {saved && !dirty && (
          <span className="text-xs text-success flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Saved
          </span>
        )}
        {saveError && (
          <span className="text-xs text-destructive">Could not save. Run the latest SQL migration in Supabase.</span>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !dirty}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-px disabled:opacity-40 disabled:hover:translate-y-0"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          {saving ? "Saving" : "Save review"}
        </button>
      </div>
    </div>
  );
}

// Clear on/off switch — marks whether the best trade was taken that day.
function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      title={checked ? "Best trade taken" : "Mark best trade taken"}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        checked ? "bg-success" : "bg-muted-foreground/30"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

function ReviewField({
  icon: Icon, iconClass, label, placeholder, value, onChange, fill,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  fill?: boolean;
}) {
  return (
    <div className={cn(fill ? "flex-1 flex flex-col gap-2" : "space-y-2")}>
      <label className="flex items-center gap-2 text-sm font-semibold text-foreground/85">
        <Icon className={cn("w-4 h-4", iconClass)} />
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={fill ? undefined : 7}
        className={cn(
          "w-full rounded-xl border border-border/70 bg-input px-4 py-3 text-sm leading-relaxed text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/15",
          fill ? "flex-1 min-h-[220px] resize-none" : "min-h-[180px] resize-y"
        )}
      />
    </div>
  );
}
