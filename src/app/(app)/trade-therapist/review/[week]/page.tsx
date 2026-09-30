"use client";

import { use } from "react";
import { WeeklyReviewView } from "@/components/trade-therapist/weekly-review-view";
import { FeatureGate } from "@/components/access/access-provider";

export default function WeeklyReviewDetailPage({ params }: { params: Promise<{ week: string }> }) {
  const { week } = use(params);
  return <FeatureGate feature="weeklyReviews"><WeeklyReviewView weekStart={week} /></FeatureGate>;
}
