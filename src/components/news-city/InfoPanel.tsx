"use client";

import { ArrowUpRight, ArrowDownRight, Minus, Landmark, Ship as ShipIcon, Shield, Building2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DIRECTION_META, TREND_META, SENTIMENT_META } from "@/lib/news-city/ui";
import type { NewsCityData, TrendDirection } from "@/lib/news-city/types";
import type { CitySelection } from "./selection";

function TrendIcon({ direction, className }: { direction: TrendDirection; className?: string }) {
  if (direction === "rising") return <ArrowUpRight className={className} />;
  if (direction === "falling") return <ArrowDownRight className={className} />;
  return <Minus className={className} />;
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/60 last:border-b-0">
      <span className="font-body text-xs text-muted-foreground">{label}</span>
      <span className="font-body text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

export function InfoPanel({
  data,
  selection,
  onClose,
}: {
  data: NewsCityData;
  selection: CitySelection | null;
  onClose: () => void;
}) {
  const open = selection !== null;

  let icon = Building2;
  let title = "";
  let tagline = "";
  let body: React.ReactNode = null;

  if (selection?.kind === "bank") {
    const bank = data.centralBanks.find((b) => b.id === selection.id)!;
    const meta = DIRECTION_META[bank.direction];
    icon = Landmark;
    title = bank.name;
    tagline = "Central Bank District";
    body = (
      <div className="space-y-4">
        <p className="font-body text-sm text-foreground/90 leading-relaxed">{bank.headline}</p>
        <Badge variant="outline" className={cn("border", meta.className)}>
          {meta.label} stance
        </Badge>
        <div>
          <StatRow label="Policy rate" value={bank.rate} />
          <StatRow label="Market expectation" value={bank.rateExpectation} />
          <StatRow label="Last updated" value={bank.lastUpdated} />
        </div>
        <div className="rounded-xl bg-muted/40 p-3">
          <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Impact on ES / NQ
          </p>
          <p className="font-body text-sm text-foreground/90 leading-relaxed">{bank.impact}</p>
        </div>
      </div>
    );
  } else if (selection?.kind === "commodity") {
    const c = data.commodities.find((x) => x.id === selection.id)!;
    const meta = TREND_META[c.direction];
    icon = ShipIcon;
    title = c.name;
    tagline = "Commodity Harbor";
    body = (
      <div className="space-y-4">
        <p className="font-body text-sm text-foreground/90 leading-relaxed">{c.headline}</p>
        <Badge variant="outline" className={cn("border gap-1", meta.className)}>
          <TrendIcon direction={c.direction} className="w-3 h-3" />
          {meta.label}
        </Badge>
        <div>
          <StatRow label="Price" value={c.price} />
          <StatRow label="Change" value={c.change} />
          <StatRow label="Supply risk" value={c.supplyRisk} />
        </div>
        <div className="rounded-xl bg-muted/40 p-3">
          <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Geopolitical impact
          </p>
          <p className="font-body text-sm text-foreground/90 leading-relaxed">{c.geopoliticalImpact}</p>
        </div>
      </div>
    );
  } else if (selection?.kind === "macro") {
    const f = data.macroForces.find((x) => x.id === selection.id)!;
    const meta = TREND_META[f.direction];
    icon = Shield;
    title = `${f.name} Tank`;
    tagline = "Macro Battlefield";
    body = (
      <div className="space-y-4">
        <p className="font-body text-sm text-foreground/90 leading-relaxed">{f.headline}</p>
        <Badge variant="outline" className={cn("border gap-1", meta.className)}>
          <TrendIcon direction={f.direction} className="w-3 h-3" />
          {meta.label}
        </Badge>
        <div>
          <StatRow label={f.metricLabel} value={f.metric} />
        </div>
        <div className="rounded-xl bg-muted/40 p-3">
          <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Market impact
          </p>
          <p className="font-body text-sm text-foreground/90 leading-relaxed">{f.impact}</p>
        </div>
      </div>
    );
  } else if (selection?.kind === "hq") {
    const hq = data.marketHQ;
    const meta = SENTIMENT_META[hq.sentiment];
    icon = Building2;
    title = "Nasdaq / ES Headquarters";
    tagline = "The main trading building";
    body = (
      <div className="space-y-4">
        <Badge variant="outline" className={cn("border", meta.className)}>
          Market regime: {hq.regime}
        </Badge>
        <div>
          {hq.indices.map((idx) => (
            <StatRow key={idx.id} label={idx.name} value={`${idx.price}  (${idx.change})`} />
          ))}
        </div>
        <div className="rounded-xl bg-muted/40 p-3">
          <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Main drivers
          </p>
          <ul className="space-y-1.5">
            {hq.drivers.map((d) => (
              <li key={d} className="font-body text-sm text-foreground/90 flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-primary shrink-0" />
                {d}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  const Icon = icon;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {tagline}
              </p>
              <DialogTitle className="font-heading text-lg">{title}</DialogTitle>
            </div>
          </div>
          <DialogDescription className="sr-only">Details for {title}</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
