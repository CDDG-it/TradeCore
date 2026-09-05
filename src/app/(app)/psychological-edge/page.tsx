"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { cn } from "@/lib/utils";
import { HabitsView } from "@/components/habits/habits-view";
import { MindScoreBreakdown } from "@/components/mind-score/mindscore-breakdown";
import { TradingRulesEditor } from "@/components/habits/trading-rules";
import { ConfluencesEditor } from "@/components/habits/confluences-editor";
import { MonteCarloSimulator } from "@/components/strategy/monte-carlo";
import { MobileSubnav } from "@/components/layout/mobile-nav";

/**
 * My Edge — everything the trader controls away from the chart, in one place.
 *
 * Two halves, kept visibly separate rather than blended into one tab strip:
 *   • Mind Edge — the habits that build state and the Mindscore that reads it.
 *   • Strategy  — the rules and confluences you trade against, and the Monte
 *                 Carlo pass simulation that pressure-tests them.
 *
 * (Route stays /psychological-edge so existing links keep working; /strategy
 * redirects into the Strategy half.)
 */
type EdgeTab = "habits" | "mindscore" | "rules" | "simulator";
type EdgeGroup = "mind" | "strategy";

const GROUPS: { key: EdgeGroup; label: string; accent: string }[] = [
  { key: "mind", label: "Mind Edge", accent: "#14B8A6" },
  { key: "strategy", label: "Strategy", accent: "#06B6D4" },
];

const EDGE_TABS: { key: EdgeTab; group: EdgeGroup; label: string; short?: string }[] = [
  {
    key: "habits",
    group: "mind",
    label: "Habits",
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

/**
 * Segmented control split into its two halves. Each half carries its own label
 * and accent, with a rule between them, so the Mind Edge and Strategy sides
 * read as separate territory rather than one long row of tabs.
 */
function EdgeToggle({ tab, onChange }: { tab: EdgeTab; onChange: (t: EdgeTab) => void }) {
  return (
    <div
      className="hidden w-full flex-col gap-1 rounded-xl border border-border/50 p-1 sm:w-fit sm:flex-row sm:items-stretch sm:gap-0 lg:flex"
      style={{
        background: "color-mix(in oklch, var(--card) 70%, transparent)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {GROUPS.map((g, gi) => (
        <div
          key={g.key}
          className={cn(
            "flex flex-col gap-1 px-1",
            gi > 0 && "border-t border-border/50 pt-1 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0 sm:ml-2"
          )}
        >
          <span
            className="px-2 pt-0.5 text-[9px] font-bold uppercase tracking-[0.16em]"
            style={{ color: `color-mix(in oklch, ${g.accent} 75%, transparent)` }}
          >
            {g.label}
          </span>
          <div className="flex gap-1">
            {EDGE_TABS.filter((t) => t.group === g.key).map(({ key, label }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChange(key)}
                  className={cn(
                    "relative flex-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors duration-200 sm:flex-none sm:px-4",
                    active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="edge-tab-pill"
                      className="absolute inset-0 rounded-lg"
                      style={{
                        background: `linear-gradient(160deg, ${g.accent}, color-mix(in oklch, ${g.accent} 70%, black) 90%)`,
                        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.22), 0 6px 18px color-mix(in oklch, ${g.accent} 30%, transparent)`,
                      }}
                      transition={{ type: "spring", stiffness: 460, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MyEdgePage() {
  // Habits is the landing tab — it's the daily-touch surface of My Edge.
  const [tab, setTab] = useState<EdgeTab>("habits");

  // Deep-linking, including /strategy redirecting into the Strategy half.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
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
      {/* Header — the title and, from lg, the split control. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="font-heading text-lg font-bold leading-none tracking-tight text-foreground md:text-xl">
          My Edge
        </h1>
        <EdgeToggle tab={tab} onChange={selectTab} />
      </div>

      {/* Phone: the same four views, docked above the bottom bar. */}
      <MobileSubnav items={EDGE_TABS} value={tab} onChange={selectTab} label="My Edge sections" />

      <PageWrapper>
        {tab === "habits" && <HabitsView />}
        {tab === "mindscore" && <MindScoreBreakdown />}
        {tab === "rules" && (
          <div className="grid items-start gap-3 sm:gap-6 lg:grid-cols-2">
            <TradingRulesEditor />
            <ConfluencesEditor />
          </div>
        )}
        {tab === "simulator" && <MonteCarloSimulator />}
      </PageWrapper>
    </div>
  );
}
