"use client";

import {
  Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { formatR, type EdgeBucket } from "@/lib/journal/edge";
import { slotStart, type Coverage, type SlotSize } from "@/lib/journal/time-stats";
import { cn } from "@/lib/utils";
import { EmptyPanel, Panel, RValue } from "./analytics-ui";

const tradesLabel = (n: number) => `${n} trade${n === 1 ? "" : "s"}`;

const SLOT_OPTIONS: { size: SlotSize; label: string }[] = [
  { size: 15, label: "15m" },
  { size: 30, label: "30m" },
  { size: 60, label: "1h" },
];

interface Row extends EdgeBucket {
  start: string;
  /** Bar value; null for an empty slot so no stub is drawn. */
  r: number | null;
}

function SlotToggle({ value, onChange }: { value: SlotSize; onChange: (s: SlotSize) => void }) {
  return (
    <div className="flex rounded-md border border-border/50 p-0.5" role="group" aria-label="Slot size">
      {SLOT_OPTIONS.map((o) => (
        <button
          key={o.size}
          type="button"
          onClick={() => onChange(o.size)}
          aria-pressed={value === o.size}
          className={cn(
            "rounded px-2 py-0.5 text-[11px] font-medium transition-colors",
            value === o.size ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SlotTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Row }> }) {
  if (!active || !payload?.length) return null;
  const b = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold tabular-nums">{b.label}</p>
      {b.trades === 0 ? (
        <p className="text-muted-foreground">No trades entered in this window</p>
      ) : (
        <div className="space-y-0.5 tabular-nums">
          <p>
            <RValue r={b.expectancy} /> <span className="text-muted-foreground">per trade</span>
          </p>
          <p className="text-muted-foreground">
            {tradesLabel(b.trades)} · {b.winRate === null ? "no decisive trades" : `${b.winRate}% win rate`} · {formatR(b.totalR, 1)} total
          </p>
          {b.thin && <p className="text-muted-foreground/80">Thin sample: not a conclusion yet</p>}
        </div>
      )}
    </div>
  );
}

/** The ranked best / worst windows next to the chart: the specific times to act on. */
function SlotRanking({ buckets, baseline }: { buckets: EdgeBucket[]; baseline: number }) {
  const solid = buckets.filter((b) => !b.thin && b.trades > 0);
  const best = solid.filter((b) => b.expectancy > 0).sort((a, b) => b.expectancy - a.expectancy).slice(0, 3);
  const worst = solid
    .filter((b) => b.expectancy < Math.min(0, baseline) && !best.includes(b))
    .sort((a, b) => a.expectancy - b.expectancy)
    .slice(0, 2);
  const thinWithTrades = buckets.filter((b) => b.thin && b.trades > 0).length;

  if (best.length === 0 && worst.length === 0) {
    return (
      <div className="flex h-full items-center rounded-xl border border-dashed border-border/60 px-3 py-3 text-[11px] leading-relaxed text-muted-foreground">
        No window has 5+ trades yet{thinWithTrades > 0 && ` (${thinWithTrades} with fewer)`}. Try a wider slot or All time to see which
        times stand out.
      </div>
    );
  }

  const Item = ({ b }: { b: EdgeBucket }) => (
    <li className="flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-muted/15 px-2.5 py-1.5">
      <span className="min-w-0">
        <span className="block text-xs font-semibold tabular-nums">{b.label}</span>
        <span className="block text-[10px] text-muted-foreground">
          {tradesLabel(b.trades)}{b.winRate !== null && ` · ${b.winRate}% win`}
        </span>
      </span>
      <RValue r={b.expectancy} className="text-xs" />
    </li>
  );

  return (
    <div className="space-y-3">
      {best.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Best windows</p>
          <ul className="space-y-1.5">{best.map((b) => <Item key={b.key} b={b} />)}</ul>
        </div>
      )}
      {worst.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Windows that cost you</p>
          <ul className="space-y-1.5">{worst.map((b) => <Item key={b.key} b={b} />)}</ul>
        </div>
      )}
    </div>
  );
}

export function EntryTimePanel({
  buckets,
  coverage,
  slot,
  onSlotChange,
  baseline,
}: {
  buckets: EdgeBucket[];
  coverage: Coverage;
  slot: SlotSize;
  onSlotChange: (s: SlotSize) => void;
  baseline: number;
}) {
  const rows: Row[] = buckets.map((b) => ({ ...b, start: slotStart(b.key), r: b.trades ? b.expectancy : null }));
  // Label every slot when there is room, otherwise only the full hours.
  const labelAll = slot === 60 || rows.length <= 12;
  const showLabel = (i: number) => labelAll || Number(rows[i]?.key) % 60 === 0;

  const hasThin = buckets.some((b) => b.thin && b.trades > 0);

  return (
    <Panel
      title="Time of entry"
      hint={`Average R per trade for trades you opened in each ${slot === 60 ? "hour" : `${slot}-minute window`}, by the entry time you logged.`}
      info="Each bar is one time window. Its height is your average R per trade for trades you entered in that window: a win counts its R:R, a loss −1R, a break-even 0. Above zero makes money, below costs money. The number under each time is how many trades. The dashed line is your average trade; grey bars have fewer than 5 trades. Switch between 15 minutes, 30 minutes and 1 hour at the top right."
      coverage={coverage}
      action={<SlotToggle value={slot} onChange={onSlotChange} />}
    >
      {rows.length === 0 ? (
        <EmptyPanel>Add an entry time to your trades to see which times of day make you money.</EmptyPanel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem]">
          <div>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -8 }} barCategoryGap="18%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="start"
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  height={34}
                  tick={({ x, y, index }: { x: number | string; y: number | string; index: number }) => {
                    const b = rows[index];
                    if (!b) return <g />;
                    return (
                      <g transform={`translate(${x},${y})`}>
                        {showLabel(index) && (
                          <text dy={10} textAnchor="middle" fontSize={10} fill="var(--color-muted-foreground)">
                            {b.start}
                          </text>
                        )}
                        {b.trades > 0 && (
                          <text dy={23} textAnchor="middle" fontSize={9} fill="var(--color-muted-foreground)" opacity={0.55}>
                            {b.trades}
                          </text>
                        )}
                      </g>
                    );
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={44}
                  tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                  tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v}R`}
                />
                <Tooltip content={<SlotTooltip />} cursor={{ fill: "var(--color-muted)", opacity: 0.35 }} />
                <ReferenceLine y={0} stroke="var(--color-muted-foreground)" strokeOpacity={0.5} />
                {baseline !== 0 && (
                  <ReferenceLine y={baseline} stroke="var(--color-primary)" strokeDasharray="4 4" strokeOpacity={0.8} />
                )}
                <Bar dataKey="r" maxBarSize={30} radius={[3, 3, 3, 3]}>
                  {rows.map((b) => (
                    <Cell
                      key={b.key}
                      fill={b.thin ? "var(--color-muted-foreground)" : (b.r ?? 0) >= 0 ? "var(--win)" : "var(--loss)"}
                      fillOpacity={b.thin ? 0.3 : 0.9}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 pl-9 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: "var(--win)" }} />Makes money</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: "var(--loss)" }} />Costs money</span>
              {hasThin && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-muted-foreground/30" />Under 5 trades (thin)
                </span>
              )}
              {baseline !== 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 border-t border-dashed border-primary" />Your average ({formatR(baseline)})
                </span>
              )}
            </div>
          </div>
          <SlotRanking buckets={buckets} baseline={baseline} />
        </div>
      )}
    </Panel>
  );
}
