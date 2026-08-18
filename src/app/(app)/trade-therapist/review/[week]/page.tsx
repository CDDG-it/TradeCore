"use client";

import { use } from "react";
import { WeeklyReviewView } from "@/components/trade-therapist/weekly-review-view";

export default function WeeklyReviewDetailPage({ params }: { params: Promise<{ week: string }> }) {
  const { week } = use(params);
  return <WeeklyReviewView weekStart={week} />;
}
