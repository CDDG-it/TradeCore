"use client";

import { use } from "react";
import { TradeDetail } from "@/components/journal/trade-detail";

export default function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <TradeDetail id={id} />;
}
