"use client";

import { useMemo } from "react";
import { BehavioralInsights } from "@/components/analytics/behavioral-insights";
import { sampleAnalyticsData } from "@/lib/journal/analytics-sample";

export function PreviewBehavioralInsights() {
  const data = useMemo(() => sampleAnalyticsData(new Date()), []);
  return <div className="min-h-screen bg-background"><div aria-hidden className="h-[52px] border-b border-border/40" /><div className="mx-auto w-full max-w-[1700px] px-3 py-4 sm:px-6 sm:py-8 lg:px-10"><BehavioralInsights trades={data.trades} ruleChecks={data.ruleChecks} accounts={[]} exercises={[]} /></div></div>;
}
