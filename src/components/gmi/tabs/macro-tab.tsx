"use client";

/**
 * MACRO — rates, the yield curve, real yields & spreads, Fed & liquidity, money
 * supply (all FRED), plus FX and volatility (Yahoo). Every block states its own
 * publication cadence; weekly/monthly series are never dressed up as daily.
 */
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { fmtPrice, fmtPct, fmtBp, toneFor, useGmi, FRESHNESS_LABEL } from "@/lib/gmi/client";
import type { DataEnvelope, Quote, MacroSeries } from "@/lib/gmi/types";
import { Panel, Unavailable } from "../panel";
import { Sparkline } from "../sparkline";

const FX = ["DXY", "EURUSD", "USDJPY", "GBPUSD", "USDCNH", "AUDUSD", "USDCAD", "USDCHF"];
const VOL = ["VIX", "VIX1D", "VVIX"];

function fmtVal(s: MacroSeries): string {
  if (s.value == null) return "—";
  if (s.unit === "%") return `${s.value.toFixed(2)}%`;
  if (s.unit === "bp") return `${Math.round(s.value * 100)} bp`;
  if (s.unit === "$B") {
    const t = s.value / 1000; // value is in billions
    return t >= 1
      ? `$${t.toLocaleString(undefined, { maximumFractionDigits: 2 })}T`
      : `$${s.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}B`;
  }
  return s.value.toLocaleString();
}

function chg(s: MacroSeries, v: number | null | undefined): string {
  if (v == null) return "—";
  return s.unit === "bp" || s.unit === "%" ? fmtBp(s.unit === "%" ? v * 100 : v) : (v > 0 ? "+" : "") + v.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function MacroRow({ s }: { s: MacroSeries }) {
  if (s.status === "unavailable") {
    return (
      <div className="flex items-center justify-between border-b border-border/40 py-2 last:border-0">
        <span className="text-xs text-muted-foreground">{s.label}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-destructive/80">Unavailable</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 border-b border-border/40 py-2 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-foreground">{s.label}</div>
        <div className="text-[9px] uppercase tracking-wider text-muted-foreground/60">{FRESHNESS_LABEL[s.freshness]}</div>
      </div>
      {s.history.length > 1 && <Sparkline data={s.history.map((h) => h.value)} width={64} height={22} />}
      <div className="w-20 text-right">
        <div className="font-mono text-sm font-bold tabular-nums text-foreground">{fmtVal(s)}</div>
        <div className="font-mono text-[10px] tabular-nums" style={{ color: toneFor(s.changeDay) }}>
          {chg(s, s.changeDay)}
        </div>
      </div>
    </div>
  );
}

export function MacroTab({ quotesEnv }: { quotesEnv: DataEnvelope<Quote[]> | null }) {
  const { env } = useGmi<MacroSeries[]>("/api/gmi/macro", 10 * 60_000);
  const series = env?.data ?? [];
  const byId = new Map(series.map((s) => [s.id, s]));
  const q = new Map((quotesEnv?.data ?? []).map((x) => [x.symbol, x]));

  const rates = ["DGS2", "DGS5", "DGS10", "DGS30"].map((id) => byId.get(id)).filter(Boolean) as MacroSeries[];
  const realSpread = ["DFII10", "T10Y2Y", "T10Y3M"].map((id) => byId.get(id)).filter(Boolean) as MacroSeries[];
  const liquidity = ["EFFR", "WALCL", "WRESBAL", "RRPONTSYD", "WTREGEN"].map((id) => byId.get(id)).filter(Boolean) as MacroSeries[];
  const money = ["M1SL", "M2SL"].map((id) => byId.get(id)).filter(Boolean) as MacroSeries[];

  const curve = rates
    .filter((s) => s.value != null)
    .map((s) => ({ mat: s.label.replace("US ", ""), yield: s.value as number }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Treasury yields" env={env}>
          {rates.length === 0 ? <Unavailable /> : rates.map((s) => <MacroRow key={s.id} s={s} />)}
        </Panel>

        <Panel title="Yield curve" env={env}>
          {curve.length > 1 ? (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={curve} margin={{ top: 10, right: 12, left: -14, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                  <XAxis dataKey="mat" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} width={44}
                    tickFormatter={(v: number) => `${v.toFixed(1)}%`} />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    formatter={(v) => [`${Number(v ?? 0).toFixed(2)}%`, "Yield"]}
                  />
                  <Line type="monotone" dataKey="yield" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Unavailable />
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Real yield & spreads" env={env}>
          {realSpread.length === 0 ? <Unavailable /> : realSpread.map((s) => <MacroRow key={s.id} s={s} />)}
        </Panel>
        <Panel title="Fed & liquidity" env={env}>
          {liquidity.length === 0 ? <Unavailable /> : liquidity.map((s) => <MacroRow key={s.id} s={s} />)}
          <div className="mt-2 border-t border-border/40 pt-2">
            {money.map((s) => <MacroRow key={s.id} s={s} />)}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="FX" env={quotesEnv}>
          <div className="grid grid-cols-2 gap-x-4">
            {FX.map((s) => {
              const x = q.get(s);
              return (
                <div key={s} className="flex items-center justify-between border-b border-border/40 py-2">
                  <span className="font-mono text-xs text-foreground">{s}</span>
                  <span className="text-right">
                    <span className="font-mono text-xs font-semibold tabular-nums text-foreground">{fmtPrice(x?.price, x?.unit)}</span>
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
              <div key={s} className="flex items-center justify-between border-b border-border/40 py-2 last:border-0">
                <span className="font-mono text-xs text-foreground">{s}</span>
                {x ? (
                  <span className="text-right">
                    <span className="font-mono text-xs font-semibold tabular-nums text-foreground">{fmtPrice(x.price)}</span>
                    <span className="ml-2 font-mono text-[10px] tabular-nums" style={{ color: toneFor(x.changePct) }}>{fmtPct(x.changePct)}</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Unavailable</span>
                )}
              </div>
            );
          })}
          <p className="mt-2 text-[10px] text-muted-foreground/70">Realized vol and per-instrument option vol require a paid options source.</p>
        </Panel>
      </div>
    </div>
  );
}
