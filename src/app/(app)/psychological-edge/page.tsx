"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MotionConfig, motion } from "motion/react";
import { EASE_OUT } from "@/lib/motion";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { SectionNav } from "@/components/layout/section-nav";
import { HabitsView } from "@/components/habits/habits-view";
import { FeatureGate } from "@/components/access/access-provider";

const tabLoading = () => <div className="h-48 animate-pulse rounded-2xl bg-card/60" role="status" aria-label="Loading section" />;
const GoalsView = dynamic(() => import("@/components/goals/goals-view").then((m) => m.GoalsView), { loading: tabLoading });
const MindScoreBreakdown = dynamic(() => import("@/components/mind-score/mindscore-breakdown").then((m) => m.MindScoreBreakdown), { loading: tabLoading });
const TradingRulesEditor = dynamic(() => import("@/components/habits/trading-rules").then((m) => m.TradingRulesEditor), { loading: tabLoading });
const ConfluencesEditor = dynamic(() => import("@/components/habits/confluences-editor").then((m) => m.ConfluencesEditor), { loading: tabLoading });
const MonteCarloSimulator = dynamic(() => import("@/components/strategy/monte-carlo").then((m) => m.MonteCarloSimulator), { loading: tabLoading });

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
  const [ready, setReady] = useState(false);

  // Deep-linking, including /strategy redirecting into the Strategy half.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot sync from the URL, not a render loop
    if (EDGE_TABS.some((x) => x.key === t)) setTab(t as EdgeTab);
    setReady(true);
  }, []);

  // Switching half or view starts at the top: these pages are tall enough that
  // keeping the old offset drops you into the middle of the incoming one.
  function selectTab(next: EdgeTab) {
    if (next !== tab) window.scrollTo({ top: 0, behavior: "instant" });
    setTab(next);
  }

  if (!ready) return tabLoading();

  return (
    <div className="space-y-3 sm:space-y-5">
      <div className="flex items-center justify-between gap-3">
        <SectionNav
          title="My Edge"
          titleClassName="font-heading text-lg font-bold leading-none tracking-tight text-foreground md:text-xl"
          items={EDGE_TABS}
          value={tab}
          onChange={selectTab}
        />
      </div>

      <PageWrapper>
        {/* One view hands over to the next instead of swapping in place. */}
        <MotionConfig reducedMotion="user">
          <motion.div
            key={tab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.12, ease: EASE_OUT }}
          >
            {tab === "habits" && <HabitsView />}
            {tab === "goals" && <FeatureGate feature="goals"><GoalsView /></FeatureGate>}
            {tab === "mindscore" && <MindScoreBreakdown />}
            {tab === "rules" && <FeatureGate feature="standingRules">
              <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-3 sm:gap-6 lg:grid-cols-2">
                <TradingRulesEditor />
                <ConfluencesEditor />
              </div>
            </FeatureGate>}
            {tab === "simulator" && <FeatureGate feature="monteCarlo"><MonteCarloSimulator /></FeatureGate>}
          </motion.div>
        </MotionConfig>
      </PageWrapper>
    </div>
  );
}
