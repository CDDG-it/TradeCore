"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { TradingRulesEditor } from "@/components/habits/trading-rules";
import { ConfluencesEditor } from "@/components/habits/confluences-editor";
import { MonteCarloSimulator } from "@/components/strategy/monte-carlo";

type StrategyTab = "rules" | "simulator";
const STRATEGY_TABS: { key: StrategyTab; label: string }[] = [
  { key: "rules", label: "Trading Rules & Confluences" },
  { key: "simulator", label: "MC Pass Simulation" },
];

export default function StrategyPage() {
  const [tab, setTab] = useState<StrategyTab>("rules");

  // Allow deep-linking to a specific subtab.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (STRATEGY_TABS.some((x) => x.key === t)) setTab(t as StrategyTab);
  }, []);

  return (
    <div className="space-y-5">
      {/* Compact header — title and subtabs share one row */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-heading font-bold text-lg md:text-xl text-foreground tracking-tight leading-none">
          My Strategy
        </h1>

        <div className="flex w-full sm:w-fit rounded-lg border border-border/60 overflow-hidden">
          {STRATEGY_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex-1 sm:flex-none px-4 sm:px-5 py-2 text-sm font-semibold transition-colors whitespace-nowrap",
                tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <PageWrapper>
        {tab === "rules" ? (
          <div className="grid lg:grid-cols-2 gap-6 items-start">
            <TradingRulesEditor />
            <ConfluencesEditor />
          </div>
        ) : (
          <MonteCarloSimulator />
        )}
      </PageWrapper>
    </div>
  );
}
