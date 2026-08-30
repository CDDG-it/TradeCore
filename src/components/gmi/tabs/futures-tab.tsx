"use client";

/**
 * FUTURES & CROSS-ASSET — a usable research surface: a full interactive chart for
 * the selected instrument, plus cross-asset tools (normalised performance and a
 * correlation matrix of daily returns). Correlation is a descriptive statistic
 * of past co-movement, never a signal.
 */
import { useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { fmtPrice, fmtPct, toneFor, useGmi } from "@/lib/gmi/client";
import type { DataEnvelope, Quote } from "@/lib/gmi/types";
import type { HistoryPayload } from "@/lib/gmi/history";
import { Panel, Unavailable } from "../panel";
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
];

/* ── Instrument chart ─────────────────────────────────────────────────────── */
function InstrumentChart({ quotesEnv }: { quotesEnv: DataEnvelope<Quote[]> | null }) {
  const [sym, setSym] = useState("NQ");
  const [tf, setTf] = useState(TIMEFRAMES[3]);
  const live = new Map((quotesEnv?.data ?? []).map((x) => [x.symbol, x])).get(sym);
  const { env } = useGmi<Quote>(`/api/gmi/quotes?symbol=${sym}&interval=${tf.interval}&range=${tf.range}`, 60_000);
  const q = env?.data;
  const series = (q?.spark ?? []).map((v, i) => ({ i, v }));

  return (
    <Panel
      title="Instrument"
      action={<DataStatus env={env} showSource={false} />}
    >
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {INSTRUMENTS.map((it) => (
          <button
            key={it.s}
            onClick={() => setSym(it.s)}
            className={`rounded-lg px-2.5 py-1 font-mono text-xs font-semibold transition-colors ${sym === it.s ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:text-foreground"}`}
          >
            {it.s}
          </button>
        ))}
      </div>

      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">{INSTRUMENTS.find((i) => i.s === sym)?.label}</div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold tabular-nums text-foreground">{fmtPrice(live?.price ?? q?.price)}</span>
            <span className="font-mono text-sm font-semibold tabular-nums" style={{ color: toneFor(live?.changePct) }}>{fmtPct(live?.changePct)}</span>
          </div>
        </div>
        <div className="flex rounded-lg border border-border/60 overflow-hidden">
          {TIMEFRAMES.map((t) => (
            <button key={t.key} onClick={() => setTf(t)} className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${tf.key === t.key ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="h-64 w-full">
        {series.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
              <XAxis dataKey="i" hide />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} width={54} tickFormatter={(v: number) => fmtPrice(v)} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} labelFormatter={() => ""} formatter={(v) => [fmtPrice(Number(v ?? 0)), sym]} />
              <Line type="monotone" dataKey="v" stroke="var(--chart-2)" strokeWidth={1.6} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No chart data.</div>}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
        <span>Prev close <b className="font-mono text-foreground">{fmtPrice(live?.prevClose)}</b></span>
        <span>Day high <b className="font-mono text-foreground">{fmtPrice(live?.dayHigh)}</b></span>
        <span>Day low <b className="font-mono text-foreground">{fmtPrice(live?.dayLow)}</b></span>
        <span>Volume <b className="font-mono text-foreground">{live?.volume != null ? live.volume.toLocaleString() : "—"}</b></span>
        <span className="text-muted-foreground/60">Delayed · Yahoo</span>
      </div>
    </Panel>
  );
}

/* ── Cross-asset: normalised performance + correlation matrix ──────────────── */
function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 3) return NaN;
  let ma = 0, mb = 0;
  for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }
  ma /= n; mb /= n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) { const x = a[i] - ma, y = b[i] - mb; num += x * y; da += x * x; db += y * y; }
  const den = Math.sqrt(da * db);
  return den ? num / den : NaN;
}

function corrColor(v: number): string {
  if (Number.isNaN(v)) return "var(--muted)";
  // green for +, red for −, faint near 0.
  const a = Math.min(1, Math.abs(v));
  return v >= 0 ? `color-mix(in oklch, var(--success) ${Math.round(a * 70)}%, transparent)` : `color-mix(in oklch, var(--destructive) ${Math.round(a * 70)}%, transparent)`;
}

function CrossAsset() {
  const [range, setRange] = useState(CROSS_RANGES[1]);
  const { env } = useGmi<HistoryPayload>(`/api/gmi/history?range=${range.key}`, 30 * 60_000);
  const data = env?.data;

  const { normalized, symbols, matrix } = useMemo(() => {
    if (!data) return { normalized: [] as Record<string, number>[], symbols: [] as string[], matrix: [] as number[][] };
    const syms = data.assets.map((a) => a.symbol);
    // Normalised performance rebased to 100.
    const norm = data.dates.map((d, i) => {
      const row: Record<string, number> = { i };
      for (const s of syms) {
        const c = data.closes[s];
        if (c && c[0]) row[s] = (c[i] / c[0]) * 100;
      }
      return row;
    });
    // Daily returns → correlation matrix.
    const returns: Record<string, number[]> = {};
    for (const s of syms) {
      const c = data.closes[s] ?? [];
      const r: number[] = [];
      for (let i = 1; i < c.length; i++) r.push(c[i - 1] ? (c[i] - c[i - 1]) / c[i - 1] : 0);
      returns[s] = r;
    }
    const m = syms.map((a) => syms.map((b) => pearson(returns[a], returns[b])));
    return { normalized: norm, symbols: syms, matrix: m };
  }, [data]);

  return (
    <Panel
      title="Cross-asset"
      action={
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border/60 overflow-hidden">
            {CROSS_RANGES.map((r) => (
              <button key={r.key} onClick={() => setRange(r)} className={`px-2 py-1 text-[11px] font-semibold transition-colors ${range.key === r.key ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>{r.label}</button>
            ))}
          </div>
          <DataStatus env={env} showSource={false} />
        </div>
      }
    >
      {!data || symbols.length === 0 ? (
        <Unavailable label="Loading cross-asset data…" />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Normalised performance */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Normalised performance (rebased 100)</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={normalized} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                  <XAxis dataKey="i" hide />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} width={40} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} labelFormatter={() => ""} formatter={(v, n) => [Number(v ?? 0).toFixed(1), String(n)]} />
                  <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
                  {symbols.map((s, i) => (
                    <Line key={s} type="monotone" dataKey={s} stroke={PALETTE[i % PALETTE.length]} strokeWidth={1.4} dot={false} isAnimationActive={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Correlation matrix */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Correlation matrix · daily returns</p>
            <div className="overflow-x-auto">
              <table className="border-separate border-spacing-0.5 font-mono text-[9px]">
                <thead>
                  <tr>
                    <th className="p-1"></th>
                    {symbols.map((s) => <th key={s} className="p-1 text-muted-foreground">{s}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {symbols.map((rowSym, ri) => (
                    <tr key={rowSym}>
                      <td className="p-1 text-right font-semibold text-muted-foreground">{rowSym}</td>
                      {symbols.map((colSym, ci) => {
                        const v = matrix[ri][ci];
                        return (
                          <td key={colSym} className="h-6 w-6 rounded text-center tabular-nums text-foreground/90" style={{ background: corrColor(v) }} title={`${rowSym}/${colSym}: ${Number.isNaN(v) ? "—" : v.toFixed(2)}`}>
                            {Number.isNaN(v) ? "" : v.toFixed(1)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground/70">Pearson correlation of daily returns over the window. Green = move together, red = move opposite. Descriptive only.</p>
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
