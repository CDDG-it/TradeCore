"use client";

/**
 * 02 MARKETS — the macro frame: what the world's sovereign debt yields, the
 * shape of the US curve, what the Fed's balance sheet is doing, and where the
 * dollar and volatility sit.
 *
 * Cadences genuinely differ and are stated per pane: OECD harmonised yields are
 * monthly, US constant maturities daily, balance-sheet series weekly, FX and
 * volatility delayed quotes. A country is its ISO code — no flags, no ornament.
 */
import dynamic from "next/dynamic";
import { useMemo, useState, useSyncExternalStore } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { fmtPrice, toneFor, useGmi, timeAgo } from "@/lib/gmi/client";
import type { Quote, MacroSeries } from "@/lib/gmi/types";
import type { GlobalYield } from "@/lib/gmi/global-yields";
import type { GlobeMarker } from "@/components/news-city/WorldMap3D";
import { Pane, Empty, Field, Label, Meta, Switch, Delta, a } from "../pane";
import { Sparkline } from "../sparkline";

const WorldMap3D = dynamic(
  () => import("@/components/news-city/WorldMap3D").then((m) => m.WorldMap3D),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center"><Label>Loading globe</Label></div> }
);

const FX = ["DXY", "EURUSD", "USDJPY", "GBPUSD", "AUDUSD", "USDCAD", "USDCHF", "USDCNH"];
const VOL = ["VIX", "VIX1D", "VVIX"];

const SORTS = [
  { key: "yield", label: "Yield" },
  { key: "change", label: "Δ1m" },
  { key: "spread", label: "vs US" },
];

/** Short forms, so a rate fits a narrow column without wrapping. */
const RATE_LABEL: Record<string, string> = {
  DGS2: "2Y", DGS5: "5Y", DGS10: "10Y", DGS30: "30Y", DFII10: "10Y real", T10Y2Y: "2s10s",
};

function macroVal(s: MacroSeries): string {
  if (s.value == null) return "—";
  if (s.unit === "%") return `${s.value.toFixed(2)}%`;
  if (s.unit === "bp") return `${Math.round(s.value * 100)}bp`;
  if (s.unit === "$B") {
    const t = s.value / 1000;
    return t >= 1 ? `$${t.toLocaleString(undefined, { maximumFractionDigits: 2 })}T` : `$${s.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}B`;
  }
  return s.value.toLocaleString();
}

const bp = (v: number | null) => (v == null ? "—" : `${v > 0 ? "+" : ""}${(v * 100).toFixed(0)}bp`);

/**
 * True once the viewport is at least `px` wide. Used to keep the globe — and
 * three.js with it — off phones entirely rather than merely hidden: at 375px a
 * spinning world under a readout card is decoration you pay megabytes for.
 */
function useWide(px = 640) {
  const query = `(min-width:${px}px)`;
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}

