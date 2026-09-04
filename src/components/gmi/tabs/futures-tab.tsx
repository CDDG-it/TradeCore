"use client";

/**
 * FUTURES & CROSS-ASSET — a research surface for the contracts a desk actually
 * trades: a full chart for the selected instrument with its day range, plus
 * cross-asset tools (normalised performance and a correlation matrix of daily
 * returns). Correlation is a descriptive statistic of past co-movement, never
 * a signal.
 */
import { useMemo, useState } from "react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { fmtPrice, fmtPct, toneFor, useGmi } from "@/lib/gmi/client";
import type { DataEnvelope, Quote } from "@/lib/gmi/types";
import type { HistoryPayload } from "@/lib/gmi/history";
import { Panel, Unavailable, Segmented, ChangeChip, a } from "../panel";
import { DataStatus } from "../data-status";

const INSTRUMENTS = [
  { s: "NQ", label: "Nasdaq 100" }, { s: "ES", label: "S&P 500" },
  { s: "YM", label: "Dow" }, { s: "RTY", label: "Russell 2000" },
  { s: "GC", label: "Gold" }, { s: "SI", label: "Silver" },
  { s: "CL", label: "Crude Oil" }, { s: "NG", label: "Nat Gas" },
];

const TIMEFRAMES = [
  { key: "5m", label: "5m", interval: "5m", range: "5d" },
  { key: "15m", label: "15m", interval: "15m", range: "1mo" },
  { key: "1h", label: "1h", interval: "60m", range: "3mo" },
  { key: "1D", label: "1D", interval: "1d", range: "1y" },
];

const PALETTE = ["#14B8A6", "#06B6D4", "#22C55E", "#EAB308", "#A78BFA", "#F472B6", "#38BDF8", "#FB7185", "#4ADE80", "#FCD34D"];

const CROSS_RANGES = [
  { key: "1mo", label: "1M" }, { key: "3mo", label: "3M" }, { key: "6mo", label: "6M" }, { key: "1y", label: "1Y" },
] as const;

/* ── Day range — where the last print sits between the day's low and high ─── */
function DayRange({ q }: { q: Quote | undefined }) {
  const lo = q?.dayLow, hi = q?.dayHigh, px = q?.price;
  if (lo == null || hi == null || px == null || hi <= lo) return null;
  const pos = Math.min(1, Math.max(0, (px - lo) / (hi - lo)));
  return (
    <div className="w-full max-w-56">
      <div className="relative h-1.5 rounded-full bg-border/60">
        <span
          className="absolute -top-1 h-3.5 w-0.5 rounded-full bg-primary"
          style={{ left: `calc(${(pos * 100).toFixed(1)}% - 1px)`, boxShadow: `0 0 8px ${a("var(--primary)", 70)}` }}
        />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[9px] tabular-nums text-muted-foreground/70">
        <span>L {fmtPrice(lo)}</span>
        <span className="uppercase tracking-wider">day range</span>
        <span>H {fmtPrice(hi)}</span>
      </div>
    </div>
  );
}

