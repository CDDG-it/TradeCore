"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTrades, getDashboardStats } from "@/lib/mock/store";
import { cn } from "@/lib/utils";

// Custom tooltip styles
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      {label && <p className="text-muted-foreground mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {typeof p.value === "number" && p.name.toLowerCase().includes("pnl") ? `$${p.value}` : p.value}
        </p>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const trades = getTrades();
  const stats = getDashboardStats();

  // Win/Loss/BE breakdown
  const wins = trades.filter((t) => t.result === "win").length;
  const losses = trades.filter((t) => t.result === "loss").length;
  const bes = trades.filter((t) => t.result === "break-even").length;
  const lossRate = trades.length > 0 ? Math.round((losses / trades.length) * 100) : 0;

  const resultData = [
    { name: "Win", value: wins, color: "var(--color-success)" },
    { name: "Loss", value: losses, color: "var(--color-destructive)" },
    { name: "B/E", value: bes, color: "var(--color-warning)" },
  ].filter((d) => d.value > 0);

  // Cumulative PnL over time
  const sortedTrades = [...trades].sort(
    (a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
  );
  let running = 0;
  const pnlTimeline = sortedTrades.map((t) => {
    running += t.pnl;
    return {
      date: format(new Date(t.date_time), "MMM d"),
      pnl: running,
      trade: t.instrument,
    };
  });

  // Performance by instrument
  const byInstrument: Record<string, { pnl: number; trades: number; wins: number }> = {};
  trades.forEach((t) => {
    if (!byInstrument[t.instrument]) {
      byInstrument[t.instrument] = { pnl: 0, trades: 0, wins: 0 };
    }
    byInstrument[t.instrument].pnl += t.pnl;
    byInstrument[t.instrument].trades += 1;
    if (t.result === "win") byInstrument[t.instrument].wins += 1;
  });
  const instrumentData = Object.entries(byInstrument)
    .map(([name, d]) => ({
      name,
      pnl: d.pnl,
      winRate: Math.round((d.wins / d.trades) * 100),
      trades: d.trades,
    }))
    .sort((a, b) => b.pnl - a.pnl);

  // RR distribution
  const rrBuckets: Record<string, number> = {};
  trades.forEach((t) => {
    const bucket = `${Math.floor(t.rr)}-${Math.floor(t.rr) + 1}R`;
    rrBuckets[bucket] = (rrBuckets[bucket] || 0) + 1;
  });
  const rrData = Object.entries(rrBuckets)
    .map(([range, count]) => ({ range, count }))
    .sort((a, b) => parseFloat(a.range) - parseFloat(b.range));

  // Performance by setup
  const bySetup: Record<string, { pnl: number; trades: number; wins: number }> = {};
  trades.forEach((t) => {
    const key = t.setup;
    if (!bySetup[key]) bySetup[key] = { pnl: 0, trades: 0, wins: 0 };
    bySetup[key].pnl += t.pnl;
    bySetup[key].trades += 1;
    if (t.result === "win") bySetup[key].wins += 1;
  });
  const setupData = Object.entries(bySetup)
    .map(([setup, d]) => ({
      setup,
      pnl: d.pnl,
      winRate: Math.round((d.wins / d.trades) * 100),
      trades: d.trades,
    }))
    .sort((a, b) => b.pnl - a.pnl);

  // Long vs short
  const longTrades = trades.filter((t) => t.direction === "long");
  const shortTrades = trades.filter((t) => t.direction === "short");
  const longWinRate =
    longTrades.length > 0
      ? Math.round((longTrades.filter((t) => t.result === "win").length / longTrades.length) * 100)
      : 0;
  const shortWinRate =
    shortTrades.length > 0
      ? Math.round((shortTrades.filter((t) => t.result === "win").length / shortTrades.length) * 100)
      : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Performance breakdown across {stats.total_trades} trades
        </p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Win Rate", value: `${stats.win_rate}%`, sub: `${wins}W / ${losses}L / ${bes}BE`, color: "text-success" },
          { label: "Avg R:R", value: `${stats.average_rr}R`, sub: "Per completed trade", color: "text-primary" },
          { label: "Total P&L", value: `$${stats.total_pnl.toLocaleString()}`, sub: `${stats.total_trades} trades logged`, color: stats.total_pnl >= 0 ? "text-success" : "text-destructive" },
          { label: "Loss Rate", value: `${lossRate}%`, sub: `${losses} losing trades`, color: "text-destructive" },
        ].map(({ label, value, sub, color }) => (
          <Card key={label} className="bg-card border-border/50">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
              <p className={cn("text-2xl font-bold", color)}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* PnL timeline + Win breakdown */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Equity curve */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Cumulative P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={pnlTimeline} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
                  <defs>
                    <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="pnl"
                    name="P&L"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2}
                    fill="url(#pnlGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Win/Loss/BE pie */}
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Result Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={resultData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {resultData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0];
                    return (
                      <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs">
                        <p style={{ color: (d.payload as { color: string }).color }} className="font-semibold">
                          {d.name}: {d.value}
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {resultData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-muted-foreground">{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instrument performance + RR dist */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Instrument P&L */}
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">P&L by Instrument</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={instrumentData} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="pnl" name="P&L" radius={[4, 4, 0, 0]}>
                  {instrumentData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.pnl >= 0 ? "var(--color-chart-1)" : "var(--color-chart-4)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* RR distribution */}
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">R:R Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={rrData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Trades" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Side performance */}
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { label: "Long", trades: longTrades.length, winRate: longWinRate, pnl: longTrades.reduce((s, t) => s + t.pnl, 0), color: "text-success" },
          { label: "Short", trades: shortTrades.length, winRate: shortWinRate, pnl: shortTrades.reduce((s, t) => s + t.pnl, 0), color: "text-destructive" },
        ].map(({ label, trades: t, winRate, pnl, color }) => (
          <Card key={label} className="bg-card border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold">{label} Trades</p>
                <span className={cn("text-xs font-medium", color)}>{t} trades</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold">{winRate}%</p>
                  <p className="text-xs text-muted-foreground">Win rate</p>
                </div>
                <div>
                  <p className={cn("text-2xl font-bold", pnl >= 0 ? "text-success" : "text-destructive")}>
                    {pnl >= 0 ? "+" : ""}${pnl.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Total P&L</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Setup performance table */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Setup Performance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/40">
            <div className="grid grid-cols-4 px-5 py-2 text-xs text-muted-foreground uppercase tracking-wider">
              <span>Setup</span>
              <span className="text-center">Trades</span>
              <span className="text-center">Win %</span>
              <span className="text-right">P&L</span>
            </div>
            {setupData.map((s) => (
              <div key={s.setup} className="grid grid-cols-4 px-5 py-3.5 text-sm">
                <span className="font-medium text-foreground/90 truncate pr-2">{s.setup}</span>
                <span className="text-center text-muted-foreground">{s.trades}</span>
                <span className={cn("text-center font-medium", s.winRate >= 60 ? "text-success" : s.winRate >= 40 ? "text-warning" : "text-destructive")}>
                  {s.winRate}%
                </span>
                <span className={cn("text-right font-semibold", s.pnl >= 0 ? "text-success" : "text-destructive")}>
                  {s.pnl >= 0 ? "+" : ""}${s.pnl.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
