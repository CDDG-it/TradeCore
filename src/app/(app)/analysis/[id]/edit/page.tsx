"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { AnalysisEditor } from "@/components/analysis/analysis-editor";
import { getAnalysisById } from "@/lib/supabase/queries";
import type { PreTradeAnalysis } from "@/lib/types";

export default function EditAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [analysis, setAnalysis] = useState<PreTradeAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAnalysisById(id).then((value) => { if (!cancelled) setAnalysis(value); })
      .catch(() => { if (!cancelled) setAnalysis(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div className="flex h-64 items-center justify-center" role="status"><span className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /><span className="sr-only">Loading analysis</span></div>;
  if (!analysis) return <div className="py-20 text-center text-sm text-muted-foreground">Analysis not found. <Link href="/analysis" className="text-primary">Back to analyses</Link></div>;
  return <AnalysisEditor key={analysis.id} mode="edit" analysisId={analysis.id} initial={analysis} />;
}
