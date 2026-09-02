"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { getProfile, getTrades } from "@/lib/supabase/queries";
import { DailyBestTrade } from "@/components/trade-therapist/daily-best-trade";
import { ReviewsPanel } from "@/components/trade-therapist/reviews-panel";
import { PreMarketExercises } from "@/components/trade-therapist/pre-market-exercises";
import type { TradeJournalEntry } from "@/lib/types";

/**
 * MC Trade Therapist — the surface for getting better at trading. Two views:
 *   • Best trades — a week calendar of your results and executions, and the best
 *                   trade of the day for the selected date.
 *   • Reviews     — the weekly and monthly write-ups, auto-synced and only
 *                   counted in the MC Mindscore once a week has closed.
 * Every read is deterministic and traces back to the trader's own history.
 */
type TherapistTab = "daily" | "premarket" | "reviews";
const TABS: { key: TherapistTab; label: string }[] = [
  { key: "daily", label: "Best trades" },
  { key: "premarket", label: "Pre-market exercises" },
  { key: "reviews", label: "Reviews" },
];

/** Glassy, animated segmented toggle — the active pill slides between tabs. */
function GlassToggle({ tab, onChange }: { tab: TherapistTab; onChange: (t: TherapistTab) => void }) {
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
      {TABS.map(({ key, label }) => {
        const active = tab === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              "relative flex-1 sm:flex-none rounded-lg px-4 sm:px-6 py-2 text-sm font-semibold transition-colors duration-200",
              active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <motion.span
                layoutId="therapist-tab-pill"
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

export default function TradeTherapistPage() {
  const [tab, setTab] = useState<TherapistTab>("daily");
  const [dailyDate, setDailyDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [userId, setUserId] = useState<string | null>(null);
  const [trades, setTrades] = useState<TradeJournalEntry[]>([]);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (TABS.some((x) => x.key === t)) setTab(t as TherapistTab);
    getProfile().then((p) => { if (p?.id) setUserId(p.id); });
    getTrades().then(setTrades).catch(() => {});
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading font-bold text-lg md:text-xl text-foreground tracking-tight leading-none">
          MC Trade Therapist
        </h1>
        <GlassToggle tab={tab} onChange={setTab} />
      </div>

      <PageWrapper>
        {tab === "daily" && (
          <DailyBestTrade
            date={dailyDate}
            trades={trades}
            onDateChange={setDailyDate}
            userId={userId}
          />
        )}
        {tab === "premarket" && <PreMarketExercises trades={trades} date={dailyDate} />}
        {tab === "reviews" && <ReviewsPanel />}
      </PageWrapper>
    </div>
  );
}
