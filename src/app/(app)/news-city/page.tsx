"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "motion/react";
import { X, Globe2, Layers } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { OverlayHud } from "@/components/news-city/OverlayHud";
import { CotFlow } from "@/components/cot/cot-flow";
import { NEWS_CITY_DATA } from "@/lib/news-city/data";
import { NEWS_IMPACT_META, NEWS_CATEGORY_META } from "@/lib/news-city/ui";
import { groupNewsByCenter } from "@/lib/news-city/geo";

// WebGL scene — never SSR, only mounted on the World Map tab.
const WorldMap3D = dynamic(
  () => import("@/components/news-city/WorldMap3D").then((m) => m.WorldMap3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <p className="font-body text-sm text-muted-foreground animate-pulse">Spinning up the globe…</p>
      </div>
    ),
  }
);

type NewsTab = "map" | "cot";
const TABS: { key: NewsTab; label: string; icon: typeof Globe2 }[] = [
  { key: "map", label: "World Map", icon: Globe2 },
  { key: "cot", label: "COT Flow", icon: Layers },
];

export default function NewsCityPage() {
  const [tab, setTab] = useState<NewsTab>("map");
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  const { theme } = useTheme();

  const centers = useMemo(() => groupNewsByCenter(NEWS_CITY_DATA.news), []);
  const selected = useMemo(
    () => centers.find((c) => c.center.id === selectedCenter) ?? null,
    [centers, selectedCenter]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          badge="Market intelligence"
          title="MC News Dashboard"
          subtitle="A live map of what's moving markets worldwide — spin the globe to see where, and switch to COT Flow to see how the big money is positioned."
        />
        {/* Tab switch */}
        <div className="flex rounded-lg border border-border/60 overflow-hidden">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-colors",
                tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      <PageWrapper className="space-y-4">
        {tab === "map" ? (
          <>
            <OverlayHud overview={NEWS_CITY_DATA.overview} />

            <motion.div
              initial={{ opacity: 0, scale: 1.03, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                className="relative w-full overflow-hidden rounded-2xl min-h-[440px] h-[calc(100dvh-14rem)]"
                style={{ background: theme === "light" ? "#EEF3F8" : "#0b1120" }}
              >
                <WorldMap3D news={NEWS_CITY_DATA.news} selected={selectedCenter} onSelect={setSelectedCenter} />

                {/* City news panel */}
                <AnimatePresence>
                  {selected && (
                    <motion.div
                      key={selected.center.id}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 24 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute right-3 top-3 bottom-3 z-20 w-[min(360px,calc(100%-1.5rem))] overflow-y-auto rounded-xl border border-border/60 bg-card/95 backdrop-blur-md p-4 shadow-2xl"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Financial centre</p>
                          <h3 className="text-lg font-black tracking-tight leading-none mt-1">{selected.center.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{selected.center.country}</p>
                        </div>
                        <button
                          onClick={() => setSelectedCenter(null)}
                          className="rounded-lg border border-border/60 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                          aria-label="Close"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-3 space-y-2.5">
                        {selected.items.map((item) => {
                          const cat = NEWS_CATEGORY_META[item.category];
                          const imp = NEWS_IMPACT_META[item.impact];
                          return (
                            <div key={item.id} className="rounded-lg border border-border/50 bg-background/40 p-3">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <span
                                  className="inline-block h-2 w-2 rounded-full shrink-0"
                                  style={{ background: cat.hex, boxShadow: `0 0 6px ${cat.hex}` }}
                                />
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{cat.short}</span>
                                <span className={cn("ml-auto rounded-full border px-1.5 py-0.5 text-[9px] font-bold", imp.className)}>
                                  {imp.label}
                                </span>
                              </div>
                              <p className="text-sm font-semibold leading-snug">{item.title}</p>
                              <p className="text-xs text-muted-foreground leading-relaxed mt-1">{item.whatHappened}</p>
                              <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground/70">
                                <span className="font-medium text-muted-foreground/90">{item.source}</span>
                                <span>·</span>
                                <span>{item.time}</span>
                                {item.tickers.length > 0 && (
                                  <>
                                    <span>·</span>
                                    <span className="flex gap-1">
                                      {item.tickers.map((t) => (
                                        <span key={t} className="rounded bg-muted/60 px-1 py-0.5 font-mono text-muted-foreground">{t}</span>
                                      ))}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Hint */}
                <p className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-3 font-body text-[11px] text-muted-foreground text-center">
                  Drag to spin · scroll to zoom · click a glowing city for its news
                </p>
              </div>
            </motion.div>
          </>
        ) : (
          <CotFlow />
        )}
      </PageWrapper>
    </div>
  );
}
