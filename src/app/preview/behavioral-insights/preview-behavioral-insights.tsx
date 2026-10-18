"use client";

import { useMemo, useState } from "react";
import { BehavioralInsights } from "@/components/analytics/behavioral-insights";
import { sampleAnalyticsData } from "@/lib/journal/analytics-sample";

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
  return <div className="min-h-screen bg-background"><div className="flex h-[52px] items-center justify-end border-b border-border/40 px-6"><button type="button" onClick={() => setOnePerDay((value) => !value)} className="rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary">{onePerDay ? "Show mixed sample" : "Preview one trade per day"}</button></div><div className="mx-auto w-full max-w-[1700px] px-3 py-4 sm:px-6 sm:py-8 lg:px-10"><BehavioralInsights trades={trades} ruleChecks={data.ruleChecks} accounts={[]} exercises={[]} /></div></div>;
}
