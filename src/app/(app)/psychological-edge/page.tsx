"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { cn } from "@/lib/utils";
import { HabitsView } from "@/components/habits/habits-view";
import { MindScoreBreakdown } from "@/components/mind-score/mindscore-breakdown";

/**
 * MC Mind Edge — the "away from the charts" half of the MC Mindset Formula.
 * It holds the two things a trader controls off the screen: the habits that
 * build state, and the MC Mindscore that rolls discipline, habits and process
 * work into one number.
 *
 * The per-trade 5R reflection that used to live here has moved to MC Trade
 * Therapist, where it runs as a guided post-trade session against the trade
 * history — see /trade-therapist.
 */
type EdgeTab = "habits" | "mindscore";
const EDGE_TABS: { key: EdgeTab; label: string; blurb: string }[] = [
  {
    key: "habits",
    label: "Habits",
    blurb: "The routines you keep away from the charts — the daily reps that build the state you trade from.",
  },
  {
    key: "mindscore",
    label: "MC Mindscore",
    blurb: "One number rolling your rule-following, daily habits and process work into a single read.",
  },
];

/** Segmented control with a sliding active pill — the app's shared tab language. */
function EdgeToggle({ tab, onChange }: { tab: EdgeTab; onChange: (t: EdgeTab) => void }) {
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
      {EDGE_TABS.map(({ key, label }) => {
        const active = tab === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              "relative flex-1 sm:flex-none inline-flex items-center justify-center rounded-lg px-4 sm:px-5 py-2 text-sm font-semibold transition-colors duration-200 whitespace-nowrap",
              active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <motion.span
                layoutId="edge-tab-pill"
                className="absolute inset-0 rounded-lg"
                style={{
                  background: "linear-gradient(160deg, #14B8A6, #0d9488 60%, #0f766e)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), 0 6px 18px rgba(20,184,166,0.30)",
                }}
                transition={{ type: "spring", stiffness: 460, damping: 34 }}
              />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function MindEdgePage() {
  // Habits is the landing tab — it's the daily-touch surface of Mind Edge.
  const [tab, setTab] = useState<EdgeTab>("habits");

  // Allow deep-linking to a specific tab.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (EDGE_TABS.some((x) => x.key === t)) setTab(t as EdgeTab);
  }, []);

  const active = EDGE_TABS.find((x) => x.key === tab)!;

  return (
    <div className="space-y-5">
      {/* Header — title, contextual blurb, and the tab control */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-lg font-bold leading-none tracking-tight text-foreground md:text-xl">
            MC Mind Edge
          </h1>
          <p className="mt-2 max-w-xl text-[12px] leading-relaxed text-muted-foreground">
            {active.blurb}
          </p>
        </div>
        <EdgeToggle tab={tab} onChange={setTab} />
      </div>

      <PageWrapper>
        {tab === "habits" ? <HabitsView /> : <MindScoreBreakdown />}
      </PageWrapper>
    </div>
  );
}
