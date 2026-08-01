"use client";

import { useEffect, useState } from "react";
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
const EDGE_TABS: { key: EdgeTab; label: string }[] = [
  { key: "habits", label: "Habits" },
  { key: "mindscore", label: "MC Mindscore" },
];

export default function MindEdgePage() {
  // Habits is the landing tab — it's the daily-touch surface of Mind Edge.
  const [tab, setTab] = useState<EdgeTab>("habits");

  // Allow deep-linking to a specific tab.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (EDGE_TABS.some((x) => x.key === t)) setTab(t as EdgeTab);
  }, []);

  return (
    <div className="space-y-5">
      {/* Compact header — title and tabs share one row to save vertical space */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
            MC Mindset Formula
          </p>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-foreground tracking-tight leading-[0.95]">
            MC Mind Edge
          </h1>
        </div>

        <div className="flex w-full sm:w-fit rounded-lg border border-border/60 overflow-hidden">
          {EDGE_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex-1 sm:flex-none px-4 sm:px-5 py-2 text-sm font-semibold transition-colors",
                tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <PageWrapper>
        {tab === "habits" ? <HabitsView /> : <MindScoreBreakdown />}
      </PageWrapper>
    </div>
  );
}
