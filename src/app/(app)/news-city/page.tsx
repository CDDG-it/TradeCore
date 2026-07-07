"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Building2, Landmark, Ship, Zap, Activity } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { OverlayHud } from "@/components/news-city/OverlayHud";
import { InfoPanel } from "@/components/news-city/InfoPanel";
import { NEWS_CITY_DATA } from "@/lib/news-city/data";
import type { CitySelection } from "@/components/news-city/selection";

// The scene relies on WebGL / the DOM, so it must never run during SSR.
const City3D = dynamic(() => import("@/components/news-city/City3D").then((m) => m.City3D), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <p className="font-body text-sm text-muted-foreground animate-pulse">Loading the city...</p>
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

export default function NewsCityPage() {
  const [selection, setSelection] = useState<CitySelection | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        badge="MC News City"
        title="MC News City"
        subtitle="A living map of the global market. Data flows from central banks, commodities, and macro forces into the Market Core, and out to the exchange. Click anything for the full story."
      />

      <PageWrapper>
        <OverlayHud overview={NEWS_CITY_DATA.overview} />

        <div
          className="relative w-full overflow-hidden rounded-2xl border border-border h-[420px] sm:h-[540px] lg:h-[620px]"
          style={{ background: "linear-gradient(180deg, #10141c 0%, #0b0f16 100%)" }}
        >
          <City3D data={NEWS_CITY_DATA} selected={selection} onSelect={setSelection} />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-3 sm:p-4">
            <div className="pointer-events-auto flex flex-wrap gap-2">
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
          </div>
        </div>

        <p className="font-body text-xs text-muted-foreground text-center">
          Drag to rotate, scroll to zoom. Mock data for now — live news, economic calendar, and AI summaries plug in here next.
        </p>
      </PageWrapper>

      <InfoPanel data={NEWS_CITY_DATA} selection={selection} onClose={() => setSelection(null)} />
    </div>
  );
}
