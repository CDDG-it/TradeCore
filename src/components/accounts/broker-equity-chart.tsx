"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Loader2 } from "lucide-react";
import { mask } from "@/lib/use-privacy";
import { cn } from "@/lib/utils";

/**
 * The equity curve of one connected account, from the history the collector
 * writes on every poll (one point per five minutes).
 *
 * The line is green or red against where the period started, since that is
 * the only comparison a trader reads it for. A period with fewer than two
 * points says so rather than drawing a flat line that looks like no movement.
 */

export interface HistoryPoint {
  bucket: string;
  balance: number | null;
  equity: number | null;
  day_pl: number | null;
}

export type HistoryLoader = (accountId: string, from: string, to: string) => Promise<HistoryPoint[]>;

const RANGES = [
  { key: "today", label: "Today" },
  { key: "week", label: "7 days" },
] as const;
type RangeKey = (typeof RANGES)[number]["key"];

function windowFor(range: RangeKey): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  if (range === "today") from.setHours(0, 0, 0, 0);
  else from.setDate(from.getDate() - 7);
  return { from: from.toISOString(), to: to.toISOString() };
}

async function fetchHistory(accountId: string, from: string, to: string): Promise<HistoryPoint[]> {
  const params = new URLSearchParams({ account: accountId, from, to });
  const res = await fetch(`/api/broker/history?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error(String(res.status));
  const body = (await res.json()) as { points?: HistoryPoint[] };
  return body.points ?? [];
}

export function BrokerEquityChart({
  accountId,
  label,
  hidden,
  load,
}: {
  accountId: string;
  label: string;
  hidden: boolean;
  /** Overridden by the development preview to render a sample curve. */
  load?: HistoryLoader;
}) {
  const [range, setRange] = useState<RangeKey>("today");
  const [points, setPoints] = useState<HistoryPoint[] | null>(null);
  const [failed, setFailed] = useState(false);

  const loader = load ?? fetchHistory;

  const read = useCallback(async () => {
    setPoints(null);
    setFailed(false);
    const { from, to } = windowFor(range);
    try {
      setPoints(await loader(accountId, from, to));
    } catch {
      setFailed(true);
    }
  }, [accountId, range, loader]);

  useEffect(() => {
    read();
  }, [read]);

  const usable = (points ?? []).filter((p) => p.equity !== null);
  const first = usable[0]?.equity ?? null;
  const last = usable[usable.length - 1]?.equity ?? null;
  const change = first !== null && last !== null ? last - first : null;

  /* An equity curve moves by hundreds on a six-figure account, so rounding the
     axis to whole thousands prints the same label four times. Pick the
     precision from the range actually on screen. */
  const values = usable.map((p) => p.equity as number);
  const span = values.length ? Math.max(...values) - Math.min(...values) : 0;
  const axisDecimals = span < 2_000 ? 2 : span < 20_000 ? 1 : 0;
  const colour = change === null || change === 0 ? "var(--be)" : change > 0 ? "var(--win)" : "var(--loss)";

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{label}</p>
          <p className="text-[11px] text-muted-foreground">
            Equity curve
            {change !== null && (
              <span style={{ color: colour }} className="ml-1.5 font-medium">
                {mask(
                  `${change > 0 ? "+" : change < 0 ? "-" : ""}${Math.abs(change).toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 2,
                  })}`,
                  hidden
                )}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
                range === r.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-48">
        {points === null && !failed ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : failed ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            The history could not be loaded.
          </div>
        ) : usable.length < 2 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
            <p className="text-xs text-muted-foreground">Not enough history yet.</p>
            <p className="text-[11px] text-muted-foreground/70">
              A point is recorded every five minutes while the account is connected.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={usable} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
              <XAxis
                dataKey="bucket"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickFormatter={(b: string) => format(new Date(b), range === "today" ? "HH:mm" : "d MMM")}
                interval="preserveStartEnd"
                minTickGap={40}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickFormatter={(v) => (hidden ? "•••" : `$${(Number(v) / 1000).toFixed(axisDecimals)}k`)}
                domain={["dataMin - 50", "dataMax + 50"]}
                axisLine={false}
                tickLine={false}
                width={62}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelFormatter={(b) => format(new Date(String(b)), "d MMM HH:mm")}
                formatter={(v) => [
                  mask(
                    Number(v).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }),
                    hidden
                  ),
                  "Equity",
                ]}
              />
              {/* Animation off, as elsewhere: ResponsiveContainer's first
                  measurement can be -1 and leaves the path stuck at zero. */}
              <Line
                type="monotone"
                dataKey="equity"
                stroke={colour}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
