"use client";

import { useEffect, useState } from "react";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { SectionNav } from "@/components/layout/section-nav";
import { HabitsView } from "@/components/habits/habits-view";
import { MindScoreBreakdown } from "@/components/mind-score/mindscore-breakdown";
import { GoalsView } from "@/components/goals/goals-view";
import { TradingRulesEditor } from "@/components/habits/trading-rules";
import { ConfluencesEditor } from "@/components/habits/confluences-editor";
import { MonteCarloSimulator } from "@/components/strategy/monte-carlo";
import { MobileSubnav } from "@/components/layout/mobile-nav";

/**
 * My Edge: everything the trader controls away from the chart, in one place.
 *
 * Two halves, kept visibly separate rather than blended into one tab strip:
 *   • Mind Edge: the habits that build state, the goals you are working
 *                towards, and the Mindscore that reads how it is going.
 *   • Strategy:  the rules and confluences you trade against, and the Monte
 *                Carlo pass simulation that pressure-tests them.
 *
 * (Route stays /psychological-edge so existing links keep working; /strategy
 * redirects into the Strategy half.)
 */
type EdgeTab = "habits" | "goals" | "mindscore" | "rules" | "simulator";
type EdgeGroup = "mind" | "strategy";

const EDGE_TABS: { key: EdgeTab; group: EdgeGroup; label: string; short?: string }[] = [
  {
    key: "habits",
    group: "mind",
    label: "Habits",
  },
  {
    key: "goals",
    group: "mind",
    label: "My Goals",
    short: "Goals",
  },
  {
    key: "mindscore",
    group: "mind",
    label: "MC Mindscore",
    short: "Mindscore",
  },
  {
    key: "rules",
    group: "strategy",
    label: "Rules & Confluences",
    short: "Rules",
  },
  {
    key: "simulator",
    group: "strategy",
    label: "Pass Simulation",
    short: "Simulation",
  },
];

export default function MyEdgePage() {
  // Habits is the landing tab: it's the daily-touch surface of My Edge.
  const [tab, setTab] = useState<EdgeTab>("habits");

  // Deep-linking, including /strategy redirecting into the Strategy half.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot sync from the URL, not a render loop
    if (EDGE_TABS.some((x) => x.key === t)) setTab(t as EdgeTab);
  }, []);

  // Switching half or view starts at the top: these pages are tall enough that
  // keeping the old offset drops you into the middle of the incoming one.
  function selectTab(next: EdgeTab) {
    if (next !== tab) window.scrollTo({ top: 0, behavior: "instant" });
    setTab(next);
  }

  return (
    <div className="space-y-3 sm:space-y-5">
      {/* Header: the title and, from lg, the split control. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="font-heading text-lg font-bold leading-none tracking-tight text-foreground md:text-xl">
          My Edge
        </h1>
        <SectionNav id="edge" items={EDGE_TABS} value={tab} onChange={selectTab} />
      </div>

      {/* Phone: the same four views, docked above the bottom bar. */}
      <MobileSubnav items={EDGE_TABS} value={tab} onChange={selectTab} label="My Edge sections" />

      <PageWrapper>
        {tab === "habits" && <HabitsView />}
        {tab === "goals" && <GoalsView />}
        {tab === "mindscore" && <MindScoreBreakdown />}
        {tab === "rules" && (
          <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-3 sm:gap-6 lg:grid-cols-2">
            <TradingRulesEditor />
            <ConfluencesEditor />
          </div>
        )}
        {tab === "simulator" && <MonteCarloSimulator />}
      </PageWrapper>
    </div>
  );
}
