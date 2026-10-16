"use client";

import { useMemo } from "react";
import { AnalyticsDesk } from "@/components/analytics/analytics-desk";
import { sampleAnalyticsData } from "@/lib/journal/analytics-sample";

/**
 * The analytics desk on the sample journal, in the same frame the app shell
 * gives it: max width, gutters and the room the top bar takes.
 */
export function PreviewAnalytics() {
  const data = useMemo(() => sampleAnalyticsData(new Date()), []);
  return (
    <div className="min-h-screen bg-background">
      <div aria-hidden className="h-[52px] border-b border-border/40" />
      <div className="mx-auto w-full max-w-[1700px] px-3 py-4 sm:px-6 sm:py-8 lg:px-10">
        <AnalyticsDesk trades={data.trades} ruleChecks={data.ruleChecks} />
      </div>
    </div>
  );
}
