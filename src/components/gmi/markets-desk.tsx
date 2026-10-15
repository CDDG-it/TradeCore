"use client";

/**
 * The Global Markets desk: section navigation plus the four sections, sized to
 * the viewport. Shared by the real page and the dev-only preview, which is why
 * the address it writes section changes to is a prop.
 */
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccess } from "@/components/access/access-provider";
import { SectionNav } from "@/components/layout/section-nav";
import { marketsSection, type MarketsSection } from "@/lib/gmi/news-view";

export const loading = () => <div className="flex h-full items-center justify-center" role="status"><span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" /><span className="sr-only">Loading market data.</span></div>;
const NewsTab = dynamic(() => import("@/components/gmi/tabs/news-tab").then((m) => m.NewsTab), { loading });
const CalendarTab = dynamic(() => import("@/components/gmi/tabs/calendar-tab").then((m) => m.CalendarTab), { loading });
const MarketsTab = dynamic(() => import("@/components/gmi/tabs/combined-markets-tab").then((m) => m.CombinedMarketsTab), { loading });
const PositioningTab = dynamic(() => import("@/components/gmi/tabs/flow-options-tab").then((m) => m.FlowOptionsTab), { loading });
const sections: { key: MarketsSection; label: string }[] = [
  { key: "news", label: "News" }, { key: "calendar", label: "Calendar" },
  { key: "markets", label: "Markets" }, { key: "positioning", label: "Positioning" },
];

export function MarketsDesk({ basePath = "/news-city" }: { basePath?: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const { entitlements } = useAccess();
  const section = marketsSection(params.get("tab"), entitlements.globalMarkets === "calendar");
  const rank = { calendar: 0, markets: 1, full: 2 };
  const required = section === "calendar" ? 0 : section === "positioning" ? 2 : 1;
  const locked = rank[entitlements.globalMarkets] < required;

  function selectSection(next: MarketsSection) {
    const query = new URLSearchParams(params.toString());
    query.set("tab", next);
    router.push(`${basePath}?${query}`, { scroll: false });
  }

  const subtitle = section === "news" ? "Only new, market-moving U.S. releases" : section === "calendar" ? "Releases, Fed dates and market holidays" : section === "markets" ? "Futures, yields and rates" : "CFTC positioning";

  // One screen, never a scrolling page: the desk fills the viewport below the
  // app header and each section lays itself out inside it. Phones scroll
  // inside the frame instead, where a fixed screen cannot hold everything.
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-[calc(100dvh-8.5rem)] min-h-[34rem] w-full min-w-0 max-w-full flex-col gap-3 sm:h-[calc(100dvh-9.5rem)] lg:h-[calc(100dvh-7.25rem)]">
        <header className="flex shrink-0 flex-wrap items-end justify-between gap-x-4 gap-y-1">
          <SectionNav
            title="Global Markets"
            titleClassName="font-heading font-bold text-lg md:text-xl text-foreground tracking-tight leading-none"
            items={sections}
            value={section}
            onChange={selectSection}
          />
          <AnimatePresence mode="wait" initial={false}>
            <motion.p key={subtitle} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.16 }} className="text-xs text-muted-foreground">
              {subtitle}
            </motion.p>
          </AnimatePresence>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={section} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }} className="h-full">
              {locked ? <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-border/60 bg-card/50 px-6 py-12 text-center">
                <h2 className="text-lg font-semibold">{section === "positioning" ? "Pro" : "Plus"} includes this view</h2>
                <p className="mt-2 text-sm text-muted-foreground">Your economic calendar remains available.</p>
                <div className="mt-5 flex items-center gap-6">
                  <Link href="/news-city?tab=calendar" className="text-sm font-medium text-primary">Open calendar</Link>
                  <Link href="/pricing" className="text-sm text-muted-foreground underline underline-offset-4">Compare plans</Link>
                </div>
              </div> : section === "news" ? <NewsTab /> : section === "calendar" ? <CalendarTab /> : section === "markets" ? <MarketsTab /> : <PositioningTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  );
}
