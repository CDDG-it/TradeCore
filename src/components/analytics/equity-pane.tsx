"use client";

import { useId, useState } from "react";
import { format, parseISO } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
import { Empty, Pane, Switch } from "@/components/gmi/pane";
import { formatR } from "@/lib/journal/edge";
import { inOrder, netRColor, resultColor } from "@/lib/journal/colors";
import { instrumentName, tradeR } from "@/lib/journal/weeks";
import type { EquityPoint } from "@/lib/journal/analytics-filter";
import type { TradeJournalEntry } from "@/lib/types";
import { EASE, RValue } from "./analytics-ui";

type View = "curve" | "trades";
const VIEWS: { key: View; label: string }[] = [
  { key: "curve", label: "Curve" },
  { key: "trades", label: "Trades" },
];

function CurveTip({ active, payload }: { active?: boolean; payload?: Array<{ payload: EquityPoint }> }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold">Trade {p.i} · {format(parseISO(p.date), "d MMM yyyy")}</p>
      <p className="tabular-nums">
        <span style={{ color: netRColor(p.r) }}>{formatR(p.r)}</span>
        <span className="text-muted-foreground"> · running </span>
        <span style={{ color: netRColor(p.cum) }}>{formatR(p.cum, 1)}</span>
      </p>
    </div>
  );
}

function Curve({ points }: { points: EquityPoint[] }) {
  const id = useId().replace(/:/g, "");
  if (points.length < 2) return <Empty label="Not enough trades" hint="The curve needs at least two trades in this selection." />;
  const last = points[points.length - 1].cum;
  const color = netRColor(last);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={points} margin={{ top: 6, right: 4, bottom: 0, left: -14 }}>
        <defs>
          <linearGradient id={`eq-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="i" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} minTickGap={24} />
        <YAxis axisLine={false} tickLine={false} width={40} tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v}R`} />
        <ReferenceLine y={0} stroke="var(--color-muted-foreground)" strokeOpacity={0.45} />
        <ChartTooltip content={<CurveTip />} cursor={{ stroke: "var(--color-primary)", strokeOpacity: 0.4 }} />
        <Area type="monotone" dataKey="cum" stroke={color} strokeWidth={2} fill={`url(#eq-${id})`} animationDuration={800} animationEasing="ease-out" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function TradeList({ trades }: { trades: TradeJournalEntry[] }) {
  if (trades.length === 0) return <Empty label="No trades" />;
  const rows = inOrder(trades).reverse().slice(0, 200);
  return (
    <div className="h-full overflow-y-auto pr-0.5">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-card/95 text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur">
          <tr className="text-left">
            <th className="py-1 font-semibold">Date</th>
            <th className="py-1 font-semibold">Market</th>
            <th className="py-1 font-semibold">Side</th>
            <th className="hidden py-1 font-semibold sm:table-cell">Session</th>
            <th className="py-1 text-right font-semibold">R</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {rows.map((t) => (
            <tr key={t.id} className="transition-colors hover:bg-muted/30">
              <td className="py-1.5 tabular-nums text-muted-foreground">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: resultColor(t) }} />
                {format(parseISO(t.date_time.slice(0, 10)), "d MMM")}
                {t.execution_time && <span className="ml-1 text-muted-foreground/60">{t.execution_time}</span>}
              </td>
              <td className="max-w-[7rem] truncate py-1.5 font-medium">{instrumentName(t.instrument)}</td>
              <td className="py-1.5 capitalize text-muted-foreground">{t.direction}</td>
              <td className="hidden py-1.5 text-muted-foreground sm:table-cell">{t.session}</td>
              <td className="py-1.5 text-right"><RValue r={tradeR(t)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EquityPane({
  index, className, points, trades,
}: {
  index: string;
  className?: string;
  points: EquityPoint[];
  trades: TradeJournalEntry[];
}) {
  const [view, setView] = useState<View>("curve");
  return (
    <Pane
      index={index}
      label="Selection"
      className={className}
      bodyClassName="flex flex-col p-3"
      right={<Switch options={VIEWS} value={view} onChange={setView} />}
    >
      <p className="mb-2 shrink-0 truncate text-[11px] text-muted-foreground">
        {view === "curve" ? "Running R of the trades in this selection, in the order taken" : `${trades.length} trades, newest first`}
      </p>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={view}
          className="min-h-[140px] flex-1"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: EASE }}
        >
          {view === "curve" ? <Curve points={points} /> : <TradeList trades={trades} />}
        </motion.div>
      </AnimatePresence>
    </Pane>
  );
}
