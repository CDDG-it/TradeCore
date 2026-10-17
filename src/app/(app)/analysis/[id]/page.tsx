"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { AnalysisReview } from "@/components/analysis/analysis-review";
import { getAnalysisById, getTrades } from "@/lib/supabase/queries";
import type { PreTradeAnalysis, TradeJournalEntry } from "@/lib/types";

export default function AnalysisDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [analysis, setAnalysis] = useState<PreTradeAnalysis | null>(null);
  const [linkedTrade, setLinkedTrade] = useState<TradeJournalEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getAnalysisById(id), getTrades()]).then(([value, trades]) => {
      if (cancelled) return;
      setAnalysis(value);
      setLinkedTrade(trades.find((trade) => trade.linked_analysis_id === id) ?? null);
    }).catch(() => { if (!cancelled) setAnalysis(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div className="flex h-64 items-center justify-center" role="status"><span className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /><span className="sr-only">Loading analysis</span></div>;
  if (!analysis) return <div className="py-20 text-center text-sm text-muted-foreground">Analysis not found. <Link href="/analysis" className="text-primary">Back to analyses</Link></div>;
  return <AnalysisReview analysis={analysis} linkedTrade={linkedTrade} />;
}
