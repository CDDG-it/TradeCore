"use client";

import { useState } from "react";
import { AnalysisEditor } from "@/components/analysis/analysis-editor";

export default function NewAnalysisPage() {
  // Charts upload into this analysis's Storage folder before the row is saved.
  const [analysisId] = useState(() => crypto.randomUUID());
  return <AnalysisEditor mode="new" analysisId={analysisId} />;
}
