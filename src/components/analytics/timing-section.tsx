"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { alpha, netRColor } from "@/lib/journal/colors";
import { extremes, formatR, type EdgeBucket } from "@/lib/journal/edge";
import {
  SESSIONS, WEEKDAYS,
  type Coverage, type SlotSize, type WeekdaySessionGrid,
} from "@/lib/journal/time-stats";
import { cn } from "@/lib/utils";
import { BARS_INFO, BucketBars, Panel, RValue, Section } from "./analytics-ui";
import { EntryTimePanel } from "./entry-time-panel";

const tradesLabel = (n: number) => `${n} trade${n === 1 ? "" : "s"}`;

/** What one bucket means, for a hover card. */
function BucketTip({ title, b }: { title: string; b: EdgeBucket }) {
  return (
    <div className="space-y-0.5">
      <p className="font-semibold">{title}</p>
      {b.trades === 0 ? (
        <p className="opacity-80">No trades</p>
      ) : (
        <>
          <p>{formatR(b.expectancy)} per trade · {tradesLabel(b.trades)}</p>
          <p className="opacity-80">
            {b.winRate === null ? "No decisive trades" : `${b.winRate}% win rate`} · {formatR(b.totalR, 1)} total
          </p>
          {b.thin && <p className="opacity-80">Thin sample: not a conclusion yet</p>}
        </>
      )}
    </div>
  );
}

// ── Weekday x session ───────────────────────────────────────────────────

function HeatCell({ b, title, maxAbs, emphasis }: { b: EdgeBucket; title: string; maxAbs: number; emphasis?: boolean }) {
  const strength = b.trades && !b.thin ? 14 + (Math.abs(b.expectancy) / maxAbs) * 46 : 0;
  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          "flex min-h-[38px] w-full flex-col items-center justify-center rounded-md border px-1 py-1 text-center transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
          b.trades === 0 ? "border-dashed border-border/40" : "border-border/40",
          b.thin && b.trades > 0 && "bg-muted/20",
          emphasis && "bg-muted/25"
        )}
        style={strength ? { background: alpha(netRColor(b.expectancy), strength) } : undefined}
      >
        {b.trades === 0 ? (
          <span className="text-xs text-muted-foreground/40">–</span>
        ) : (
          <>
            <span className={cn("text-[11px] font-bold leading-tight tabular-nums sm:text-xs", b.thin ? "text-muted-foreground" : "text-foreground")}>
              {formatR(b.expectancy)}
            </span>
            <span className="text-[9px] leading-none tabular-nums text-muted-foreground">{b.trades}</span>
          </>
        )}
      </TooltipTrigger>
      <TooltipContent className="text-left">
        <BucketTip title={title} b={b} />
      </TooltipContent>
    </Tooltip>
  );
}

function WeekdaySessionHeatmap({ grid }: { grid: WeekdaySessionGrid }) {
  const all = WEEKDAYS.flatMap((d) => SESSIONS.map((s) => grid.cells[d.key][s]));
  const maxAbs = Math.max(0.01, ...all.filter((b) => !b.thin).map((b) => Math.abs(b.expectancy)));
  const totalMax = Math.max(
    0.01,
    ...[...grid.byWeekday, ...grid.bySession].filter((b) => !b.thin).map((b) => Math.abs(b.expectancy))
  );

  return (
    <div>
      <div className="grid grid-cols-[2.25rem_repeat(3,minmax(0,1fr))_minmax(0,1fr)] gap-1 sm:grid-cols-[2.5rem_repeat(3,minmax(0,1fr))_minmax(0,1fr)]">
        <span />
        {SESSIONS.map((s) => (
          <span key={s} className="truncate text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {s === "New York" ? <><span className="sm:hidden">NY</span><span className="hidden sm:inline">New York</span></> : s}
          </span>
        ))}
        <span className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Day</span>

        {WEEKDAYS.map((d, i) => (
          <div key={d.key} className="contents">
            <span className="flex items-center text-xs font-medium text-muted-foreground">{d.label}</span>
            {SESSIONS.map((s) => (
              <HeatCell key={s} b={grid.cells[d.key][s]} title={`${d.long} · ${s}`} maxAbs={maxAbs} />
            ))}
            <HeatCell b={grid.byWeekday[i]} title={`All ${d.long}s`} maxAbs={totalMax} emphasis />
          </div>
        ))}

        <span className="flex items-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">All</span>
        {grid.bySession.map((b) => (
          <HeatCell key={b.key} b={b} title={`Every ${b.label} session`} maxAbs={totalMax} emphasis />
        ))}
        <span />
      </div>
      {grid.weekendTrades > 0 && (
        <p className="mt-2 text-[10px] text-muted-foreground/70">
          {tradesLabel(grid.weekendTrades)} on weekends left out.
        </p>
      )}
    </div>
  );
}

