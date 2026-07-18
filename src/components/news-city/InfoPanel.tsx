"use client";

import { useState } from "react";
import {
  ArrowUpRight, ArrowDownRight, Minus, Landmark, Ship, Zap, Building2, Activity, ChevronDown,
  ChevronLeft, Radio, ChevronRight,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DIRECTION_META, TREND_META, SENTIMENT_META, RISK_META, NEWS_CATEGORY_META, NEWS_IMPACT_META, SIGNAL_TAG_META } from "@/lib/news-city/ui";
import type { NewsCityData, TrendDirection, NewsCategory, NewsItem } from "@/lib/news-city/types";
import type { CitySelection } from "./selection";

/** The category-node signals live under one label in the hub, but a couple of
 *  feed categories fold into that same node (e.g. geopolitics reads as a
 *  commodity-supply story). This maps a node to every feed category it owns. */
const NODE_FEED_CATEGORIES: Record<NewsCategory, NewsCategory[]> = {
  "central-bank": ["central-bank"],
  commodity: ["commodity", "geopolitics"],
  macro: ["macro"],
  markets: ["markets"],
  earnings: ["earnings"],
  geopolitics: ["geopolitics"],
};

function DirectionArrow({ direction, className }: { direction: NewsItem["direction"]; className?: string }) {
  if (direction === "up") return <ArrowUpRight className={className} />;
  if (direction === "down") return <ArrowDownRight className={className} />;
  return <Minus className={className} />;
}

/** The "Latest signals" list shown under every category node — repurposes the
 *  old live-feed items as sub-messages, each opening its own detail view. */
