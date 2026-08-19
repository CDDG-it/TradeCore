"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { getProfile, getTrades } from "@/lib/supabase/queries";
import { DailyBestTrade } from "@/components/trade-therapist/daily-best-trade";
import { ReviewsPanel } from "@/components/trade-therapist/reviews-panel";
import type { TradeJournalEntry } from "@/lib/types";

/**
 * MC Trade Therapist — the surface for getting better at trading. Two views:
 *   • Daily    — a week calendar of results, and the best trade of the day plus
 *                the post-market recap for the selected day.
 *   • Reviews  — the weekly and monthly write-ups, auto-synced and only counted
 *                in the MC Mindscore once a week has closed.
 * Every read is deterministic and traces back to the trader's own history.
 */
type TherapistTab = "daily" | "reviews";
const TABS: { key: TherapistTab; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "reviews", label: "Reviews" },
];

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

        <div className="flex w-full sm:w-fit rounded-lg border border-border/60 overflow-hidden">
          {TABS.map(({ key, label }) => (
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
        {tab === "daily" && (
          <DailyBestTrade
            date={dailyDate}
            trades={trades}
            onDateChange={setDailyDate}
            userId={userId}
          />
        )}
        {tab === "reviews" && <ReviewsPanel />}
      </PageWrapper>
    </div>
  );
}
