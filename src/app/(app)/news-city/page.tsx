"use client";

import { Suspense } from "react";
import { MarketsDesk, loading } from "@/components/gmi/markets-desk";

export default function GlobalMarketsPage() {
  return <Suspense fallback={loading()}><MarketsDesk /></Suspense>;
}