function SignalList({ items, onOpen }: { items: NewsItem[]; onOpen: (id: string) => void }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center gap-1.5">
        <Radio className="w-3.5 h-3.5 text-primary" />
        <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Latest signals · {items.length}
        </p>
      </div>
      <div className="space-y-1.5">
        {items.map((n) => {
          const tagMeta = SIGNAL_TAG_META[n.tag];
          const dirColor = n.direction === "up" ? "text-success" : n.direction === "down" ? "text-destructive" : "text-warning";
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => onOpen(n.id)}
              className="w-full flex items-center gap-2.5 rounded-xl border border-border p-2.5 text-left hover:bg-muted/40 hover:border-primary/30 transition-colors"
            >
              <span className={cn("shrink-0", dirColor)}>
                <DirectionArrow direction={n.direction} className="w-4 h-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-body text-sm font-semibold text-foreground truncate">{n.title}</p>
                <p className="font-body text-xs text-muted-foreground truncate">
                  <span className={cn("font-semibold", tagMeta.className.split(" ")[0])}>[{tagMeta.label}]</span>
                  {" · "}{n.marketImpact}{" · "}{n.time}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

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

/** A single expandable row inside a category panel — collapsed shows a
 *  one-line summary, expanded reveals the full detail for that sub-entity. */
function ExpandableRow({
  id,
  title,
  subtitle,
  badge,
  expanded,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div key={id} className="rounded-xl border border-border overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 p-3 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="min-w-0">
          <p className="font-body text-sm font-semibold text-foreground truncate">{title}</p>
          <p className="font-body text-xs text-muted-foreground truncate">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {badge}
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
        </div>
      </button>
      {expanded && <div className="p-3 pt-0 space-y-3">{children}</div>}
    </div>
  );
}

export function InfoPanel({
  data,
  selection,
  onSelect,
  onClose,
}: {
  data: NewsCityData;
  selection: CitySelection | null;
  onSelect: (sel: CitySelection) => void;
  onClose: () => void;
}) {
  const open = selection !== null;
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Which category an event belongs to — so the event view can offer a "back to
  // the node" affordance.
  const eventItem = selection?.kind === "event" ? data.news.find((n) => n.id === selection.id) : null;

  /** Opens a signal's detail view from a category's signal list. */
  const openSignal = (id: string) => {
    setExpandedRow(null);
    onSelect({ kind: "event", id });
  };

  let icon = Building2;
  let title = "";
  let tagline = "";
  let body: React.ReactNode = null;
  let backTo: { label: string; sel: CitySelection } | null = null;

  if (selection?.kind === "core") {
    const o = data.overview;
    const meta = SENTIMENT_META[o.sentiment];
    const risk = RISK_META[o.riskLevel];
    icon = Activity;
    title = "Market Intelligence Core";
    tagline = "The brain of the hub";
    body = (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={cn("border", meta.className)}>
            Sentiment: {meta.label}
          </Badge>
          <Badge variant="outline" className={cn("border", risk.className)}>
            Risk: {risk.label}
          </Badge>
        </div>
        <div>
          <StatRow label="Volatility" value={o.volatility} />
        </div>
        <div className="rounded-xl bg-muted/40 p-3">
          <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Main driver
          </p>
          <p className="font-body text-sm text-foreground/90 leading-relaxed">{o.mainDriver}</p>
        </div>
        <div className="rounded-xl bg-muted/40 p-3">
          <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Latest event
          </p>
          <p className="font-body text-sm text-foreground/90 leading-relaxed">{o.latestEvent}</p>
        </div>
      </div>
    );
  } else if (selection?.kind === "category") {
    const cat = selection.id;
    const catMeta = NEWS_CATEGORY_META[cat];
    tagline = "Category node";
    title = catMeta.label;

    if (cat === "central-bank") {
      icon = Landmark;
      body = (
        <div className="space-y-2">
          {data.centralBanks.map((bank) => {
            const meta = DIRECTION_META[bank.direction];
            const rowId = `bank:${bank.id}`;
            const expanded = expandedRow === rowId;
            return (
              <ExpandableRow
                key={rowId}
                id={rowId}
                title={bank.name}
                subtitle={`${bank.rate} · ${meta.label}`}
                badge={<Badge variant="outline" className={cn("border", meta.className)}>{meta.label}</Badge>}
                expanded={expanded}
                onToggle={() => setExpandedRow(expanded ? null : rowId)}
              >
                <p className="font-body text-sm text-foreground/90 leading-relaxed">{bank.headline}</p>
                <div className="flex flex-wrap gap-2">
                  {bank.impacts.map((im) => (
                    <Badge
                      key={im.label}
                      variant="outline"
                      className={cn(
                        "border gap-1",
                        im.direction === "up"
                          ? "text-success bg-success/10 border-success/30"
                          : "text-destructive bg-destructive/10 border-destructive/30"
                      )}
                    >
                      {im.label}
                      {im.direction === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    </Badge>
                  ))}
                </div>
                <div>
                  <StatRow label="Liquidity" value={bank.liquidity} />
                  <StatRow label="Market expectation" value={bank.rateExpectation} />
                  <StatRow label="Last updated" value={bank.lastUpdated} />
                </div>
                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Impact on ES / NQ
                  </p>
                  <p className="font-body text-sm text-foreground/90 leading-relaxed">{bank.impact}</p>
                </div>
              </ExpandableRow>
            );
          })}
        </div>
      );
    } else if (cat === "commodity") {
      icon = Ship;
      body = (
        <div className="space-y-2">
          {data.commodities.map((c) => {
            const meta = TREND_META[c.direction];
            const rowId = `commodity:${c.id}`;
            const expanded = expandedRow === rowId;
            return (
              <ExpandableRow
                key={rowId}
                id={rowId}
                title={c.name}
                subtitle={`${c.price} · ${meta.label}`}
                badge={
                  <Badge variant="outline" className={cn("border gap-1", meta.className)}>
                    <TrendIcon direction={c.direction} className="w-3 h-3" />
                    {meta.label}
                  </Badge>
                }
                expanded={expanded}
                onToggle={() => setExpandedRow(expanded ? null : rowId)}
              >
                <p className="font-body text-sm text-foreground/90 leading-relaxed">{c.headline}</p>
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
              </ExpandableRow>
            );
          })}
        </div>
      );
    } else if (cat === "macro") {
      icon = Zap;
      body = (
        <div className="space-y-2">
          {data.macroForces.map((f) => {
            const meta = TREND_META[f.direction];
            const rowId = `macro:${f.id}`;
            const expanded = expandedRow === rowId;
            return (
              <ExpandableRow
                key={rowId}
                id={rowId}
                title={`${f.name} Engine`}
                subtitle={`${f.metric} · ${f.level}`}
                badge={
                  <Badge variant="outline" className={cn("border gap-1", meta.className)}>
                    <TrendIcon direction={f.direction} className="w-3 h-3" />
                    {meta.label}
                  </Badge>
                }
                expanded={expanded}
                onToggle={() => setExpandedRow(expanded ? null : rowId)}
              >
                <p className="font-body text-sm text-foreground/90 leading-relaxed">{f.headline}</p>
                <div>
                  <StatRow label={f.metricLabel} value={f.metric} />
                  <StatRow label="Force strength" value={f.level} />
                </div>
                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Market impact
                  </p>
                  <p className="font-body text-sm text-foreground/90 leading-relaxed">{f.impact}</p>
                </div>
              </ExpandableRow>
            );
          })}
        </div>
      );
    } else if (cat === "earnings") {
      icon = Building2;
      body = (
        <div className="space-y-2">
          {data.earnings.map((e) => {
            const meta = TREND_META[e.direction];
            const rowId = `earnings:${e.id}`;
            const expanded = expandedRow === rowId;
            return (
              <ExpandableRow
                key={rowId}
                id={rowId}
                title={`${e.company} (${e.ticker})`}
                subtitle={e.surprise}
                badge={
                  <Badge variant="outline" className={cn("border gap-1", meta.className)}>
                    <TrendIcon direction={e.direction} className="w-3 h-3" />
                    {meta.label}
                  </Badge>
                }
                expanded={expanded}
                onToggle={() => setExpandedRow(expanded ? null : rowId)}
              >
                <p className="font-body text-sm text-foreground/90 leading-relaxed">{e.headline}</p>
                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Market impact
                  </p>
                  <p className="font-body text-sm text-foreground/90 leading-relaxed">{e.impact}</p>
                </div>
              </ExpandableRow>
            );
          })}
        </div>
      );
    } else if (cat === "markets") {
      const hq = data.marketHQ;
      const meta = SENTIMENT_META[hq.sentiment];
      icon = Building2;
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

    // Every category node carries its own live signals as sub-messages —
    // repurposing the old feed so each node is a drill-in of its own right.
    const feedCats = NODE_FEED_CATEGORIES[cat] ?? [cat];
    const signals = data.news.filter((n) => feedCats.includes(n.category));
    body = (
      <div className="space-y-4">
        {body}
        <SignalList items={signals} onOpen={openSignal} />
      </div>
    );
  } else if (selection?.kind === "event") {
    const item = eventItem;
    if (item) {
      const catMeta = NEWS_CATEGORY_META[item.category as NewsCategory];
      const impMeta = NEWS_IMPACT_META[item.impact];
      const tagMeta = SIGNAL_TAG_META[item.tag];
      icon = Activity;
      title = item.title;
      tagline = catMeta.label;
      // Offer a route back to the node this signal belongs to (only for the
      // five categories that have a node in the hub — geopolitics folds into
      // the commodity node).
      const backCat: NewsCategory = item.category === "geopolitics" ? "commodity" : item.category;
      if (NEWS_CATEGORY_META[backCat]) {
        backTo = { label: NEWS_CATEGORY_META[backCat].label, sel: { kind: "category", id: backCat } };
      }
      body = (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn("border font-mono", tagMeta.className)}>
              [{tagMeta.label}]
            </Badge>
            <Badge variant="outline" className={cn("border", impMeta.className)}>
              {impMeta.label}
            </Badge>
            <span className="font-body text-xs text-muted-foreground ml-auto">{item.time} · {item.source}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-muted/40 p-3">
              <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Market impact
              </p>
              <p className="font-body text-sm font-semibold text-foreground">{item.marketImpact}</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-3">
              <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Confidence
              </p>
              <p className="font-body text-sm font-semibold text-foreground">{item.confidence}%</p>
            </div>
          </div>

          <div>
            <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              What happened
            </p>
            <p className="font-body text-sm text-foreground/90 leading-relaxed">{item.whatHappened}</p>
          </div>
          <div>
            <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Why it matters
            </p>
            <p className="font-body text-sm text-foreground/90 leading-relaxed">{item.whyItMatters}</p>
          </div>
          <div>
            <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Markets affected
            </p>
            <div className="flex flex-wrap gap-1.5">
              {item.affectedAssets.map((a) => (
                <span key={a} className="font-body text-xs font-semibold rounded-full px-2.5 py-1 bg-muted/60 text-foreground">
                  {a}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Historical context
            </p>
            <p className="font-body text-sm text-foreground/90 leading-relaxed">{item.historicalContext}</p>
          </div>
        </div>
      );
    }
  }

  const Icon = icon;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setExpandedRow(null);
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          {backTo && (
            <button
              type="button"
              onClick={() => onSelect(backTo!.sel)}
              className="inline-flex items-center gap-1 self-start -ml-1 mb-1 rounded-md px-1.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Back to {backTo.label}
            </button>
          )}
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
