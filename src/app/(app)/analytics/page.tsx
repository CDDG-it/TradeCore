"use client";

import { useEffect, useState } from "react";
import { FeatureGate } from "@/components/access/access-provider";
import { AnalyticsDesk } from "@/components/analytics/analytics-desk";
import { getAllTradeRuleChecks, getTrades } from "@/lib/supabase/queries";
import type { TradeJournalEntry, TradeRuleCheck } from "@/lib/types";

/** The desk's frame while the journal loads, so nothing jumps when it lands. */
function DeskSkeleton() {
  return (
    <div className="flex flex-col gap-3 lg:h-[calc(100dvh-7.25rem)] lg:min-h-[40rem]" aria-busy="true">
      <div className="h-7 w-40 animate-pulse rounded-lg bg-muted/40" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-7">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="h-[72px] animate-pulse rounded-2xl bg-card/60" />
        ))}
      </div>
      <div className="grid min-h-[30rem] flex-1 gap-3 lg:grid-cols-12 lg:grid-rows-[1.3fr_1fr]">
        {["lg:col-span-5", "lg:col-span-4", "lg:col-span-3", "lg:col-span-2", "lg:col-span-2", "lg:col-span-3", "lg:col-span-5"].map((c, i) => (
          <div key={i} className={`animate-pulse rounded-[22px] bg-card/50 ${c}`} />
        ))}
      </div>
    </div>
  );
}

function AnalyticsContent() {
  const [data, setData] = useState<{ trades: TradeJournalEntry[]; ruleChecks: TradeRuleCheck[] } | null>(null);
  useEffect(() => {
    Promise.all([getTrades(), getAllTradeRuleChecks()])
      .then(([trades, ruleChecks]) => setData({ trades, ruleChecks }))
      .catch(() => setData({ trades: [], ruleChecks: [] }));
  }, []);
  if (!data) return <DeskSkeleton />;
  return <AnalyticsDesk trades={data.trades} ruleChecks={data.ruleChecks} />;
}

export default function AnalyticsPage() {
  return <FeatureGate feature="advancedAnalytics"><AnalyticsContent /></FeatureGate>;
}
