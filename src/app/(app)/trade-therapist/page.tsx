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
import { CommitmentsPanel } from "@/components/trade-therapist/commitments-panel";
import { MobileSubnav } from "@/components/layout/mobile-nav";
import type { TradeJournalEntry } from "@/lib/types";

/**
 * MC Trade Therapist — the surface for getting better at trading. Four views:
 *   • Best trades  — a week calendar of your results and executions, and the
 *                    best trade of the day for the selected date.
 *   • Pre-market   — the last two losses and two wins, with a written plan for
 *                    preventing and repeating them today.
 *   • Commitments  — your standing if/then rules, and whether you held them
 *                    when the behaviour they guard against recurred.
 *   • Reviews      — the weekly and monthly write-ups, auto-synced and only
 *                    counted in the MC Mindscore once a week has closed.
 * Every read is deterministic and traces back to the trader's own history.
 */
type TherapistTab = "daily" | "premarket" | "commitments" | "reviews";
const TABS: { key: TherapistTab; label: string; short?: string }[] = [
  { key: "daily", label: "Best trades", short: "Best trades" },
  { key: "premarket", label: "Pre-market exercises", short: "Pre-market" },
  { key: "commitments", label: "Commitments" },
  { key: "reviews", label: "Reviews" },
];

/** Glassy, animated segmented toggle — the active pill slides between tabs. */
function GlassToggle({ tab, onChange }: { tab: TherapistTab; onChange: (t: TherapistTab) => void }) {
  return (
    <div
      className="relative hidden w-full sm:w-fit items-center gap-1 rounded-xl border border-border/50 p-1 lg:flex"
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
                  background: "linear-gradient(160deg, var(--primary), color-mix(in oklch, var(--primary) 88%, black) 60%, color-mix(in oklch, var(--primary) 76%, black))",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), 0 6px 18px color-mix(in oklch, var(--primary) 30%, transparent)",
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
        <GlassToggle tab={tab} onChange={setTab} />
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
