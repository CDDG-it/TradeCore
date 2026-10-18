"use client";

import { TradeProfileApp } from "@/components/trade-profile/app";
import { TradeProfileProvider } from "@/components/trade-profile/store";

/**
 * My Trade Profile as a section of MC Trade Therapist: the Big Five assessment
 * and the 12-week trait program, scrolling inside the Therapist's viewport-high
 * frame like the other sections.
 */
export function TradeProfileTab({ demoOnly = false }: { demoOnly?: boolean }) {
  return (
    <TradeProfileProvider demoOnly={demoOnly}>
      <TradeProfileApp />
    </TradeProfileProvider>
  );
}
