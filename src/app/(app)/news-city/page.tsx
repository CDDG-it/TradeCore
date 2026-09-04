"use client";

/**
 * Global Markets Intelligence — one page, focused subtabs, for objective market
 * research. The title block and the sub-nav stay pinned while the active subtab
 * swaps beneath them. Every dataset is provider-labelled with its freshness;
 * nothing here interprets, recommends or predicts, and no panel claims a price
 * is live when the provider only offers delayed data.
 *
 * (Route kept as /news-city to preserve existing links; the page is retitled.)
 */
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import {
  Loader2, Activity, Globe2, CandlestickChart, Newspaper, CalendarDays, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "overview" | "markets" | "futures" | "news" | "calendar" | "flow";

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "overview", label: "Overview", icon: Activity },
  { key: "markets", label: "Markets", icon: Globe2 },
  { key: "futures", label: "Futures", icon: CandlestickChart },
  { key: "news", label: "News", icon: Newspaper },
  { key: "calendar", label: "Calendar", icon: CalendarDays },
  { key: "flow", label: "Positioning", icon: Layers },
];

/** Old ?tab= values that should still land somewhere sensible, from when Option
 *  Flow was briefly its own subtab. */
const TAB_ALIASES: Record<string, Tab> = { "option-flow": "flow", options: "flow" };

const tabLoading = () => (
  <div className="flex h-64 items-center justify-center">
    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
  </div>
);

// Code-split each subtab so the initial load stays light (three.js / recharts
// only arrive with the tab that needs them).
const OverviewTab = dynamic(() => import("@/components/gmi/tabs/overview-tab").then((m) => m.OverviewTab), { loading: tabLoading });
const MarketsTab = dynamic(() => import("@/components/gmi/tabs/markets-tab").then((m) => m.MarketsTab), { loading: tabLoading });
const FuturesTab = dynamic(() => import("@/components/gmi/tabs/futures-tab").then((m) => m.FuturesTab), { loading: tabLoading });
const NewsTab = dynamic(() => import("@/components/gmi/tabs/news-tab").then((m) => m.NewsTab), { loading: tabLoading });
const CalendarTab = dynamic(() => import("@/components/gmi/tabs/calendar-tab").then((m) => m.CalendarTab), { loading: tabLoading });
const FlowOptionsTab = dynamic(() => import("@/components/gmi/tabs/flow-options-tab").then((m) => m.FlowOptionsTab), { loading: tabLoading });

export default function GlobalMarketsPage() {
  const [tab, setTab] = useState<Tab>("overview");

  // Deep-linking, e.g. the /option-flow route redirects in here. Read after
  // mount rather than during render: the page is prerendered, so seeding state
  // from the URL up front would make the server and client markup disagree.
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("tab");
    if (!raw) return;
    const t = TAB_ALIASES[raw] ?? raw;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot sync from the URL, not a render loop
    if (TABS.some((x) => x.key === t)) setTab(t as Tab);
  }, []);

  const content = useMemo(() => {
    switch (tab) {
      case "overview": return <OverviewTab />;
      case "markets": return <MarketsTab />;
      case "futures": return <FuturesTab />;
      case "news": return <NewsTab />;
      case "calendar": return <CalendarTab />;
      case "flow": return <FlowOptionsTab />;
    }
  }, [tab]);

  return (
    <div className="space-y-5">
      {/* Pinned desk header: title, live tape and sub-nav stay put while tabs swap. */}
      <div className="sticky top-0 z-20 -mx-4 space-y-3 border-b border-border/40 bg-background/85 px-4 pb-2.5 pt-1 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65 sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary/70">
              Objective research · no signals
            </p>
            <h1 className="font-heading text-lg font-bold uppercase tracking-tight text-foreground md:text-xl">
              Global Markets
            </h1>
          </div>
          <p className="max-w-sm text-[10px] leading-relaxed text-muted-foreground/60">
            Every dataset carries its provider and capture time. Nothing here is realtime, and nothing is a signal.
          </p>
        </div>

        <nav className="scrollbar-none flex gap-1 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "relative shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  active ? "text-primary-foreground" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="gmi-tab"
                    className="absolute inset-0 rounded-lg bg-primary"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative inline-flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="min-h-[50vh]"
      >
        {content}
      </motion.div>
    </div>
  );
}
