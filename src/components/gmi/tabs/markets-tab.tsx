"use client";

/**
 * MARKETS — Macro and World merged into one compact surface. A clickable globe
 * pinned with the major economies and their 10Y government-bond yields, the US
 * curve and rates ladder, Fed & liquidity, FX and volatility. Every block states
 * its own cadence (yields are OECD monthly; US rates daily; liquidity weekly).
 * Objective only — no interpretation.
 */
import dynamic from "next/dynamic";
import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { fmtPrice, fmtPct, toneFor, useGmi, FRESHNESS_LABEL, timeAgo } from "@/lib/gmi/client";
import type { DataEnvelope, Quote, MacroSeries } from "@/lib/gmi/types";
import type { GlobalYield } from "@/lib/gmi/global-yields";
import type { GlobeMarker } from "@/components/news-city/WorldMap3D";
import { Panel, Unavailable } from "../panel";
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

function MiniRow({ label, value, tone, freshness, spark }: { label: string; value: string; tone?: string; freshness?: string; spark?: number[] }) {
  return (
    <div className="flex items-center gap-3 border-b border-border/40 py-1.5 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-foreground">{label}</div>
        {freshness && <div className="text-[9px] uppercase tracking-wider text-muted-foreground/60">{freshness}</div>}
      </div>
      {spark && spark.length > 1 && <Sparkline data={spark} width={56} height={20} />}
      <span className="w-20 text-right font-mono text-sm font-semibold tabular-nums" style={{ color: tone ?? "var(--foreground)" }}>{value}</span>
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
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Panel title="Global map" action={<span className="text-[10px] text-muted-foreground/70">Click a pin</span>}>
          <div className="relative w-full overflow-hidden rounded-xl" style={{ height: "clamp(340px, 52vh, 560px)", background: "#0b1120" }}>
            <WorldMap3D markers={markers} selected={selected} onSelect={setSelected} />
            {sel && (
              <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-border/60 bg-card/90 px-3 py-2 backdrop-blur">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span>{sel.flag}</span> {sel.country}
                </div>
                <div className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                  10Y {sel.value != null ? `${sel.value.toFixed(2)}%` : "—"}
                  {sel.fxSymbol && q.get(sel.fxSymbol) && <> · {sel.fxSymbol} {fmtPrice(q.get(sel.fxSymbol)!.price)}</>}
                </div>
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Global 10Y yields" env={gyEnv}>
          {yields.length === 0 ? (
            <Unavailable label="Loading yields…" />
          ) : (
            <>
              <div className="overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/60 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <th className="py-1.5 font-semibold">Economy</th>
                      <th className="py-1.5 text-right font-semibold">10Y</th>
                      <th className="py-1.5 text-right font-semibold">Δ 1m</th>
                      <th className="py-1.5 pl-2 text-right font-semibold">FX</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yields.map((y) => {
                      const d = y.value != null && y.prev != null ? y.value - y.prev : null;
                      const fx = y.fxSymbol ? q.get(y.fxSymbol) : undefined;
                      const isSel = y.id === selected;
                      return (
                        <tr
                          key={y.id}
                          onClick={() => setSelected(y.id)}
                          className={`cursor-pointer border-b border-border/40 transition-colors last:border-0 ${isSel ? "bg-primary/10" : "hover:bg-muted/20"}`}
                        >
                          <td className="py-1.5"><span className="mr-1.5">{y.flag}</span><span className="text-foreground">{y.country}</span></td>
                          <td className="py-1.5 text-right font-mono font-semibold tabular-nums text-foreground">{y.value != null ? `${y.value.toFixed(2)}%` : "—"}</td>
                          <td className="py-1.5 text-right font-mono tabular-nums" style={{ color: toneFor(d) }}>{d == null ? "—" : `${d > 0 ? "+" : ""}${(d * 100).toFixed(0)}bp`}</td>
                          <td className="py-1.5 pl-2 text-right font-mono tabular-nums" style={{ color: toneFor(fx?.changePct) }}>{fx ? fmtPct(fx.changePct) : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground/70">
                OECD harmonised 10Y, {FRESHNESS_LABEL.monthly.toLowerCase()} · {gyEnv?.asOf ? timeAgo(gyEnv.asOf) : "—"}. FX is live (delayed).
              </p>
            </>
          )}
        </Panel>
      </div>

      {/* US curve + rates + liquidity + fx/vol */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="US Treasury curve" env={macroEnv}>
          {usCurve.length > 1 ? (
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={usCurve} margin={{ top: 10, right: 12, left: -14, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                  <XAxis dataKey="mat" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} width={44} tickFormatter={(v: number) => `${v.toFixed(1)}%`} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${Number(v ?? 0).toFixed(2)}%`, "Yield"]} />
                  <Line type="monotone" dataKey="yield" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <Unavailable />}
          <div className="mt-2">
            {rates.map((s) => <MiniRow key={s.id} label={s.label} value={macroVal(s)} tone={s.id.startsWith("T10Y") ? toneFor(s.value) : undefined} freshness={FRESHNESS_LABEL[s.freshness]} spark={s.history.map((h) => h.value)} />)}
          </div>
        </Panel>

        <Panel title="Fed & liquidity" env={macroEnv}>
          {liquidity.length === 0 ? <Unavailable /> : liquidity.map((s) => <MiniRow key={s.id} label={s.label} value={macroVal(s)} freshness={FRESHNESS_LABEL[s.freshness]} spark={s.history.map((h) => h.value)} />)}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="FX" env={quotesEnv}>
          <div className="grid grid-cols-2 gap-x-4">
            {FX.map((s) => {
              const x = q.get(s);
              return (
                <div key={s} className="flex items-center justify-between border-b border-border/40 py-1.5">
                  <span className="font-mono text-xs text-foreground">{s}</span>
                  <span className="text-right">
                    <span className="font-mono text-xs font-semibold tabular-nums text-foreground">{fmtPrice(x?.price)}</span>
                    <span className="ml-2 font-mono text-[10px] tabular-nums" style={{ color: toneFor(x?.changePct) }}>{fmtPct(x?.changePct)}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel title="Volatility" env={quotesEnv}>
          {VOL.map((s) => {
            const x = q.get(s);
            return (
              <div key={s} className="flex items-center justify-between border-b border-border/40 py-1.5 last:border-0">
                <span className="font-mono text-xs text-foreground">{s}</span>
                {x ? (
                  <span className="text-right">
                    <span className="font-mono text-xs font-semibold tabular-nums text-foreground">{fmtPrice(x.price)}</span>
                    <span className="ml-2 font-mono text-[10px] tabular-nums" style={{ color: toneFor(x.changePct) }}>{fmtPct(x.changePct)}</span>
                  </span>
                ) : <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Unavailable</span>}
              </div>
            );
          })}
          <p className="mt-2 text-[10px] text-muted-foreground/70">Realized vol and per-instrument option vol require a paid options source.</p>
        </Panel>
      </div>
    </div>
  );
}
