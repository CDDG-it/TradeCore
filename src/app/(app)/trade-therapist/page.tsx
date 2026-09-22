"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { SectionNav } from "@/components/layout/section-nav";
import { getProfile, getTrades } from "@/lib/supabase/queries";
import { DailyBestTrade } from "@/components/trade-therapist/daily-best-trade";
import { ReviewsPanel } from "@/components/trade-therapist/reviews-panel";
import { PreMarketExercises } from "@/components/trade-therapist/pre-market-exercises";
import { CommitmentsPanel } from "@/components/trade-therapist/commitments-panel";
import { MobileSubnav } from "@/components/layout/mobile-nav";
import type { TradeJournalEntry } from "@/lib/types";

/**
 * MC Trade Therapist: the surface for getting better at trading. Four views:
 *   • Best trades: a week calendar of your results and executions, and the
 *                  best trade of the day for the selected date.
 *   • Pre-market:  the last two losses and two wins, with a written plan for
 *                  preventing and repeating them today.
 *   • Commitments: your standing if/then rules, and whether you held them
 *                  when the behaviour they guard against recurred.
 *   • Reviews:     the weekly and monthly write-ups, auto-synced and only
 *                  counted in the MC Mindscore once a week has closed.
 * Every read is deterministic and traces back to the trader's own history.
 */
type TherapistTab = "daily" | "premarket" | "commitments" | "reviews";
const TABS: { key: TherapistTab; label: string; short?: string }[] = [
  { key: "daily", label: "Best trades", short: "Best trades" },
  { key: "premarket", label: "Pre-market exercises", short: "Pre-market" },
  { key: "commitments", label: "Commitments" },
  { key: "reviews", label: "Reviews" },
];

export default function TradeTherapistPage() {
  const [tab, setTab] = useState<TherapistTab>("daily");
  const [dailyDate, setDailyDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [userId, setUserId] = useState<string | null>(null);
  const [trades, setTrades] = useState<TradeJournalEntry[]>([]);

  // Read the deep-linked tab after mount rather than during render: the page is
  // prerendered, so seeding state from the URL up front would make the server
  // and client markup disagree.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot sync from the URL, not a render loop
    if (TABS.some((x) => x.key === t)) setTab(t as TherapistTab);
    getProfile().then((p) => { if (p?.id) setUserId(p.id); });
    getTrades().then(setTrades).catch(() => {});
  }, []);

  return (
    // One screen, no page scroll: the title row is fixed and the active view
    // takes the height that is left, scrolling inside itself where it must.
    // 7.5rem is the top nav plus the page gutter above and below it.
    <div className="flex flex-col gap-4 lg:h-[calc(100dvh-7.5rem)] lg:overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading font-bold text-lg md:text-xl text-foreground tracking-tight leading-none">
          MC Trade Therapist
        </h1>
        <SectionNav id="therapist" items={TABS} value={tab} onChange={setTab} />
      </div>

      {/* Phone: the same tabs, docked above the bottom bar. */}
      <MobileSubnav items={TABS} value={tab} onChange={setTab} label="Therapist sections" />

      <PageWrapper className="min-h-0 flex-1 space-y-0">
        {tab === "daily" && (
          <DailyBestTrade
            date={dailyDate}
            trades={trades}
            onDateChange={setDailyDate}
            userId={userId}
          />
        )}
        {tab === "premarket" && <PreMarketExercises trades={trades} date={dailyDate} />}
        {tab === "commitments" && <CommitmentsPanel />}
        {tab === "reviews" && <ReviewsPanel />}
      </PageWrapper>
    </div>
  );
}
