"use client";

import { useEffect, useState } from "react";
import { AnalysisOverview } from "@/components/analysis/analysis-overview";
import { getAnalyses, type AnalysisListRow } from "@/lib/supabase/queries";

export default function AnalysisPage() {
  const [analyses, setAnalyses] = useState<AnalysisListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAnalyses().then((rows) => { if (!cancelled) setAnalyses(rows); })
      .catch(() => { if (!cancelled) setFailed(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div role="status" className="flex h-64 items-center justify-center"><span className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /><span className="sr-only">Loading analyses</span></div>;
  if (failed) return <div role="alert" className="py-20 text-center text-sm text-muted-foreground">Could not load your analyses. Refresh the page to try again.</div>;
  return <AnalysisOverview analyses={analyses} />;
}