/* ── Instrument chart ─────────────────────────────────────────────────────── */
function InstrumentChart({ quotesEnv }: { quotesEnv: DataEnvelope<Quote[]> | null }) {
  const [sym, setSym] = useState("NQ");
  const [tfKey, setTfKey] = useState("1D");
  const tf = TIMEFRAMES.find((t) => t.key === tfKey) ?? TIMEFRAMES[3];
  const live = new Map((quotesEnv?.data ?? []).map((x) => [x.symbol, x])).get(sym);
  const { env } = useGmi<Quote>(`/api/gmi/quotes?symbol=${sym}&interval=${tf.interval}&range=${tf.range}`, 60_000);
  const q = env?.data;
  const series = (q?.spark ?? []).map((v, i) => ({ i, v }));
  const up = (live?.changePct ?? 0) >= 0;
  const stroke = up ? "var(--success)" : "var(--destructive)";

  return (
    <Panel
      eyebrow="Instrument"
      title={INSTRUMENTS.find((i) => i.s === sym)?.label ?? sym}
      accent="cyan"
      action={<DataStatus env={env} showSource={false} />}
    >
      {/* Contract picker */}
      <div className="scrollbar-none -mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1">
        {INSTRUMENTS.map((it) => {
          const active = sym === it.s;
          return (
            <button
              key={it.s}
              onClick={() => setSym(it.s)}
              className={`shrink-0 rounded-xl border px-2.5 py-1.5 text-left transition-colors ${
                active ? "border-primary/60 bg-primary/10" : "border-border/50 hover:border-border hover:bg-muted/20"
              }`}
            >
              <span className={`block font-mono text-[11px] font-bold ${active ? "text-primary" : "text-foreground"}`}>{it.s}</span>
              <span className="block text-[9px] leading-tight text-muted-foreground/70">{it.label}</span>
            </button>
          );
        })}
      </div>

      {/* Last price, move and the day's range */}
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-end gap-3">
          <span className="font-mono text-3xl font-bold leading-none tabular-nums text-foreground">
            {fmtPrice(live?.price ?? q?.price)}
          </span>
          <span className="mb-0.5 flex items-center gap-2">
            <ChangeChip pct={live?.changePct} />
            <span className="font-mono text-[11px] tabular-nums" style={{ color: toneFor(live?.change) }}>
              {live?.change == null ? "" : `${live.change > 0 ? "+" : ""}${fmtPrice(live.change)}`}
            </span>
          </span>
        </div>
        <DayRange q={live} />
        <Segmented options={TIMEFRAMES.map((t) => ({ key: t.key, label: t.label }))} value={tfKey} onChange={setTfKey} />
      </div>

      <div className="h-72 w-full">
        {series.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="gmi-inst" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity={0.24} />
                  <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.28} />
              <XAxis dataKey="i" hide />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(v: number) => fmtPrice(v)}
              />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }}
                labelFormatter={() => ""}
                formatter={(v) => [fmtPrice(Number(v ?? 0)), sym]}
              />
              <Area type="monotone" dataKey="v" stroke={stroke} strokeWidth={1.8} fill="url(#gmi-inst)" dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No chart data.</div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { k: "Prev close", v: fmtPrice(live?.prevClose) },
          { k: "Day high", v: fmtPrice(live?.dayHigh) },
          { k: "Day low", v: fmtPrice(live?.dayLow) },
          { k: "Volume", v: live?.volume != null ? Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(live.volume) : "—" },
        ].map(({ k, v }) => (
          <div key={k} className="rounded-xl border border-border/50 bg-muted/[0.06] px-3 py-2">
            <div className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">{k}</div>
            <div className="mt-1 font-mono text-sm font-bold tabular-nums text-foreground">{v}</div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground/60">Delayed exchange data via Yahoo · continuous front-month series.</p>
    </Panel>
  );
}

/* ── Cross-asset: normalised performance + correlation matrix ──────────────── */
function pearson(a1: number[], b: number[]): number {
  const n = Math.min(a1.length, b.length);
  if (n < 3) return NaN;
  let ma = 0, mb = 0;
  for (let i = 0; i < n; i++) { ma += a1[i]; mb += b[i]; }
  ma /= n; mb /= n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) { const x = a1[i] - ma, y = b[i] - mb; num += x * y; da += x * x; db += y * y; }
  const den = Math.sqrt(da * db);
  return den ? num / den : NaN;
}

function corrColor(v: number): string {
  if (Number.isNaN(v)) return "var(--muted)";
  const t = Math.min(1, Math.abs(v));
  return v >= 0
    ? `color-mix(in oklch, var(--success) ${Math.round(t * 65)}%, transparent)`
    : `color-mix(in oklch, var(--destructive) ${Math.round(t * 65)}%, transparent)`;
}

