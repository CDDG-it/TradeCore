"use client";

/**
 * MARKETS — the world in one surface. A clickable globe pinned with the major
 * economies and their 10Y government-bond yields, the US curve and rates
 * ladder, Fed & liquidity, FX and volatility. Every block states its own
 * cadence (yields are OECD monthly; US rates daily; liquidity weekly).
 * Objective only — no interpretation.
 */
import dynamic from "next/dynamic";
import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { fmtPrice, fmtPct, toneFor, useGmi, FRESHNESS_LABEL, timeAgo } from "@/lib/gmi/client";
import type { DataEnvelope, Quote, MacroSeries } from "@/lib/gmi/types";
import type { GlobalYield } from "@/lib/gmi/global-yields";
import type { GlobeMarker } from "@/components/news-city/WorldMap3D";
import { Panel, Unavailable, ChangeChip, DataRow, a } from "../panel";
import { Sparkline } from "../sparkline";

const WorldMap3D = dynamic(
  () => import("@/components/news-city/WorldMap3D").then((m) => m.WorldMap3D),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center text-sm text-muted-foreground animate-pulse">Spinning up the globe…</div> }
);

const FX = ["DXY", "EURUSD", "USDJPY", "GBPUSD", "USDCNH", "AUDUSD", "USDCAD", "USDCHF"];
const VOL = ["VIX", "VIX1D", "VVIX"];

function macroVal(s: MacroSeries): string {
  if (s.value == null) return "—";
  if (s.unit === "%") return `${s.value.toFixed(2)}%`;
  if (s.unit === "bp") return `${Math.round(s.value * 100)} bp`;
  if (s.unit === "$B") {
    const t = s.value / 1000;
    return t >= 1 ? `$${t.toLocaleString(undefined, { maximumFractionDigits: 2 })}T` : `$${s.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}B`;
  }
  return s.value.toLocaleString();
}

/** A price tile — used for both FX and volatility so the two read as one grid. */
function QuoteTile({ symbol, q }: { symbol: string; q: Quote | undefined }) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/[0.06] px-3 py-2 transition-colors hover:border-border">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-bold tracking-wide text-muted-foreground">{symbol}</span>
        {q ? <ChangeChip pct={q.changePct} /> : <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50">n/a</span>}
      </div>
      <div className="mt-1.5 font-mono text-sm font-bold tabular-nums text-foreground">{fmtPrice(q?.price, q?.unit)}</div>
    </div>
  );
}

