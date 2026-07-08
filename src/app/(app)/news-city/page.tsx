"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "motion/react";
import { Building2, Landmark, Ship, Zap, Activity, Newspaper, Globe } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { OverlayHud } from "@/components/news-city/OverlayHud";
import { InfoPanel } from "@/components/news-city/InfoPanel";
import { NewsFeed } from "@/components/news-city/NewsFeed";
import { NEWS_CITY_DATA } from "@/lib/news-city/data";
import { cn } from "@/lib/utils";
import type { CitySelection } from "@/components/news-city/selection";
import type { NewsLink } from "@/lib/news-city/types";

// The scene relies on WebGL / the DOM, so it must never run during SSR and is
// only mounted while the City view is active.
const City3D = dynamic(() => import("@/components/news-city/City3D").then((m) => m.City3D), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <p className="font-body text-sm text-muted-foreground animate-pulse">Entering Market City…</p>
    </div>
  ),
});

const LEGEND = [
  { icon: Activity, label: "Market Core", hint: "Sentiment & risk hub" },
  { icon: Landmark, label: "Central Bank District", hint: "Fed, ECB, BoJ policy" },
  { icon: Ship, label: "Commodity Harbor", hint: "Oil & gold" },
  { icon: Zap, label: "Macro Intelligence", hint: "Inflation, jobs, growth" },
  { icon: Building2, label: "Nasdaq / ES HQ", hint: "Index sentiment" },
];

type View = "feed" | "city";

export default function NewsCityPage() {
  const [selection, setSelection] = useState<CitySelection | null>(null);
  const [view, setView] = useState<View>("city");

  function openInCity(link: NewsLink) {
    setView("city");
    setSelection(link as CitySelection);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          className="!mb-0"
          badge="Market intelligence"
          title="MC News Dashboard"
          subtitle="Scan the live market feed, then step into Market City to explore the forces behind every headline."
        />
        <div className="inline-flex items-center rounded-lg border border-border bg-muted p-[3px] shrink-0">
          {(
            [
              { value: "feed", label: "Live Feed", icon: Newspaper },
              { value: "city", label: "Market City", icon: Globe },
            ] as const
          ).map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setView(t.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                view === t.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <PageWrapper className="space-y-4">
        <OverlayHud overview={NEWS_CITY_DATA.overview} />

        <AnimatePresence mode="wait">
          {view === "feed" ? (
            <motion.div
              key="feed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <NewsFeed news={NEWS_CITY_DATA.news} onOpenInCity={openInCity} />
            </motion.div>
          ) : (
            <motion.div
              key="city"
              // "Materialise into the city" entrance.
              initial={{ opacity: 0, scale: 1.04, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-3"
            >
              {/* Height tracks the viewport so the page fits without scrolling. */}
              <div
                className="relative w-full overflow-hidden rounded-2xl border border-border h-[clamp(320px,calc(100dvh-430px),580px)]"
                style={{ background: "linear-gradient(180deg, #202a3c 0%, #1a2333 100%)" }}
              >
                <City3D data={NEWS_CITY_DATA} selected={selection} onSelect={setSelection} />
              </div>

              {/* Legend, below the scene */}
              <div className="flex flex-wrap justify-center gap-2">
                {LEGEND.map((l) => (
                  <div
                    key={l.label}
                    className="flex items-center gap-2 rounded-full bg-card border border-border px-3 py-1.5"
                  >
                    <l.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="font-body text-xs font-semibold text-foreground">{l.label}</span>
                    <span className="font-body text-[11px] text-muted-foreground hidden sm:inline">· {l.hint}</span>
                  </div>
                ))}
              </div>

              <p className="font-body text-xs text-muted-foreground text-center">
                Drag to rotate, scroll to zoom. Mock data for now — live news, economic calendar, and AI summaries plug in here next.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </PageWrapper>

      <InfoPanel data={NEWS_CITY_DATA} selection={selection} onClose={() => setSelection(null)} />
    </div>
  );
}
