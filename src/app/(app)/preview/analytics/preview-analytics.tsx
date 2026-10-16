"use client";

import { useMemo } from "react";
import { AnalyticsDesk } from "@/components/analytics/analytics-desk";
import { sampleAnalyticsData } from "@/lib/journal/analytics-sample";

export function PreviewAnalytics() {
  const data = useMemo(() => sampleAnalyticsData(new Date()), []);
  return <AnalyticsDesk trades={data.trades} ruleChecks={data.ruleChecks} />;
}
