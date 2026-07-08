"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "motion/react";
import { Building2, Landmark, Ship, Zap, TrendingUp, Newspaper, Globe } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { OverlayHud } from "@/components/news-city/OverlayHud";
import { InfoPanel } from "@/components/news-city/InfoPanel";
import { IntelligenceFeed } from "@/components/news-city/IntelligenceFeed";
import { NEWS_CITY_DATA } from "@/lib/news-city/data";
import { cn } from "@/lib/utils";
import type { CitySelection } from "@/components/news-city/selection";

// The scene relies on WebGL / the DOM, so it must never run during SSR and is
// only mounted while the Hub view is active.
const IntelligenceHub3D = dynamic(
  () => import("@/components/news-city/IntelligenceHub3D").then((m) => m.IntelligenceHub3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <p className="font-body text-sm text-muted-foreground animate-pulse">Booting the Intelligence Hub…</p>
      </div>
    ),
  }
);

const LEGEND = [
  { icon: Zap, label: "Macro", hint: "CPI, jobs, GDP" },
  { icon: Landmark, label: "Central Banks", hint: "Fed, ECB, BoJ" },
  { icon: Ship, label: "Commodities", hint: "Oil & gold" },
  { icon: TrendingUp, label: "Earnings", hint: "NVDA, MSFT" },
  { icon: Building2, label: "Nasdaq / ES", hint: "NQ & ES" },
];

type View = "feed" | "hub";

export default function NewsCityPage() {
  const [selection, setSelection] = useState<CitySelection | null>(null);
  const [view, setView] = useState<View>("hub");

  function openInHub(eventId: string) {
    setView("hub");
    setSelection({ kind: "event", id: eventId });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          className="!mb-0"
          badge="Market intelligence"
          title="Market Intelligence Hub"
          subtitle="Scan live intelligence signals, then explore the hub to see what's actually moving markets right now."
        />
        <div className="inline-flex items-center rounded-lg border border-border bg-muted p-[3px] shrink-0">
          {(
            [
              { value: "feed", label: "Live Feed", icon: Newspaper },
              { value: "hub", label: "Intelligence Hub", icon: Globe },
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
              <IntelligenceFeed news={NEWS_CITY_DATA.news} onOpenInHub={openInHub} />
            </motion.div>
          ) : (
            <motion.div
              key="hub"
              // "Materialise the hologram" entrance.
              initial={{ opacity: 0, scale: 1.04, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-3"
            >
              {/* Tall stage that fills down toward the bottom of the screen. */}
              <div
                className="relative w-full overflow-hidden rounded-2xl border border-border h-[clamp(360px,calc(100dvh-350px),780px)]"
                style={{ background: "linear-gradient(180deg, #05070c 0%, #0a0f18 100%)" }}
              >
                <IntelligenceHub3D data={NEWS_CITY_DATA} selected={selection} onSelect={setSelection} />

                {/* Legend + hint, docked at the bottom of the stage */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-3 sm:p-4 space-y-2">
                  <div className="pointer-events-auto flex flex-wrap justify-center gap-2">
                    {LEGEND.map((l) => (
                      <div
                        key={l.label}
                        className="flex items-center gap-2 rounded-full bg-card/90 backdrop-blur-md border border-border px-3 py-1.5"
                      >
                        <l.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-body text-xs font-semibold text-foreground">{l.label}</span>
                        <span className="font-body text-[11px] text-muted-foreground hidden sm:inline">· {l.hint}</span>
                      </div>
                    ))}
                  </div>
                  <p className="font-body text-[11px] text-muted-foreground text-center">
                    Drag to look around · scroll to zoom · click a node for details
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </PageWrapper>

      <InfoPanel data={NEWS_CITY_DATA} selection={selection} onClose={() => setSelection(null)} />
    </div>
  );
}
