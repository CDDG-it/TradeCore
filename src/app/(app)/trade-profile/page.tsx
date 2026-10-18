"use client";

import { TradeProfileApp } from "@/components/trade-profile/app";
import { TradeProfileProvider } from "@/components/trade-profile/store";

/**
 * My Trade Profile: a Big Five personality assessment (IPIP-NEO-120) turned
 * into a 12-week trait development program, with daily check-ins and retests
 * at weeks 6 and 12. Data lives in the trade_profile_* tables
 * (sql/trade_profile.sql); content and rules live in src/lib/trade-profile.
 */
export default function TradeProfilePage() {
  return (
    <TradeProfileProvider>
      <TradeProfileApp />
    </TradeProfileProvider>
  );
}
