"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { getProfile } from "@/lib/supabase/queries";
import { TherapistOverview } from "@/components/trade-therapist/therapist-overview";
import { DailyAnalysis } from "@/components/trade-therapist/daily-analysis";
import { ReviewsList } from "@/components/trade-therapist/reviews-list";
import { getTrades } from "@/lib/supabase/queries";
import type { TradeJournalEntry } from "@/lib/types";

/**
 * MC Trade Therapist — the surface for getting better at trading. Three views:
 *   • Overview   — a calendar of taken trades + outcomes and what behaviour is
 *                  costing R.
 *   • Daily      — the post-market analysis and best trade of the day for one date.
 *   • Reviews    — the weekly and monthly write-ups, auto-synced and only counted
 *                  in the MC Mindscore once a week has closed.
 * Every read is deterministic and traces back to the trader's own history.
 */
type TherapistTab = "overview" | "daily" | "reviews";
const TABS: { key: TherapistTab; label: string; hint: string }[] = [
  { key: "overview", label: "Overview", hint: "Your trades, outcomes and what to fix" },
  { key: "daily", label: "Daily", hint: "Post-market analysis and best trade of the day" },
  { key: "reviews", label: "Reviews", hint: "Weekly and monthly, synced at week's end" },
];

export default function TradeTherapistPage() {
  const [tab, setTab] = useState<TherapistTab>("overview");
  const [dailyDate, setDailyDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [userId, setUserId] = useState<string | null>(null);
  const [trades, setTrades] = useState<TradeJournalEntry[]>([]);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (TABS.some((x) => x.key === t)) setTab(t as TherapistTab);
    getProfile().then((p) => { if (p?.id) setUserId(p.id); });
    getTrades().then(setTrades).catch(() => {});
  }, []);

  const active = TABS.find((t) => t.key === tab)!;

  function openDay(date: string) {
    setDailyDate(date);
    setTab("daily");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
            MC Mindset Formula
          </p>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-foreground tracking-tight leading-[0.95]">
            MC Trade Therapist
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{active.hint}</p>
        </div>

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
        {tab === "overview" && <TherapistOverview onOpenDay={openDay} />}
        {tab === "daily" && (
          <DailyAnalysis
            date={dailyDate}
            trades={trades}
            onDateChange={setDailyDate}
            userId={userId}
          />
        )}
        {tab === "reviews" && <ReviewsList />}
      </PageWrapper>
    </div>
  );
}
