"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { alpha, netRColor } from "@/lib/journal/colors";
import { extremes, formatR, type EdgeBucket } from "@/lib/journal/edge";
import {
  hourWindow, SESSIONS, WEEKDAYS,
  type Coverage, type WeekdaySessionGrid,
} from "@/lib/journal/time-stats";
import { cn } from "@/lib/utils";
import { BucketBars, EmptyPanel, Panel, RValue, Section } from "./analytics-ui";

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

// ── Hour of day ─────────────────────────────────────────────────────────

const CHART_H = 168;

function HourChart({ buckets }: { buckets: EdgeBucket[] }) {
  const posMax = Math.max(0, ...buckets.map((b) => b.expectancy));
  const negMax = Math.max(0, ...buckets.map((b) => -b.expectancy));
  const total = posMax + negMax || 1;
  const topH = (posMax / total) * CHART_H;
  // With many hours the labels would collide on a phone: label every other one.
  const sparse = buckets.length > 10;

  return (
    <div>
      <div className="relative flex items-stretch gap-[3px] sm:gap-1.5" style={{ height: CHART_H }}>
        {/* Zero line */}
        <span className="pointer-events-none absolute inset-x-0 h-px bg-border" style={{ top: topH }} />
        {buckets.map((b) => {
          const h = b.trades ? Math.max((Math.abs(b.expectancy) / total) * CHART_H, 2) : 0;
          const color = b.thin ? alpha("var(--muted-foreground)", 30) : netRColor(b.expectancy);
          return (
            <Tooltip key={b.key}>
              <TooltipTrigger
                aria-label={`${hourWindow(b.key)}: ${b.trades ? `${formatR(b.expectancy)} per trade over ${tradesLabel(b.trades)}` : "no trades"}`}
                className="group relative flex-1 rounded-md transition-colors hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:outline-none"
              >
                {b.trades > 0 && (
                  <span
                    className={cn("absolute inset-x-[12%] rounded-[4px]", b.thin && "outline outline-1 outline-dashed outline-muted-foreground/40")}
                    style={
                      b.expectancy >= 0
                        ? { bottom: CHART_H - topH, height: h, background: color }
                        : { top: topH, height: h, background: color }
                    }
                  />
                )}
              </TooltipTrigger>
              <TooltipContent className="text-left">
                <BucketTip title={hourWindow(b.key)} b={b} />
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      <div className="mt-2 flex gap-[3px] sm:gap-1.5">
        {buckets.map((b, i) => (
          <div key={b.key} className="flex-1 text-center">
            <p className={cn("text-[10px] tabular-nums text-muted-foreground", sparse && i % 2 === 1 && "invisible sm:visible")}>
              {b.label.slice(0, 2)}
            </p>
            <p className="hidden text-[9px] tabular-nums text-muted-foreground/50 sm:block">{b.trades || ""}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Bar height is R per trade for trades entered in that hour; the small number under each hour is how many trades that is.
        Dashed grey bars are thin samples.
      </p>
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
          "flex min-h-[52px] w-full flex-col items-center justify-center rounded-lg border px-1 py-1.5 text-center transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
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
            <span className={cn("text-xs font-bold tabular-nums sm:text-sm", b.thin ? "text-muted-foreground" : "text-foreground")}>
              {formatR(b.expectancy)}
            </span>
            <span className="text-[9px] tabular-nums text-muted-foreground sm:text-[10px]">{b.trades}</span>
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
      <div className="grid grid-cols-[2.25rem_repeat(3,minmax(0,1fr))_minmax(0,1fr)] gap-1.5 sm:grid-cols-[3rem_repeat(3,minmax(0,1fr))_minmax(0,1fr)] sm:gap-2">
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
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Each cell shows R per trade (big) and the number of trades (small). Stronger green means more profitable per trade,
        stronger red means more costly. The right column and bottom row are the totals per day and per session.
        {grid.weekendTrades > 0 && ` ${tradesLabel(grid.weekendTrades)} on weekends ${grid.weekendTrades === 1 ? "is" : "are"} left out.`}
      </p>
    </div>
  );
}

// ── Section ─────────────────────────────────────────────────────────────

export function TimingSection({
  baseline,
  hours,
  hourCoverage,
  grid,
  order,
  hold,
  holdCoverage,
}: {
  baseline: EdgeBucket;
  hours: EdgeBucket[];
  hourCoverage: Coverage;
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
        Your strongest hour is <b>{hourWindow(hourEx.best.key)}</b> at{" "}
        <RValue r={hourEx.best.expectancy} /> per trade over {tradesLabel(hourEx.best.trades)}
        {hourEx.worst && (
          <>
            ; your weakest is <b>{hourWindow(hourEx.worst.key)}</b> at <RValue r={hourEx.worst.expectancy} />
          </>
        )}
        . Your average trade makes <RValue r={baseline.expectancy} />, so anything clearly above that is where your edge lives.
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
        . Log entry times on your trades to see this hour by hour.
      </>
    );
  }

  const first = order.find((b) => b.key === "1");
  const orderLine =
    first && !first.thin
      ? `Your first trade of the day averages ${formatR(first.expectancy)}. If the bars shrink or turn red further down, the trades after it are giving that back.`
      : "Do later trades in a day earn as much as the first? A shrinking or red bar further down is the signature of overtrading.";

  return (
    <Section
      title="When you trade best"
      explainer="Everything here is measured in R per trade: what you make on average for every 1R you risk. It shows at which times your trading actually pays, and when you would be better off flat."
      takeaway={takeaway}
    >
      <Panel
        title="Hour of day"
        hint="By entry time, as you logged it."
        coverage={hourCoverage}
      >
        {hours.length ? (
          <HourChart buckets={hours} />
        ) : (
          <EmptyPanel>Add an entry time to your trades and this chart shows which hours make you money.</EmptyPanel>
        )}
      </Panel>

      <Panel title="Day and session" hint="Where the week and the session meet: your best and worst slots at a glance.">
        <WeekdaySessionHeatmap grid={grid} />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Trade number of the day" hint={orderLine}>
          <BucketBars buckets={order} />
        </Panel>
        <Panel
          title="Hold time"
          hint={
            holdEx.best
              ? `Trades held ${holdEx.best.label.toLowerCase()} pay you most, at ${formatR(holdEx.best.expectancy)} per trade.`
              : "How long you stay in a trade, from entry to exit, against what it earns."
          }
          coverage={holdCoverage}
        >
          <BucketBars buckets={hold} emptyLabel="Log both an entry and an exit time to see how hold time relates to your results." />
        </Panel>
      </div>
    </Section>
  );
}