export function MarketsTab() {
  const { env: quotesEnv } = useGmi<Quote[]>("/api/gmi/quotes", 60_000);
  const { env: macroEnv } = useGmi<MacroSeries[]>("/api/gmi/macro", 10 * 60_000);
  const { env: gyEnv } = useGmi<GlobalYield[]>("/api/gmi/global-yields", 6 * 60 * 60_000);
  const [selected, setSelected] = useState<string | null>("us");
  const [sort, setSort] = useState("yield");
  const wide = useWide();

  const q = new Map((quotesEnv?.data ?? []).map((x) => [x.symbol, x]));
  const byId = new Map((macroEnv?.data ?? []).map((s) => [s.id, s]));
  const yields = useMemo(() => gyEnv?.data ?? [], [gyEnv]);
  const sel = yields.find((y) => y.id === selected) ?? null;
  const us = yields.find((y) => y.id === "us") ?? null;

  const rows = useMemo(() => {
    const derived = yields.map((y) => ({
      y,
      change: y.value != null && y.prev != null ? y.value - y.prev : null,
      spread: y.value != null && us?.value != null ? y.value - us.value : null,
    }));
    const rank = (v: number | null) => (v == null ? -Infinity : v);
    return derived.sort((m, n) =>
      sort === "yield" ? rank(n.y.value) - rank(m.y.value)
      : sort === "change" ? rank(n.change) - rank(m.change)
      : rank(n.spread) - rank(m.spread)
    );
  }, [yields, us, sort]);

  const maxYield = Math.max(1, ...yields.map((y) => y.value ?? 0));

  const markers: GlobeMarker[] = yields
    .filter((y) => y.status === "ok")
    .map((y) => ({ id: y.id, lat: y.lat, lon: y.lon, label: y.country }));

  const curve = ["DGS2", "DGS5", "DGS10", "DGS30"]
    .map((id) => byId.get(id))
    .filter((s): s is MacroSeries => Boolean(s?.value != null))
    .map((s) => ({ mat: RATE_LABEL[s.id] ?? s.label, yield: s.value as number }));

  const rates = ["DGS2", "DGS5", "DGS10", "DGS30", "DFII10", "T10Y2Y"].map((id) => byId.get(id)).filter(Boolean) as MacroSeries[];
  const liquidity = ["EFFR", "WALCL", "WRESBAL", "RRPONTSYD", "WTREGEN", "M2SL"].map((id) => byId.get(id)).filter(Boolean) as MacroSeries[];

  return (
    <div className="flex min-h-full flex-col gap-2 lg:h-full lg:min-h-0">
      {/* ── World ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-2 lg:min-h-0 lg:flex-1 lg:grid-cols-12">
        <Pane
          index="01"
          label="Sovereign yields, mapped"
          right={<Label className="hidden tracking-[0.18em] sm:inline">select an economy</Label>}
          bodyClassName="p-0"
          className="sm:min-h-[260px] lg:col-span-7"
        >
          {/* On a phone the pane is the readout itself — the economy is picked
              from the table below, not from a 375px-wide globe. */}
          <div className="relative h-full w-full overflow-hidden" style={{ background: "#0a1019" }}>
            {wide && <WorldMap3D markers={markers} selected={selected} onSelect={setSelected} />}

            {sel && (
              <div className="border-border/50 bg-background/80 m-3 border p-3 backdrop-blur-md sm:pointer-events-none sm:absolute sm:left-3 sm:top-3 sm:m-0 sm:w-[188px]">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[11px] font-bold tracking-[0.18em] text-primary">{sel.id.toUpperCase()}</span>
                  <span className="truncate text-[12px] text-foreground/90">{sel.country}</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-[28px] font-black leading-none tabular-nums text-foreground">
                    {sel.value != null ? sel.value.toFixed(2) : "—"}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/75">% · 10Y</span>
                </div>
                <div className="mt-2.5 space-y-[3px] border-t border-border/40 pt-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/75">Δ 1m</span>
                    <span className="text-[12px] tabular-nums" style={{ color: toneFor(sel.value != null && sel.prev != null ? sel.value - sel.prev : null) }}>
                      {bp(sel.value != null && sel.prev != null ? sel.value - sel.prev : null)}
                    </span>
                  </div>
                  {sel.id !== "us" && (
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/75">vs US</span>
                      <span className="text-[12px] tabular-nums text-foreground/80">
                        {bp(sel.value != null && us?.value != null ? sel.value - us.value : null)}
                      </span>
                    </div>
                  )}
                  {sel.fxSymbol && q.get(sel.fxSymbol) && (
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/75">{sel.fxSymbol}</span>
                      <Delta value={q.get(sel.fxSymbol)!.changePct} />
                    </div>
                  )}
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/75">Bank</span>
                    <span className="truncate pl-2 text-right text-[11px] text-foreground/80">{sel.centralBank}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Pane>

        <Pane
          index="02"
          label="Sovereign 10Y"
          right={<Switch options={SORTS} value={sort} onChange={setSort} />}
          bodyClassName="p-0"
          className="min-h-[340px] lg:col-span-5"
        >
          {yields.length === 0 ? (
            <Empty label="Loading yields" />
          ) : (
            <div className="flex h-full min-h-0 flex-col">
              <div className="grid shrink-0 grid-cols-[2.2rem_1fr_3.4rem_3.2rem_3.2rem] gap-x-2 border-b border-border/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/65">
                <span />
                <span>Economy</span>
                <span className="text-right">10Y</span>
                <span className="text-right">Δ1m</span>
                <span className="text-right">vs US</span>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {rows.map(({ y, change, spread }) => {
                  const on = y.id === selected;
                  return (
                    <button
                      key={y.id}
                      onClick={() => setSelected(y.id)}
                      className={`relative grid w-full grid-cols-[2.2rem_1fr_3.4rem_3.2rem_3.2rem] items-center gap-x-2 border-b border-border/20 px-3 py-[7px] text-left transition-colors ${
                        on ? "bg-primary/[0.09]" : "hover:bg-muted/20"
                      }`}
                    >
                      {/* The bar is the ranking — length is the yield itself */}
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-y-0 left-0 transition-[width] duration-500"
                        style={{ width: `${((y.value ?? 0) / maxYield) * 100}%`, background: a(CYAN_BAR, on ? 12 : 6) }}
                      />
                      <span className={`relative font-mono text-[11px] font-bold tracking-[0.14em] ${on ? "text-primary" : "text-foreground/75"}`}>
                        {y.id.toUpperCase()}
                      </span>
                      <span className="relative min-w-0 truncate text-[12px] text-foreground/85">{y.country}</span>
                      <span className="relative text-right text-[14px] font-bold tabular-nums text-foreground">
                        {y.value != null ? y.value.toFixed(2) : "—"}
                      </span>
                      <span className="relative text-right text-[12px] tabular-nums" style={{ color: toneFor(change) }}>
                        {bp(change)}
                      </span>
                      <span className="relative text-right text-[12px] tabular-nums text-foreground/80">
                        {y.id === "us" ? "—" : bp(spread)}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="shrink-0 border-t border-border/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/65">
                OECD harmonised · monthly · {gyEnv?.asOf ? timeAgo(gyEnv.asOf) : "—"} · spread = this yield minus US 10Y
              </p>
            </div>
          )}
        </Pane>
      </div>

      {/* ── United States ─────────────────────────────────────────────── */}
      <div className="grid shrink-0 grid-cols-1 gap-2 lg:h-[236px] lg:grid-cols-12">
        <Pane index="03" label="US Treasury curve" right={<Meta env={macroEnv} />} className="lg:col-span-5" bodyClassName="p-2">
          {/* Chart beside the numbers on a laptop; stacked on a phone, where
              375px cannot carry both. */}
          {curve.length > 1 ? (
            <div className="flex flex-col gap-2 sm:h-full sm:min-h-0 sm:flex-row">
              <div className="h-[150px] w-full sm:h-auto sm:min-w-0 sm:flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={curve} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gmi-curve" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.26} />
                        <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" opacity={0.35} />
                    <XAxis dataKey="mat" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={38} tickFormatter={(v: number) => v.toFixed(1)} />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 2, fontSize: 11 }} formatter={(v) => [`${Number(v ?? 0).toFixed(2)}%`, "Yield"]} />
                    <Area type="monotone" dataKey="yield" stroke="var(--chart-1)" strokeWidth={1.8} fill="url(#gmi-curve)" dot={{ r: 2.5, fill: "var(--chart-1)" }} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full border-t border-border/30 pt-1 sm:w-[136px] sm:shrink-0 sm:overflow-y-auto sm:border-l sm:border-t-0 sm:pl-2 sm:pt-0">
                {rates.map((s) => (
                  <Field
                    key={s.id}
                    label={RATE_LABEL[s.id] ?? s.label}
                    value={macroVal(s)}
                    tone={s.id.startsWith("T10Y") ? toneFor(s.value) : undefined}
                  />
                ))}
              </div>
            </div>
          ) : (
            <Empty label="Curve unavailable" />
          )}
        </Pane>

        <Pane index="04" label="Fed & liquidity" right={<Meta env={macroEnv} />} scroll className="lg:col-span-4">
          {liquidity.length === 0 ? (
            <Empty label="Loading" />
          ) : (
            liquidity.map((s) => (
              <Field
                key={s.id}
                label={s.label}
                value={macroVal(s)}
                trailing={s.history.length > 1 ? <span className="mr-2 opacity-70"><Sparkline data={s.history.map((h) => h.value)} width={46} height={14} strokeWidth={1.2} /></span> : undefined}
              />
            ))
          )}
        </Pane>

        <Pane index="05" label="Dollar & volatility" right={<Meta env={quotesEnv} />} scroll className="lg:col-span-3">
          {FX.map((s) => (
            <Field key={s} label={<span className="font-mono text-[12px]">{s}</span>} value={fmtPrice(q.get(s)?.price, q.get(s)?.unit)}
              trailing={<span className="mr-2"><Delta value={q.get(s)?.changePct} /></span>} />
          ))}
          <div className="my-1.5 border-t border-border/30" />
          {VOL.map((s) => (
            <Field key={s} label={<span className="font-mono text-[12px]">{s}</span>} value={q.get(s) ? fmtPrice(q.get(s)!.price) : "n/a"}
              trailing={<span className="mr-2"><Delta value={q.get(s)?.changePct} /></span>} />
          ))}
          <p className="mt-2 border-t border-border/30 pt-1.5 text-[11px] font-semibold uppercase leading-relaxed tracking-wider text-foreground/65">
            Delayed quotes · last capture, not the current print
          </p>
        </Pane>
      </div>
    </div>
  );
}

const CYAN_BAR = "var(--ice)";
