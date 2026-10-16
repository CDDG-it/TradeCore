"use client";

import { Pane } from "@/components/gmi/pane";
import { formatR, type EdgeBucket } from "@/lib/journal/edge";
import type { ConfluencePair, ConfluenceStat } from "@/lib/journal/confluence-stats";
import type { Drill } from "@/lib/journal/analytics-filter";
import { EdgeBars, tradesLabel } from "./analytics-ui";

/** A confluence as a bucket, keyed by its lower-cased name so the drill can find it. */
const asBucket = (c: ConfluenceStat): EdgeBucket => ({
  key: c.name.toLowerCase(),
  label: c.name,
  trades: c.trades,
  wins: c.wins,
  losses: c.losses,
  winRate: c.wins + c.losses ? c.winRate : null,
  totalR: c.totalR,
  expectancy: c.expectancy,
  thin: c.thin,
});

/** What each confluence earns per trade, best first. One number a row; the rest is in the hover. */
export function ConfluencePane({
  index, className, confluences, pairs, drill, onDrill,
}: {
  index: string;
  className?: string;
  confluences: ConfluenceStat[];
  pairs: ConfluencePair[];
  drill: Drill;
  onDrill: (d: Partial<Drill>) => void;
}) {
  const rows = [...confluences].sort((a, b) => b.expectancy - a.expectancy).map(asBucket);
  const selected = drill.confluence;
  const solid = rows.filter((r) => !r.thin);
  const paying = solid.filter((r) => r.expectancy > 0).length;

  return (
    <Pane index={index} label="Confluence reward" className={className} bodyClassName="flex flex-col p-3">
      <p className="mb-2 shrink-0 text-xs text-muted-foreground">
        {solid.length ? `${paying} of ${solid.length} confluences make money per trade.` : "R per trade for every confluence you log."}
      </p>
      <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
        <EdgeBars
          buckets={rows}
          collapseThin
          selected={selected}
          onSelect={(b) => onDrill({ confluence: selected?.length === 1 && selected[0] === b.key ? undefined : [b.key] })}
          emptyLabel="No confluences logged on these trades."
          tip={(b) => {
            const partners = pairs
              .filter((p) => !p.thin && p.names.some((n) => n.toLowerCase() === b.key))
              .slice(0, 2)
              .map((p) => `${p.names.find((n) => n.toLowerCase() !== b.key)} (${formatR(p.expectancy)})`);
            return (
              <div className="space-y-0.5">
                <p className="font-semibold">{b.label}</p>
                <p>{formatR(b.expectancy)} per trade · {tradesLabel(b.trades)}</p>
                <p className="opacity-80">
                  {b.winRate === null ? "No decisive trades" : `${b.winRate}% win rate`} · {b.wins}W / {b.losses}L · {formatR(b.totalR, 1)} total
                </p>
                {partners.length > 0 && <p className="opacity-80">Best with: {partners.join(", ")}</p>}
                {b.thin && <p className="opacity-80">Fewer than 5 trades: an early read, not a conclusion</p>}
              </div>
            );
          }}
        />
      </div>
    </Pane>
  );
}

