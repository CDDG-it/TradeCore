"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { Globe2, Layers, Landmark } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { OverlayHud } from "@/components/news-city/OverlayHud";
import { CotFlow } from "@/components/cot/cot-flow";
import { BondYields } from "@/components/bonds/bond-yields";
import { NEWS_CITY_DATA } from "@/lib/news-city/data";

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

type NewsTab = "map" | "cot" | "bonds";
const TABS: { key: NewsTab; label: string; icon: typeof Globe2 }[] = [
  { key: "map", label: "World Map", icon: Globe2 },
  { key: "cot", label: "COT Flow", icon: Layers },
  { key: "bonds", label: "Bond Yields", icon: Landmark },
];

export default function NewsCityPage() {
  const [tab, setTab] = useState<NewsTab>("map");
  const { theme } = useTheme();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          badge="Market intelligence"
          title="MC News Dashboard"
          subtitle="The world at a glance, how the big money is positioned, and what the bond market is pricing in."
        />
        {/* Tab switch */}
        <div className="flex rounded-lg border border-border/60 overflow-hidden">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-semibold transition-colors",
                tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <PageWrapper className="space-y-4">
        {tab === "map" && (
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
                <WorldMap3D />
                <p className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-3 font-body text-[11px] text-muted-foreground text-center">
                  Drag to spin · scroll to zoom
                </p>
              </div>
            </motion.div>
          </>
        )}

        {tab === "cot" && <CotFlow />}
        {tab === "bonds" && <BondYields />}
      </PageWrapper>
    </div>
  );
}
