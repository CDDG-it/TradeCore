"use client";

import { useEffect, useState } from "react";
import { FeatureGate } from "@/components/access/access-provider";
import { BehavioralInsights } from "@/components/analytics/behavioral-insights";
import { getAllTradeRuleChecks, getBestTradesOfDay, getHabitCompletions, getHabits, getPreMarketExercises, getTrades, getWeeklyTradeReviews } from "@/lib/supabase/queries";
import type { Habit, HabitCompletion, PreMarketExercise, TradeJournalEntry, TradeRuleCheck, WeeklyTradeReview } from "@/lib/types";
import type { BestTradeListRow } from "@/lib/supabase/queries";

type Data = { trades: TradeJournalEntry[]; ruleChecks: TradeRuleCheck[]; exercises: PreMarketExercise[]; habits: Habit[]; habitCompletions: HabitCompletion[]; weeklyReviews: WeeklyTradeReview[]; recaps: BestTradeListRow[] };

function PsychologyContent() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    Promise.all([getTrades(), getAllTradeRuleChecks(), getPreMarketExercises(), getHabits(), getHabitCompletions(), getWeeklyTradeReviews(), getBestTradesOfDay()])
      .then(([trades, ruleChecks, exercises, habits, habitCompletions, weeklyReviews, recaps]) => setData({ trades, ruleChecks, exercises, habits, habitCompletions, weeklyReviews, recaps }))
      .catch(() => setError(true));
  }, []);
  if (error) return <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">Gedragsinzichten konden niet worden geladen. Vernieuw de pagina en probeer het opnieuw.</div>;
  if (!data) return <div className="space-y-4" aria-busy="true"><div className="h-20 animate-pulse rounded-2xl bg-card/60" /><div className="grid gap-3 sm:grid-cols-3">{[0, 1, 2].map((n) => <div key={n} className="h-36 animate-pulse rounded-2xl bg-card/60" />)}</div></div>;
  return <BehavioralInsights {...data} />;
}

export default function PsychologyAnalyticsPage() {
  return <FeatureGate feature="advancedAnalytics"><PsychologyContent /></FeatureGate>;
}
