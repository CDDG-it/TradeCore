"use client";

/**
 * Global Markets Intelligence — one page, nine subtabs, for objective market
 * research. A persistent ticker header and sub-nav stay fixed while the active
 * subtab swaps beneath them. Every dataset is provider-labelled with its
 * freshness; nothing here interprets, recommends or predicts.
 *
 * (Route kept as /news-city to preserve existing links; the page is retitled.)
 */
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGmi } from "@/lib/gmi/client";
import type { Quote } from "@/lib/gmi/types";
import { TickerHeader } from "@/components/gmi/ticker-header";

type Tab =
  | "overview" | "world" | "futures" | "macro" | "news"
  | "earnings" | "flow" | "calendar" | "reactions";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "world", label: "World" },
  { key: "futures", label: "Futures" },
  { key: "macro", label: "Macro" },
  { key: "news", label: "News" },
  { key: "earnings", label: "Earnings" },
  { key: "flow", label: "Flow & Options" },
  { key: "calendar", label: "Calendar" },
  { key: "reactions", label: "Reactions" },
];

const tabLoading = () => (
  <div className="flex h-64 items-center justify-center">
    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
  </div>
);

// Code-split each subtab so the initial load stays light (three.js / recharts
// only arrive with the tab that needs them).
const OverviewTab = dynamic(() => import("@/components/gmi/tabs/overview-tab").then((m) => m.OverviewTab), { loading: tabLoading });
const WorldTab = dynamic(() => import("@/components/gmi/tabs/world-tab").then((m) => m.WorldTab), { loading: tabLoading });
const FuturesTab = dynamic(() => import("@/components/gmi/tabs/futures-tab").then((m) => m.FuturesTab), { loading: tabLoading });
const MacroTab = dynamic(() => import("@/components/gmi/tabs/macro-tab").then((m) => m.MacroTab), { loading: tabLoading });
const NewsTab = dynamic(() => import("@/components/gmi/tabs/news-tab").then((m) => m.NewsTab), { loading: tabLoading });
const EarningsTab = dynamic(() => import("@/components/gmi/tabs/earnings-tab").then((m) => m.EarningsTab), { loading: tabLoading });
const FlowOptionsTab = dynamic(() => import("@/components/gmi/tabs/flow-options-tab").then((m) => m.FlowOptionsTab), { loading: tabLoading });
const CalendarTab = dynamic(() => import("@/components/gmi/tabs/calendar-tab").then((m) => m.CalendarTab), { loading: tabLoading });
const ReactionsTab = dynamic(() => import("@/components/gmi/tabs/reactions-tab").then((m) => m.ReactionsTab), { loading: tabLoading });

export default function GlobalMarketsPage() {
  const [tab, setTab] = useState<Tab>("overview");
  // Shared quotes feed — one poll powers the ticker, pulse, futures, FX and world.
  const { env: quotesEnv } = useGmi<Quote[]>("/api/gmi/quotes", 30_000);

  const content = useMemo(() => {
    switch (tab) {
      case "overview": return <OverviewTab quotesEnv={quotesEnv} />;
      case "world": return <WorldTab quotesEnv={quotesEnv} />;
      case "futures": return <FuturesTab quotesEnv={quotesEnv} />;
      case "macro": return <MacroTab quotesEnv={quotesEnv} />;
      case "news": return <NewsTab />;
      case "earnings": return <EarningsTab />;
      case "flow": return <FlowOptionsTab />;
      case "calendar": return <CalendarTab />;
      case "reactions": return <ReactionsTab />;
    }
  }, [tab, quotesEnv]);

  return (
    <div className="space-y-4">
      {/* Persistent header: title, ticker strip and sub-nav stay put while tabs swap. */}
      <div className="sticky top-0 z-20 -mx-4 space-y-3 bg-background/80 px-4 pb-2 pt-1 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-heading text-lg font-bold uppercase tracking-tight text-foreground md:text-xl">
            Global Markets
          </h1>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Objective research · no signals</span>
        </div>

        <TickerHeader env={quotesEnv} />

        <nav className="flex gap-1 overflow-x-auto scrollbar-none">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                tab === key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-h-[50vh]">{content}</div>
    </div>
  );
}