function CrossAsset() {
  const [rangeKey, setRangeKey] = useState<string>("3mo");
  const { env } = useGmi<HistoryPayload>(`/api/gmi/history?range=${rangeKey}`, 30 * 60_000);
  const data = env?.data;

  const { normalized, symbols, matrix, totals } = useMemo(() => {
    if (!data) return { normalized: [] as Record<string, number>[], symbols: [] as string[], matrix: [] as number[][], totals: {} as Record<string, number> };
    const syms = data.assets.map((x) => x.symbol);
    const norm = data.dates.map((_, i) => {
      const row: Record<string, number> = { i };
      for (const s of syms) {
        const c = data.closes[s];
        if (c && c[0]) row[s] = (c[i] / c[0]) * 100;
      }
      return row;
    });
    const perf: Record<string, number> = {};
    for (const s of syms) {
      const c = data.closes[s] ?? [];
      if (c.length > 1 && c[0]) perf[s] = ((c[c.length - 1] - c[0]) / c[0]) * 100;
    }
    const returns: Record<string, number[]> = {};
    for (const s of syms) {
      const c = data.closes[s] ?? [];
      const r: number[] = [];
      for (let i = 1; i < c.length; i++) r.push(c[i - 1] ? (c[i] - c[i - 1]) / c[i - 1] : 0);
      returns[s] = r;
    }
    const m = syms.map((x) => syms.map((y) => pearson(returns[x], returns[y])));
    return { normalized: norm, symbols: syms, matrix: m, totals: perf };
  }, [data]);

  return (
    <Panel
      eyebrow="Cross-asset"
      title="Performance & co-movement"
      action={
        <div className="flex items-center gap-2">
          <Segmented options={CROSS_RANGES.map((r) => ({ key: r.key, label: r.label }))} value={rangeKey} onChange={setRangeKey} />
          <DataStatus env={env} showSource={false} />
        </div>
      }
    >
      {!data || symbols.length === 0 ? (
        <Unavailable label="Loading cross-asset data…" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Normalised performance */}
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Normalised · rebased to 100
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={normalized} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.28} />
                  <XAxis dataKey="i" hide />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={40} />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 11 }}
                    labelFormatter={() => ""}
                    formatter={(v, n) => [Number(v ?? 0).toFixed(1), String(n)]}
                  />
                  {symbols.map((s, i) => (
                    <Line key={s} type="monotone" dataKey={s} stroke={PALETTE[i % PALETTE.length]} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* Legend doubles as a return table for the window */}
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
              {symbols.map((s, i) => (
                <span key={s} className="inline-flex items-center gap-1.5 text-[10px]">
                  <span className="h-1.5 w-3 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                  <span className="font-mono font-semibold text-foreground/80">{s}</span>
                  <span className="font-mono tabular-nums" style={{ color: toneFor(totals[s]) }}>{fmtPct(totals[s])}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Correlation matrix */}
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Correlation · daily returns
            </p>
            <div className="overflow-x-auto">
              <table className="border-separate border-spacing-1 font-mono text-[9px]">
                <thead>
                  <tr>
                    <th className="p-1" />
                    {symbols.map((s) => <th key={s} className="p-1 font-semibold text-muted-foreground">{s}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {symbols.map((rowSym, ri) => (
                    <tr key={rowSym}>
                      <td className="p-1 text-right font-semibold text-muted-foreground">{rowSym}</td>
                      {symbols.map((colSym, ci) => {
                        const v = matrix[ri][ci];
                        const self = ri === ci;
                        return (
                          <td
                            key={colSym}
                            className={`h-7 w-7 rounded-md text-center tabular-nums transition-transform duration-150 hover:scale-110 ${self ? "text-muted-foreground/50" : "text-foreground/90"}`}
                            style={{ background: self ? "var(--muted)" : corrColor(v) }}
                            title={`${rowSym} / ${colSym}: ${Number.isNaN(v) ? "—" : v.toFixed(2)}`}
                          >
                            {Number.isNaN(v) ? "" : v.toFixed(1)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2.5 flex items-center gap-3 text-[10px] text-muted-foreground/70">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded-sm" style={{ background: corrColor(1) }} /> move together</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded-sm" style={{ background: corrColor(-1) }} /> move opposite</span>
              <span className="ml-auto">Pearson, window above</span>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}

export function FuturesTab({ quotesEnv }: { quotesEnv: DataEnvelope<Quote[]> | null }) {
  return (
    <div className="space-y-4">
      <InstrumentChart quotesEnv={quotesEnv} />
      <CrossAsset />
    </div>
  );
}
