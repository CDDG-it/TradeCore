"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { OverlayHud } from "@/components/news-city/OverlayHud";
import { InfoPanel } from "@/components/news-city/InfoPanel";
import { NEWS_CITY_DATA } from "@/lib/news-city/data";
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

export default function NewsCityPage() {
  const [selection, setSelection] = useState<CitySelection | null>(null);

  return (
    <div className="space-y-4">
      <PageHeader
        badge="Market intelligence"
        title="Market Intelligence Hub"
        subtitle="Explore the hub to see what's actually moving markets right now — every source feeds the core, click any node to drill in."
      />

      <PageWrapper className="space-y-4">
        <OverlayHud overview={NEWS_CITY_DATA.overview} />

        <motion.div
          // "Materialise the hologram" entrance.
          initial={{ opacity: 0, scale: 1.04, filter: "blur(8px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3"
        >
          {/* Full-screen stage — fills the viewport down to the bottom edge. */}
          <div
            className="relative w-full overflow-hidden rounded-2xl min-h-[420px] h-[calc(100dvh-13rem)]"
            style={{ background: "#0b1120" }}
          >
            <IntelligenceHub3D data={NEWS_CITY_DATA} selected={selection} onSelect={setSelection} />

            {/* Interaction hint, docked at the bottom of the stage */}
            <p className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-3 font-body text-[11px] text-muted-foreground text-center">
              Drag to look around · scroll to zoom · click a node for details
            </p>
          </div>
        </motion.div>
      </PageWrapper>

      <InfoPanel data={NEWS_CITY_DATA} selection={selection} onSelect={setSelection} onClose={() => setSelection(null)} />
    </div>
  );
}
