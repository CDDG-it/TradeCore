"use client";

/**
 * 03 FUTURES — one contract on the glass, the rest of the board beside it.
 *
 * The chart is the pane, not a card inside one. Cross-asset behaviour is read
 * as a ranking and a grid rather than a tangle of overlaid lines: how much each
 * market moved over the window, and how tightly they moved together.
 * Correlation is a description of the past, never a signal.
 */
import { useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { fmtPrice, fmtPct, toneFor, useGmi } from "@/lib/gmi/client";
import type { Quote } from "@/lib/gmi/types";
import type { HistoryPayload } from "@/lib/gmi/history";
import { Pane, Empty, Label, Meta, Switch, Delta, Figure, a } from "../pane";

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

const CROSS_RANGES = [
  { key: "1mo", label: "1M" }, { key: "3mo", label: "3M" }, { key: "6mo", label: "6M" }, { key: "1y", label: "1Y" },
];

/* ── Cross-asset maths ────────────────────────────────────────────────────── */
function pearson(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return NaN;
  let mx = 0, my = 0;
  for (let i = 0; i < n; i++) { mx += x[i]; my += y[i]; }
  mx /= n; my /= n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) { const p = x[i] - mx, q = y[i] - my; num += p * q; dx += p * p; dy += q * q; }
  const den = Math.sqrt(dx * dy);
  return den ? num / den : NaN;
}

function corrShade(v: number): string {
  if (Number.isNaN(v)) return "transparent";
  const t = Math.min(1, Math.abs(v));
  return v >= 0
    ? `color-mix(in oklch, var(--success) ${Math.round(t * 55)}%, transparent)`
    : `color-mix(in oklch, var(--destructive) ${Math.round(t * 55)}%, transparent)`;
}

