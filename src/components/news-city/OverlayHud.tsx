"use client";

import { Gauge, TrendingUp, Newspaper, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { RISK_META, SENTIMENT_META } from "@/lib/news-city/ui";
import type { CityOverview } from "@/lib/news-city/types";

function HudStat({
  icon: Icon,
  label,
  value,
  valueClassName,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-card/90 backdrop-blur-md border border-border px-3.5 py-2.5 min-w-0">
      <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="font-body text-[9px] font-semibold uppercase tracking-wider text-muted-foreground leading-none mb-1">
          {label}
        </p>
        <p className={cn("font-body text-xs font-semibold text-foreground leading-tight truncate", valueClassName)}>
          {value}
        </p>
      </div>
    </div>
  );
}

/** Renders in normal document flow, directly above the city viewport — not
 *  overlaid on the canvas, so it never covers the tallest buildings. */
export function OverlayHud({ overview }: { overview: CityOverview }) {
  const risk = RISK_META[overview.riskLevel];
  const sentiment = SENTIMENT_META[overview.sentiment];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
      <HudStat icon={Gauge} label="Market risk level" value={risk.label} valueClassName={risk.className.split(" ")[0]} />
      <HudStat icon={TrendingUp} label="Main driver" value={overview.mainDriver} />
      <HudStat icon={Newspaper} label="Latest event" value={overview.latestEvent} />
      <HudStat icon={Activity} label="Sentiment" value={sentiment.label} valueClassName={sentiment.className.split(" ")[0]} />
    </div>
  );
}
