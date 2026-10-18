"use client";

import { useMemo, useState } from "react";
import { BehavioralInsights } from "@/components/analytics/behavioral-insights";
import { sampleAnalyticsData } from "@/lib/journal/analytics-sample";
import { addDays, format, startOfWeek } from "date-fns";
import type { BestTradeOfDay, Habit, HabitCompletion, PreMarketExercise, WeeklyTradeReview } from "@/lib/types";

export function PreviewBehavioralInsights() {
  const data = useMemo(() => sampleAnalyticsData(new Date()), []);
  const [onePerDay, setOnePerDay] = useState(false);
  const trades = useMemo(() => {
    if (!onePerDay) return data.trades;
    const dates = new Set<string>();
    return data.trades.filter((trade) => {
      const date = trade.date_time.slice(0, 10);
      if (dates.has(date)) return false;
      dates.add(date);
      return true;
    });
  }, [data.trades, onePerDay]);
  const context = useMemo(() => {
    const days = [...new Set(data.trades.map((trade) => trade.date_time.slice(0, 10)))].sort();
    const created_at = `${days[0]}T07:00:00`;
    const habits: Habit[] = [{ id: "preview-habit", user_id: "sample", name: "Prepare", category: "routine", frequency: "weekdays", target_days: 5, color: "", icon: "", created_at, updated_at: created_at }];
    const habitCompletions: HabitCompletion[] = days.filter((_, index) => index % 4 !== 0).map((date, index) => ({ id: `hc-${index}`, habit_id: habits[0].id, date, completed: true }));
    const exercises: PreMarketExercise[] = days.filter((_, index) => index % 3 !== 0).map((date, index) => ({ id: `pm-${index}`, user_id: "sample", date, loss_plans: {}, win_plans: {}, focus: "Follow the plan", exercise_type: "loss_win_review", inputs: {}, commitment_text: "", commitment_format: null, completed_at: `${date}T07:30:00`, created_at: `${date}T07:00:00`, updated_at: `${date}T07:30:00` }));
    const weeks = [...new Set(days.map((date) => format(startOfWeek(new Date(`${date}T12:00:00`), { weekStartsOn: 1 }), "yyyy-MM-dd")))];
    const weeklyReviews: WeeklyTradeReview[] = weeks.filter((_, index) => index % 3 !== 0).map((week_start, index) => ({ id: `wr-${index}`, user_id: "sample", week_start, mistakes: "Review", lessons: "", prevention_plan: "", best_trade_days: {}, created_at: `${format(addDays(new Date(`${week_start}T12:00:00`), 5), "yyyy-MM-dd")}T18:00:00`, updated_at: `${format(addDays(new Date(`${week_start}T12:00:00`), 5), "yyyy-MM-dd")}T18:00:00` }));
    const recaps: Pick<BestTradeOfDay, "date" | "review_step" | "taken_was_best" | "notes" | "post_market_analysis" | "updated_at">[] = days.filter((_, index) => index % 3 !== 0).map((date) => ({ date, review_step: "complete", taken_was_best: true, notes: "", post_market_analysis: "Reviewed", updated_at: `${date}T19:00:00` }));
    return { habits, habitCompletions, weeklyReviews, recaps, exercises };
  }, [data.trades]);
  return <div className="min-h-screen bg-background"><div className="flex h-[52px] items-center justify-end border-b border-border/40 px-6"><button type="button" onClick={() => setOnePerDay((value) => !value)} className="rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary">{onePerDay ? "Toon gevarieerd voorbeeld" : "Toon één trade per dag"}</button></div><div className="mx-auto w-full max-w-[1700px] px-3 py-4 sm:px-6 sm:py-8 lg:px-10"><BehavioralInsights trades={trades} ruleChecks={data.ruleChecks} {...context} preview /></div></div>;
}