// ── Section ─────────────────────────────────────────────────────────────

export function TimingSection({
  baseline,
  hours,
  hourCoverage,
  slot,
  onSlotChange,
  grid,
  order,
  hold,
  holdCoverage,
}: {
  baseline: EdgeBucket;
  hours: EdgeBucket[];
  hourCoverage: Coverage;
  slot: SlotSize;
  onSlotChange: (s: SlotSize) => void;
  grid: WeekdaySessionGrid;
  order: EdgeBucket[];
  hold: EdgeBucket[];
  holdCoverage: Coverage;
}) {
  const hourEx = extremes(hours);
  const cells = WEEKDAYS.flatMap((d) => SESSIONS.map((s) => ({ name: `${d.long} ${s}`, b: grid.cells[d.key][s] })));
  const cellEx = extremes(cells.map((c) => ({ ...c.b, label: c.name })));
  const holdEx = extremes(hold);

  let takeaway: React.ReactNode = null;
  if (hourEx.best) {
    takeaway = (
      <>
        Your strongest entry window is <b>{hourEx.best.label}</b> at{" "}
        <RValue r={hourEx.best.expectancy} /> per trade over {tradesLabel(hourEx.best.trades)}
        {hourEx.worst && (
          <>
            ; your weakest is <b>{hourEx.worst.label}</b> at <RValue r={hourEx.worst.expectancy} />
          </>
        )}
        , against <RValue r={baseline.expectancy} /> on your average trade.
      </>
    );
  } else if (cellEx.best) {
    takeaway = (
      <>
        Your best slot is <b>{cellEx.best.label}</b> at <RValue r={cellEx.best.expectancy} /> per trade over{" "}
        {tradesLabel(cellEx.best.trades)}
        {cellEx.worst && (
          <>
            , your weakest <b>{cellEx.worst.label}</b> at <RValue r={cellEx.worst.expectancy} />
          </>
        )}
.
      </>
    );
  }

  const first = order.find((b) => b.key === "1");
  const orderLine = first && !first.thin ? `First trade of the day: ${formatR(first.expectancy)} per trade.` : undefined;
  const orderInfo =
    "Do later trades in a day earn as much as the first? Bars that shrink or turn red further down are the signature of overtrading.";

  return (
    <Section
      title="When you trade best"
      explainer="Everything here is R per trade: what you make on average for every 1R you risk. It shows at which times your trading pays, and when you would be better off flat."
      takeaway={takeaway}
    >
      <EntryTimePanel
        buckets={hours}
        coverage={hourCoverage}
        slot={slot}
        onSlotChange={onSlotChange}
        baseline={baseline.expectancy}
      />

      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        <Panel
          title="Day and session"
          info="Each cell is R per trade (big) and the number of trades (small) for that weekday and session. Stronger green is more profitable per trade, stronger red more costly. The right column and bottom row are totals."
        >
          <WeekdaySessionHeatmap grid={grid} />
        </Panel>

        <Panel title="Trade number of the day" info={`${orderInfo} ${BARS_INFO}`} hint={orderLine}>
          <BucketBars buckets={order} />
        </Panel>
        <Panel
          title="Hold time"
          info={`Time from entry to exit against what the trade earned. ${BARS_INFO}`}
          hint={holdEx.best ? `Best: held ${holdEx.best.label.toLowerCase()}, ${formatR(holdEx.best.expectancy)} per trade.` : undefined}
          coverage={holdCoverage}
        >
          <BucketBars buckets={hold} emptyLabel="Log entry and exit times to see how hold time relates to your results." />
        </Panel>
      </div>
    </Section>
  );
}
