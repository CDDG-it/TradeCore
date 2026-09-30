"use client";

import { use } from "react";
import { MonthlyReviewView } from "@/components/trade-therapist/monthly-review-view";
import { FeatureGate } from "@/components/access/access-provider";

export default function MonthlyReviewPage({ params }: { params: Promise<{ month: string }> }) {
  const { month } = use(params);
  return <FeatureGate feature="monthlyReviews"><MonthlyReviewView month={month} /></FeatureGate>;
}