export function FuturesTab() {
  const { env: quotesEnv } = useGmi<Quote[]>("/api/gmi/quotes", 60_000);
  const [sym, setSym] = useState("NQ");
  const [tfKey, setTfKey] = useState("1D");
  const tf = TIMEFRAMES.find((t) => t.key === tfKey) ?? TIMEFRAMES[3];
  const { env: seriesEnv } = useGmi<Quote>(`/api/gmi/quotes?symbol=${sym}&interval=${tf.interval}&range=${tf.range}`, 60_000);

  const live = new Map((quotesEnv?.data ?? []).map((x) => [x.symbol, x])).get(sym);
  const series = (seriesEnv?.data?.spark ?? []).map((v, i) => ({ i, v }));
  const up = (live?.changePct ?? 0) >= 0;
  const stroke = up ? "var(--success)" : "var(--destructive)";

  const [rangeKey, setRangeKey] = useState("3mo");
  const { env: histEnv } = useGmi<HistoryPayload>(`/api/gmi/history?range=${rangeKey}`, 30 * 60_000);

  const { symbols, matrix, perf } = useMemo(() => {
    const data = histEnv?.data;
    if (!data) return { symbols: [] as string[], matrix: [] as number[][], perf: {} as Record<string, number> };
    const syms = data.assets.map((x) => x.symbol);
    const returns: Record<string, number[]> = {};
    const totals: Record<string, number> = {};
    for (const s of syms) {
      const c = data.closes[s] ?? [];
      const r: number[] = [];
      for (let i = 1; i < c.length; i++) r.push(c[i - 1] ? (c[i] - c[i - 1]) / c[i - 1] : 0);
      returns[s] = r;
      if (c.length > 1 && c[0]) totals[s] = ((c[c.length - 1] - c[0]) / c[0]) * 100;
    }
    return { symbols: syms, matrix: syms.map((x) => syms.map((y) => pearson(returns[x], returns[y]))), perf: totals };
  }, [histEnv]);

  const ranked = [...symbols].sort((x, y) => (perf[y] ?? 0) - (perf[x] ?? 0));
  const maxAbs = Math.max(1, ...symbols.map((s) => Math.abs(perf[s] ?? 0)));

  // Day range — where the last print sits between the session's extremes.
  const lo = live?.dayLow, hi = live?.dayHigh, px = live?.price;
  const pos = lo != null && hi != null && px != null && hi > lo ? Math.min(1, Math.max(0, (px - lo) / (hi - lo))) : null;

  return (
    <div className="grid grid-cols-1 gap-2 lg:h-full lg:min-h-0 lg:grid-cols-12">
      {/* ── Board ─────────────────────────────────────────────────────── */}
      {/* The board is one column on a laptop; on a phone the same contracts
          tile two-up, so picking one costs no scrolling. */}
      <Pane index="01" label="Board" bodyClassName="grid grid-cols-2 p-0 sm:grid-cols-3 lg:block" scroll className="lg:col-span-2">
        {INSTRUMENTS.map((it) => {
          const q = new Map((quotesEnv?.data ?? []).map((x) => [x.symbol, x])).get(it.s);
          const on = it.s === sym;
          return (
            <button
              key={it.s}
              onClick={() => setSym(it.s)}
              className={`flex w-full items-baseline justify-between gap-2 border-b border-border/20 px-3 py-[9px] text-left transition-colors ${
                on ? "bg-primary/[0.09]" : "hover:bg-muted/20"
              }`}
            >
              <span className="min-w-0">
                <span className={`block font-mono text-[12px] font-bold tracking-[0.1em] ${on ? "text-primary" : "text-foreground/85"}`}>{it.s}</span>
                <span className="block truncate text-[11px] text-foreground/75">{it.label}</span>
              </span>
              <Delta value={q?.changePct} />
            </button>
          );
        })}
      </Pane>

      {/* ── Chart ─────────────────────────────────────────────────────── */}
      <Pane
        index="02"
        label={INSTRUMENTS.find((i) => i.s === sym)?.label ?? sym}
        right={
          <span className="flex items-center gap-4">
            <Switch options={TIMEFRAMES.map((t) => ({ key: t.key, label: t.label }))} value={tfKey} onChange={setTfKey} />
            <Meta env={seriesEnv} />
          </span>
        }
        bodyClassName="flex flex-col p-0"
        className="min-h-[400px] lg:col-span-7 lg:min-h-[320px]"
      >
        {/* Reading line: price, move, and where in the day's range it sits */}
        <div className="flex shrink-0 flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-border/30 px-3 py-2">
          <Figure
            size="lg"
            value={fmtPrice(live?.price ?? seriesEnv?.data?.price)}
            unit={sym}
            delta={
              <span className="ml-1 flex items-baseline gap-2">
                <Delta value={live?.changePct} className="text-[13px]" />
                <span className="text-[12px] tabular-nums text-foreground/75">
                  {live?.change == null ? "" : `${live.change > 0 ? "+" : ""}${fmtPrice(live.change)}`}
                </span>
              </span>
            }
          />
          {pos != null && (
            <div className="w-[210px]">
              <div className="relative h-[3px] bg-border/60">
                <span className="absolute -top-[3px] h-[9px] w-[2px] bg-primary" style={{ left: `calc(${(pos * 100).toFixed(1)}% - 1px)` }} />
              </div>
              <div className="mt-1 flex justify-between text-[11px] font-semibold uppercase tracking-wider text-foreground/65">
                <span>L {fmtPrice(lo)}</span>
                <span>day range</span>
                <span>H {fmtPrice(hi)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 p-1">
          {series.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 10, right: 8, left: -6, bottom: 0 }}>
                <defs>
                  <linearGradient id="gmi-inst" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={stroke} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" opacity={0.3} />
                <XAxis dataKey="i" hide />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={52} tickFormatter={(v: number) => fmtPrice(v)} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 2, fontSize: 11 }} labelFormatter={() => ""} formatter={(v) => [fmtPrice(Number(v ?? 0)), sym]} />
                <Area type="monotone" dataKey="v" stroke={stroke} strokeWidth={1.5} fill="url(#gmi-inst)" dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Empty label="No chart data" />
          )}
        </div>

        <div className="grid shrink-0 grid-cols-2 divide-x divide-border/30 border-t border-border/30 sm:grid-cols-4">
          {[
            { k: "Prev close", v: fmtPrice(live?.prevClose) },
            { k: "Day high", v: fmtPrice(live?.dayHigh) },
            { k: "Day low", v: fmtPrice(live?.dayLow) },
            { k: "Volume", v: live?.volume != null ? Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(live.volume) : "—" },
          ].map(({ k, v }) => (
            <div key={k} className="px-3 py-1.5">
              <Label className="block">{k}</Label>
              <span className="mt-0.5 block text-[14px] font-bold tabular-nums text-foreground">{v}</span>
            </div>
          ))}
        </div>
      </Pane>

      {/* ── Cross-asset ───────────────────────────────────────────────── */}
      <Pane
        index="03"
        label="Cross-asset"
        right={<Switch options={CROSS_RANGES} value={rangeKey} onChange={setRangeKey} />}
        bodyClassName="flex flex-col p-0"
        className="min-h-[420px] lg:col-span-3"
      >
        {symbols.length === 0 ? (
          <Empty label="Loading" />
        ) : (
          <>
            {/* Ranked move over the window — a leaderboard, not a tangle of lines */}
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
              <Label className="mb-1.5 block">Move over {CROSS_RANGES.find((r) => r.key === rangeKey)?.label}</Label>
              {ranked.map((s) => {
                const v = perf[s] ?? 0;
                const w = (Math.abs(v) / maxAbs) * 50; // half-width bars, centred
                return (
                  <div key={s} className="flex items-center gap-2 py-[3px]">
                    <span className="w-11 shrink-0 font-mono text-[11px] tracking-wider text-foreground/85">{s}</span>
                    <span className="relative h-[7px] flex-1 border-x border-border/30">
                      <span aria-hidden className="absolute inset-y-0 left-1/2 w-px bg-border/60" />
                      <span
                        className="absolute inset-y-0"
                        style={{
                          left: v >= 0 ? "50%" : `${50 - w}%`,
                          width: `${w}%`,
                          background: v >= 0 ? a("var(--success)", 70) : a("var(--destructive)", 70),
                        }}
                      />
                    </span>
                    <span className="w-12 shrink-0 text-right text-[12px] tabular-nums" style={{ color: toneFor(v) }}>
                      {fmtPct(v)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* How tightly they moved together */}
            <div className="shrink-0 border-t border-border/30 px-3 py-2">
              <Label className="mb-1.5 block">Correlation · daily returns</Label>
              <div className="overflow-x-auto">
                <table className="border-separate border-spacing-[2px] font-mono text-[10px]">
                  <tbody>
                    {symbols.map((rowSym, ri) => (
                      <tr key={rowSym}>
                        <td className="pr-1 text-right text-[10px] tracking-wider text-foreground/75">{rowSym}</td>
                        {symbols.map((colSym, ci) => {
                          const v = matrix[ri][ci];
                          const self = ri === ci;
                          return (
                            <td
                              key={colSym}
                              className="h-[18px] w-[18px] text-center align-middle"
                              style={{ background: self ? a("var(--muted-foreground)", 14) : corrShade(v) }}
                              title={`${rowSym} / ${colSym}: ${Number.isNaN(v) ? "—" : v.toFixed(2)}`}
                            />
                          );
                        })}
                      </tr>
                    ))}
                    <tr>
                      <td />
                      {symbols.map((s) => (
                        <td key={s} className="pt-0.5 text-center text-[11px] tracking-wider text-foreground/75">{s.slice(0, 2)}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-1.5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-foreground/65">
                <span className="flex items-center gap-1"><span className="h-2 w-3" style={{ background: corrShade(1) }} /> together</span>
                <span className="flex items-center gap-1"><span className="h-2 w-3" style={{ background: corrShade(-1) }} /> opposite</span>
              </div>
            </div>
          </>
        )}
      </Pane>
    </div>
  );
}
