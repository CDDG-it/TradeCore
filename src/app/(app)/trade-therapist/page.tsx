"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { SectionNav } from "@/components/layout/section-nav";
import { getTrades } from "@/lib/supabase/queries";
import { PostMarketDayDesk } from "@/components/trade-therapist/post-market-day-desk";
import { ReviewsPanel } from "@/components/trade-therapist/reviews-panel";
import { PreMarketExercises } from "@/components/trade-therapist/pre-market-exercises";
import type { TradeJournalEntry } from "@/lib/types";
import { FeatureGate } from "@/components/access/access-provider";

/**
 * MC Trade Therapist: the surface for getting better at trading. Four views:
 *   • Post Market: one day at a glance, with trades, review and measured
 *                  per-winning-trade R potential observations.
 *   • Pre-market:  the last two losses and two wins, with a written plan for
 *                  preventing and repeating them today.
 *   • Commitments: your standing if/then rules, and whether you held them
 *                  when the behaviour they guard against recurred.
 *   • Reviews:     the weekly and monthly write-ups, auto-synced and only
 *                  counted in the MC Mindscore once a week has closed.
 * Every read is deterministic and traces back to the trader's own history.
 */
type TherapistTab = "daily" | "premarket" | "reviews";
const TABS: { key: TherapistTab; label: string; short?: string }[] = [
  { key: "daily", label: "Post Market", short: "Post Market" },
  { key: "premarket", label: "Pre-market exercises", short: "Pre-market" },
  { key: "reviews", label: "Reviews" },
];

export default function TradeTherapistPage() {
  const [tab, setTab] = useState<TherapistTab>("daily");
  const [dailyDate, setDailyDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [trades, setTrades] = useState<TradeJournalEntry[]>([]);

  // Read the deep-linked tab after mount rather than during render: the page is
  // prerendered, so seeding state from the URL up front would make the server
  // and client markup disagree.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    const selectedDate = params.get("date");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot sync from the URL, not a render loop
    if (t === "commitments") setTab("premarket");
    else if (TABS.some((x) => x.key === t)) setTab(t as TherapistTab);
    if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate) && !Number.isNaN(Date.parse(`${selectedDate}T12:00:00`)) && selectedDate <= format(new Date(), "yyyy-MM-dd")) setDailyDate(selectedDate);
    getTrades().then(setTrades).catch(() => {});
  }, []);

  function changeDate(date: string) {
    setDailyDate(date);
    const url = new URL(window.location.href);
    url.searchParams.set("date", date);
    window.history.replaceState(window.history.state, "", url);
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 pr-28">
        <h1 className="font-heading font-bold text-lg md:text-xl text-foreground tracking-tight leading-none">
          MC Trade Therapist
        </h1>
        <SectionNav items={TABS} value={tab} onChange={setTab} focusMode={tab === "daily"} />
      </div>

      <PageWrapper className="min-h-0 flex-1 space-y-0">
        {tab === "daily" && (
          <PostMarketDayDesk
            key={dailyDate}
            date={dailyDate}
            trades={trades}
            onDateChange={changeDate}
          />
        )}
        {tab === "premarket" && <PreMarketExercises trades={trades} date={dailyDate} />}
        {tab === "reviews" && <FeatureGate feature="weeklyReviews"><ReviewsPanel /></FeatureGate>}
      </PageWrapper>
    </div>
  );
}
