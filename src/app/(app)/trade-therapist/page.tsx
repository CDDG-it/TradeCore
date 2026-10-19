"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { SectionNav } from "@/components/layout/section-nav";
import { getTrades } from "@/lib/supabase/queries";
import { TherapistToday } from "@/components/trade-therapist/therapist-today";
import type { TradeJournalEntry } from "@/lib/types";
import { FeatureGate } from "@/components/access/access-provider";

const tabLoading = () => <div className="h-48 animate-pulse rounded-2xl bg-card/60" role="status" aria-label="Loading section" />;
const PostMarketDayDesk = dynamic(() => import("@/components/trade-therapist/post-market-day-desk").then((m) => m.PostMarketDayDesk), { loading: tabLoading });
const ReviewsPanel = dynamic(() => import("@/components/trade-therapist/reviews-panel").then((m) => m.ReviewsPanel), { loading: tabLoading });
const PreMarketExercises = dynamic(() => import("@/components/trade-therapist/pre-market-exercises").then((m) => m.PreMarketExercises), { loading: tabLoading });
const TradeProfileTab = dynamic(() => import("@/components/trade-profile/trade-profile-tab").then((m) => m.TradeProfileTab), { loading: tabLoading });

/**
 * MC Trade Therapist: the surface for getting better at trading. Four views:
 *   • Today:       where the day stands (pre-market, Post Market, weekly
 *                  review) with nothing started until the trader picks it.
 *   • Post Market: one question per screen, followed by the selected day's
 *                  trades, review and measured R potential observations.
 *   • Pre-market:  the last two losses and two wins, with a written plan for
 *                  preventing and repeating them today.
 *   • Reviews:     the weekly and monthly write-ups, auto-synced and only
 *                  counted in the MC Mindscore once a week has closed.
 *   • My Trade Profile: the Big Five assessment and the 12-week trait
 *                  program built on it (src/components/trade-profile).
 * Every read is deterministic and traces back to the trader's own history.
 */
type TherapistTab = "today" | "daily" | "premarket" | "reviews" | "profile";
const TABS: { key: TherapistTab; label: string; short?: string }[] = [
  { key: "today", label: "Today" },
  { key: "daily", label: "Post Market", short: "Post Market" },
  { key: "premarket", label: "Pre-market exercises", short: "Pre-market" },
  { key: "reviews", label: "Reviews" },
  { key: "profile", label: "My Trade Profile", short: "Trade Profile" },
];

export default function TradeTherapistPage() {
  const [tab, setTab] = useState<TherapistTab>("today");
  const [ready, setReady] = useState(false);
  // Only true when the trader asked to start the review (from Today, or a
  // `?start=1` link): the Post Market desk otherwise opens on the day overview.
  const [startReview, setStartReview] = useState(false);
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
    if (t === "daily" && params.get("start") === "1") setStartReview(true);
    if (params.has("start")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("start");
      window.history.replaceState(window.history.state, "", url);
    }
    if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate) && !Number.isNaN(Date.parse(`${selectedDate}T12:00:00`)) && selectedDate <= format(new Date(), "yyyy-MM-dd")) setDailyDate(selectedDate);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || (tab !== "today" && tab !== "daily" && tab !== "premarket")) return;
    let active = true;
    getTrades().then((rows) => { if (active) setTrades(rows); }).catch(() => {});
    return () => { active = false; };
  }, [ready, tab]);

  // Keep the address bar in step with what is on screen, without the one-shot
  // `start` flag: a refresh or a shared link reopens the view, never a question.
  function syncUrl(next: { tab?: TherapistTab; date?: string }) {
    const url = new URL(window.location.href);
    if (next.tab) {
      if (next.tab === "today") url.searchParams.delete("tab");
      else url.searchParams.set("tab", next.tab);
    }
    if (next.date) url.searchParams.set("date", next.date);
    url.searchParams.delete("start");
    window.history.replaceState(window.history.state, "", url);
  }

  function selectTab(next: TherapistTab) {
    setStartReview(false);
    setTab(next);
    syncUrl({ tab: next });
  }

  function openPostMarket(date: string, start: boolean) {
    setDailyDate(date);
    setStartReview(start);
    setTab("daily");
    syncUrl({ tab: "daily", date });
  }

  function changeDate(date: string) {
    setStartReview(false);
    setDailyDate(date);
    syncUrl({ date });
  }

  if (!ready) return tabLoading();

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] min-h-[30rem] flex-col gap-3 sm:h-[calc(100dvh-9.5rem)] lg:h-[calc(100dvh-7.25rem)] lg:min-h-[35rem]">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4">
        <SectionNav
          title="MC Trade Therapist"
          titleClassName="font-heading font-bold text-lg md:text-xl text-foreground tracking-tight leading-none"
          items={TABS}
          value={tab}
          onChange={selectTab}
        />
      </div>

      <PageWrapper className="min-h-0 flex-1 space-y-0">
        {tab === "today" && (
          <TherapistToday trades={trades} onPreMarket={() => selectTab("premarket")} onPostMarket={openPostMarket} />
        )}
        {tab === "daily" && (
          <PostMarketDayDesk
            date={dailyDate}
            trades={trades}
            onDateChange={changeDate}
            autoStart={startReview}
          />
        )}
        {tab === "premarket" && <PreMarketExercises trades={trades} date={dailyDate} />}
        {tab === "reviews" && <FeatureGate feature="weeklyReviews"><ReviewsPanel /></FeatureGate>}
        {tab === "profile" && <TradeProfileTab />}
      </PageWrapper>
    </div>
  );
}
