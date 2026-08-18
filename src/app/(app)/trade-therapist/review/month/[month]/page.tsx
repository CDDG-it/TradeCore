"use client";

import { use } from "react";
import { MonthlyReviewView } from "@/components/trade-therapist/monthly-review-view";

export default function MonthlyReviewPage({ params }: { params: Promise<{ month: string }> }) {
  const { month } = use(params);
  return <MonthlyReviewView month={month} />;
}