export function MarketsTab({ quotesEnv }: { quotesEnv: DataEnvelope<Quote[]> | null }) {
  const { env: macroEnv } = useGmi<MacroSeries[]>("/api/gmi/macro", 10 * 60_000);
  const { env: gyEnv } = useGmi<GlobalYield[]>("/api/gmi/global-yields", 6 * 60 * 60_000);
  const [selected, setSelected] = useState<string | null>("us");

  const q = new Map((quotesEnv?.data ?? []).map((x) => [x.symbol, x]));
  const byId = new Map((macroEnv?.data ?? []).map((s) => [s.id, s]));
  const yields = gyEnv?.data ?? [];
  const sel = yields.find((y) => y.id === selected) ?? null;
  const maxYield = Math.max(1, ...yields.map((y) => y.value ?? 0));

  const markers: GlobeMarker[] = yields
    .filter((y) => y.status === "ok")
    .map((y) => ({ id: y.id, lat: y.lat, lon: y.lon, label: y.country }));

  const usCurve = ["DGS2", "DGS5", "DGS10", "DGS30"]
    .map((id) => byId.get(id))
    .filter((s): s is MacroSeries => Boolean(s?.value != null))
    .map((s) => ({ mat: s.label.replace("US ", ""), yield: s.value as number }));

  const rates = ["DGS2", "DGS5", "DGS10", "DGS30", "DFII10", "T10Y2Y"].map((id) => byId.get(id)).filter(Boolean) as MacroSeries[];
  const liquidity = ["EFFR", "WALCL", "WRESBAL", "RRPONTSYD", "WTREGEN", "M2SL"].map((id) => byId.get(id)).filter(Boolean) as MacroSeries[];

  return (
    <div className="space-y-4">
      {/* Globe + global yields */}
      <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <Panel
          eyebrow="World"
          title="Sovereign yields, mapped"
          accent="cyan"
          bodyClassName="px-3 pb-3"
          action={<span className="text-[10px] text-muted-foreground/70">Click a pin</span>}
        >
          <div className="relative w-full overflow-hidden rounded-xl border border-border/40" style={{ height: "clamp(340px, 52vh, 560px)", background: "#0b1120" }}>
            <WorldMap3D markers={markers} selected={selected} onSelect={setSelected} />

            {/* Selected economy — the one readout that follows the globe */}
            {sel && (
              <div className="pointer-events-none absolute left-3 top-3 min-w-44 rounded-xl border border-border/60 bg-card/85 p-3 backdrop-blur-md">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="text-base leading-none">{sel.flag}</span> {sel.country}
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-bold leading-none tabular-nums text-foreground">
                    {sel.value != null ? `${sel.value.toFixed(2)}%` : "—"}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">10Y</span>
                </div>
                {sel.value != null && sel.prev != null && (
                  <div className="mt-1 font-mono text-[11px] font-semibold tabular-nums" style={{ color: toneFor(sel.value - sel.prev) }}>
                    {sel.value - sel.prev > 0 ? "+" : ""}{((sel.value - sel.prev) * 100).toFixed(0)} bp · 1m
                  </div>
                )}
                {sel.fxSymbol && q.get(sel.fxSymbol) && (
                  <div className="mt-2 border-t border-border/40 pt-2 font-mono text-[11px] tabular-nums text-muted-foreground">
                    {sel.fxSymbol} <span className="text-foreground">{fmtPrice(q.get(sel.fxSymbol)!.price)}</span>
                    <span className="ml-1.5" style={{ color: toneFor(q.get(sel.fxSymbol)!.changePct) }}>{fmtPct(q.get(sel.fxSymbol)!.changePct)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </Panel>

        <Panel eyebrow="Rates" title="Global 10Y yields" env={gyEnv} className="flex h-full flex-col" bodyClassName="flex min-h-0 flex-1 flex-col">
          {yields.length === 0 ? (
            <Unavailable label="Loading yields…" />
          ) : (
            <>
              <div className="-mx-1 min-h-0 flex-1 space-y-px overflow-y-auto px-1">
                {yields.map((y) => {
                  const d = y.value != null && y.prev != null ? y.value - y.prev : null;
                  const fx = y.fxSymbol ? q.get(y.fxSymbol) : undefined;
                  const isSel = y.id === selected;
                  return (
                    <button
                      key={y.id}
                      onClick={() => setSelected(y.id)}
                      className={`relative w-full overflow-hidden rounded-lg px-2 py-1.5 text-left transition-colors ${isSel ? "bg-primary/[0.12]" : "hover:bg-muted/20"}`}
                    >
                      {/* Relative-yield bar — the row's own value against the widest in the set */}
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-y-0 left-0 transition-[width] duration-500"
                        style={{ width: `${((y.value ?? 0) / maxYield) * 100}%`, background: a("var(--chart-2)", isSel ? 14 : 8) }}
                      />
                      <span className="relative flex items-center gap-2">
                        <span className="text-sm leading-none">{y.flag}</span>
                        <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">{y.country}</span>
                        <span className="w-14 text-right font-mono text-xs font-bold tabular-nums text-foreground">
                          {y.value != null ? `${y.value.toFixed(2)}%` : "—"}
                        </span>
                        <span className="w-14 text-right font-mono text-[10px] font-semibold tabular-nums" style={{ color: toneFor(d) }}>
                          {d == null ? "—" : `${d > 0 ? "+" : ""}${(d * 100).toFixed(0)}bp`}
                        </span>
                        <span className="w-14 text-right font-mono text-[10px] tabular-nums" style={{ color: toneFor(fx?.changePct) }}>
                          {fx ? fmtPct(fx.changePct) : "—"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 border-t border-border/40 pt-2 text-[10px] text-muted-foreground/70">
                <span>OECD harmonised 10Y · {FRESHNESS_LABEL.monthly.toLowerCase()} · {gyEnv?.asOf ? timeAgo(gyEnv.asOf) : "—"}</span>
                <span>Δ 1m · FX delayed</span>
              </div>
            </>
          )}
        </Panel>
      </div>

      {/* US curve + rates + liquidity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel eyebrow="United States" title="Treasury curve" env={macroEnv}>
          {usCurve.length > 1 ? (
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={usCurve} margin={{ top: 10, right: 12, left: -14, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gmi-curve" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                  <XAxis dataKey="mat" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => `${v.toFixed(1)}%`} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} formatter={(v) => [`${Number(v ?? 0).toFixed(2)}%`, "Yield"]} />
                  <Area type="monotone" dataKey="yield" stroke="var(--chart-1)" strokeWidth={2} fill="url(#gmi-curve)" dot={{ r: 3, fill: "var(--chart-1)" }} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : <Unavailable />}
          <div className="mt-3">
            {rates.map((s) => (
              <DataRow
                key={s.id}
                label={s.label}
                sub={FRESHNESS_LABEL[s.freshness]}
                value={macroVal(s)}
                tone={s.id.startsWith("T10Y") ? toneFor(s.value) : undefined}
                trailing={s.history.length > 1 ? <Sparkline data={s.history.map((h) => h.value)} width={56} height={20} /> : undefined}
              />
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Policy" title="Fed & liquidity" env={macroEnv}>
          {liquidity.length === 0 ? <Unavailable /> : liquidity.map((s) => (
            <DataRow
              key={s.id}
              label={s.label}
              sub={FRESHNESS_LABEL[s.freshness]}
              value={macroVal(s)}
              trailing={s.history.length > 1 ? <Sparkline data={s.history.map((h) => h.value)} width={56} height={20} /> : undefined}
            />
          ))}
        </Panel>
      </div>

      {/* FX + volatility */}
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel eyebrow="Currencies" title="FX" env={quotesEnv}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {FX.map((s) => <QuoteTile key={s} symbol={s} q={q.get(s)} />)}
          </div>
        </Panel>
        <Panel eyebrow="Risk" title="Volatility" env={quotesEnv}>
          <div className="grid grid-cols-3 gap-2">
            {VOL.map((s) => <QuoteTile key={s} symbol={s} q={q.get(s)} />)}
          </div>
          <p className="mt-2.5 text-[10px] leading-relaxed text-muted-foreground/70">
            Realized vol and per-instrument option vol require a paid options source — left out rather than estimated.
          </p>
        </Panel>
      </div>
    </div>
  );
}
