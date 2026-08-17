"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { CotFlow } from "@/components/cot/cot-flow";
import { BondYields } from "@/components/bonds/bond-yields";

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

type NewsTab = "map" | "flow";
const TABS: { key: NewsTab; label: string }[] = [
  { key: "map", label: "World Map" },
  { key: "flow", label: "Rates & Positioning" },
];

/** Sub-sections of the combined rates/positioning tab. */
type FlowSection = "bonds" | "cot";
const FLOW_SECTIONS: { key: FlowSection; label: string }[] = [
  { key: "bonds", label: "Bond Yields" },
  { key: "cot", label: "COT Flow" },
];

export default function NewsCityPage() {
  const [tab, setTab] = useState<NewsTab>("map");
  const [section, setSection] = useState<FlowSection>("bonds");
  const { theme } = useTheme();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          badge="Market intelligence"
          title="MC News Dashboard"
          subtitle="The world at a glance, what the bond market is pricing in, and how the big money is positioned."
        />
        <div className="flex rounded-lg border border-border/60 overflow-hidden">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "px-4 py-2 text-sm font-semibold transition-colors",
                tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <PageWrapper className="space-y-4">
        {tab === "map" && (
          <motion.div
            initial={{ opacity: 0, scale: 1.03, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="relative w-full overflow-hidden rounded-2xl min-h-[460px] h-[calc(100dvh-11rem)]"
              style={{ background: theme === "light" ? "#EEF3F8" : "#0b1120" }}
            >
              <WorldMap3D />
              <p className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-3 font-body text-[11px] text-muted-foreground text-center">
                Drag to spin · scroll to zoom
              </p>
            </div>
          </motion.div>
        )}

        {tab === "flow" && (
          <div className="space-y-4">
            {/* Rates and positioning live together: yields set the discount rate,
                COT shows who is leaning which way against it. */}
            <div className="flex rounded-lg border border-border/60 overflow-hidden w-fit">
              {FLOW_SECTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSection(key)}
                  className={cn(
                    "px-3.5 py-1.5 text-xs font-semibold transition-colors",
                    section === key ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {section === "bonds" ? <BondYields /> : <CotFlow />}
          </div>
        )}
      </PageWrapper>
    </div>
  );
}
