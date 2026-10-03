"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAccess } from "@/components/access/access-provider";
import { marketsSection, type MarketsSection } from "@/lib/gmi/news-view";

const loading = () => <p className="py-12 text-sm text-muted-foreground" role="status">Loading market data.</p>;
const NewsTab = dynamic(() => import("@/components/gmi/tabs/news-tab").then((m) => m.NewsTab), { loading });
const CalendarTab = dynamic(() => import("@/components/gmi/tabs/calendar-tab").then((m) => m.CalendarTab), { loading });
const MarketsTab = dynamic(() => import("@/components/gmi/tabs/combined-markets-tab").then((m) => m.CombinedMarketsTab), { loading });
const PositioningTab = dynamic(() => import("@/components/gmi/tabs/flow-options-tab").then((m) => m.FlowOptionsTab), { loading });
const sections: { key: MarketsSection; label: string }[] = [
  { key: "news", label: "News" }, { key: "calendar", label: "Calendar" },
  { key: "markets", label: "Markets" }, { key: "positioning", label: "Positioning" },
];

function MarketsDesk() {
  const params = useSearchParams();
  const { entitlements } = useAccess();
  const section = marketsSection(params.get("tab"), entitlements.globalMarkets === "calendar");
  const rank = { calendar: 0, markets: 1, full: 2 };
  const required = section === "calendar" ? 0 : section === "positioning" ? 2 : 1;
  const locked = rank[entitlements.globalMarkets] < required;
  const detail = section === "markets" || section === "positioning";

  return (
    <div className="w-full min-w-0 max-w-full">
      <header className="mb-6 border-b border-border/60">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 pb-5">
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-[28px]">Global Markets</h1>
          <p className="text-sm text-muted-foreground">{section === "news" ? "U.S. macro and energy releases" : section === "calendar" ? "Economic releases and market holidays" : section === "markets" ? "Futures, yields and rates" : "CFTC positioning"}</p>
        </div>
        <nav aria-label="Global Markets sections" className="flex gap-5 sm:gap-8">
          {sections.map((item) => {
            const query = new URLSearchParams(params.toString()); query.set("tab", item.key);
            return <Link key={item.key} href={`/news-city?${query}`} scroll={false} aria-current={section === item.key ? "page" : undefined}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${section === item.key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{item.label}</Link>;
          })}
        </nav>
      </header>
      {locked ? <div className="rounded-xl border border-border/60 px-6 py-12 text-center">
        <h2 className="text-lg font-semibold">{section === "positioning" ? "Pro" : "Plus"} includes this view</h2>
        <p className="mt-2 text-sm text-muted-foreground">Your economic calendar remains available.</p>
        <Link href="/news-city?tab=calendar" className="mt-5 inline-block text-sm font-medium text-primary">Open calendar</Link>
        <Link href="/pricing" className="ml-6 text-sm text-muted-foreground underline underline-offset-4">Compare plans</Link>
      </div> : <div className={detail ? "lg:h-[calc(100dvh-16rem)] lg:min-h-[560px]" : "news-desk"}>
        {section === "news" ? <NewsTab /> : section === "calendar" ? <CalendarTab /> : section === "markets" ? <MarketsTab /> : <PositioningTab />}
      </div>}
    </div>
  );
}

export default function GlobalMarketsPage() {
  return <Suspense fallback={loading()}><MarketsDesk /></Suspense>;
}
