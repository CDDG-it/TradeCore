"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { SlidersHorizontal, Dices } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { TradingRulesEditor } from "@/components/habits/trading-rules";
import { ConfluencesEditor } from "@/components/habits/confluences-editor";
import { MonteCarloSimulator } from "@/components/strategy/monte-carlo";

type StrategyTab = "rules" | "simulator";
const STRATEGY_TABS: {
  key: StrategyTab;
  label: string;
  icon: typeof SlidersHorizontal;
  blurb: string;
}[] = [
  {
    key: "rules",
    label: "Rules & Confluences",
    icon: SlidersHorizontal,
    blurb: "The non-negotiables and setups that define how you trade — surfaced when you log a trade.",
  },
  {
    key: "simulator",
    label: "Pass Simulation",
    icon: Dices,
    blurb: "Pressure-test your edge against a funded account's rules across thousands of simulated runs.",
  },
];

/** Segmented control with a sliding active pill — the app's shared tab language. */
function StrategyToggle({ tab, onChange }: { tab: StrategyTab; onChange: (t: StrategyTab) => void }) {
  return (
    <div
      className="relative flex w-full sm:w-fit items-center gap-1 rounded-xl border border-border/50 p-1"
      style={{
        background: "color-mix(in oklch, var(--card) 70%, transparent)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {STRATEGY_TABS.map(({ key, label, icon: Icon }) => {
        const active = tab === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              "relative flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg px-4 sm:px-5 py-2 text-sm font-semibold transition-colors duration-200 whitespace-nowrap",
              active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <motion.span
                layoutId="strategy-tab-pill"
                className="absolute inset-0 rounded-lg"
                style={{
                  background: "linear-gradient(160deg, #14B8A6, #0d9488 60%, #0f766e)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), 0 6px 18px rgba(20,184,166,0.30)",
                }}
                transition={{ type: "spring", stiffness: 460, damping: 34 }}
              />
            )}
            <Icon className="relative z-10 h-3.5 w-3.5" />
            <span className="relative z-10">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function StrategyPage() {
  const [tab, setTab] = useState<StrategyTab>("rules");

  // Allow deep-linking to a specific subtab.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (STRATEGY_TABS.some((x) => x.key === t)) setTab(t as StrategyTab);
  }, []);

  const active = STRATEGY_TABS.find((x) => x.key === tab)!;

  return (
    <div className="space-y-5">
      {/* Header — title, contextual blurb, and the tab control */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-lg font-bold leading-none tracking-tight text-foreground md:text-xl">
            My Strategy
          </h1>
          <p className="mt-2 max-w-xl text-[12px] leading-relaxed text-muted-foreground">
            {active.blurb}
          </p>
        </div>
        <StrategyToggle tab={tab} onChange={setTab} />
      </div>

      <PageWrapper>
        {tab === "rules" ? (
          <div className="grid items-start gap-6 lg:grid-cols-2">
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
