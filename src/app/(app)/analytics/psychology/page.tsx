"use client";

import { useEffect, useState } from "react";
import { FeatureGate } from "@/components/access/access-provider";
import { BehavioralInsights } from "@/components/analytics/behavioral-insights";
import { getAccounts, getAllTradeRuleChecks, getPreMarketExercises, getTrades } from "@/lib/supabase/queries";
import type { FundedAccount, PreMarketExercise, TradeJournalEntry, TradeRuleCheck } from "@/lib/types";

type Data = { trades: TradeJournalEntry[]; ruleChecks: TradeRuleCheck[]; accounts: FundedAccount[]; exercises: PreMarketExercise[] };

function PsychologyContent() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    Promise.all([getTrades(), getAllTradeRuleChecks(), getAccounts(), getPreMarketExercises()])
      .then(([trades, ruleChecks, accounts, exercises]) => setData({ trades, ruleChecks, accounts, exercises }))
      .catch(() => setError(true));
  }, []);
  if (error) return <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">Behavioral insights could not be loaded. Refresh this page to try again.</div>;
  if (!data) return <div className="space-y-4" aria-busy="true"><div className="h-20 animate-pulse rounded-2xl bg-card/60" /><div className="grid gap-3 sm:grid-cols-3">{[0, 1, 2].map((n) => <div key={n} className="h-36 animate-pulse rounded-2xl bg-card/60" />)}</div></div>;
  return <BehavioralInsights {...data} />;
}

export default function PsychologyAnalyticsPage() {
  return <FeatureGate feature="advancedAnalytics"><PsychologyContent /></FeatureGate>;
}
