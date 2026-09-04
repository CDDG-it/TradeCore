"use client";

/**
 * MARKETS — the macro frame: what sovereign debt yields around the world, the
 * shape of the US curve, what the Fed's balance sheet is doing, and where the
 * dollar and volatility sit.
 *
 * Every block states its own cadence, because they genuinely differ: OECD
 * harmonised yields are monthly, US Treasury constant maturities are daily,
 * balance-sheet series are weekly, FX and volatility are delayed quotes. No
 * flags, no decoration — a country is its ISO code, a number is a number.
 */
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { fmtPrice, fmtPct, toneFor, useGmi, FRESHNESS_LABEL, timeAgo } from "@/lib/gmi/client";
import type { Quote, MacroSeries } from "@/lib/gmi/types";
import type { GlobalYield } from "@/lib/gmi/global-yields";
import type { GlobeMarker } from "@/components/news-city/WorldMap3D";
import { Panel, Unavailable, DataRow, Segmented, a } from "../panel";
import { Sparkline } from "../sparkline";

const WorldMap3D = dynamic(
  () => import("@/components/news-city/WorldMap3D").then((m) => m.WorldMap3D),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center text-sm text-muted-foreground animate-pulse">Loading globe…</div> }
);

const FX = ["DXY", "EURUSD", "USDJPY", "GBPUSD", "USDCNH", "AUDUSD", "USDCAD", "USDCHF"];
const VOL = ["VIX", "VIX1D", "VVIX"];

const SORTS = [
  { key: "yield", label: "Yield" },
  { key: "change", label: "Δ 1m" },
  { key: "spread", label: "vs US" },
];

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

const bp = (v: number | null) => (v == null ? "—" : `${v > 0 ? "+" : ""}${(v * 100).toFixed(0)}bp`);

/** A country's ISO code, set as a plain mono chip — the flag's job, without the emoji. */
function CountryCode({ id, active }: { id: string; active?: boolean }) {
  return (
    <span
      className={`inline-flex h-5 w-7 shrink-0 items-center justify-center rounded font-mono text-[10px] font-bold tracking-wider ${
        active ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground"
      }`}
    >
      {id.toUpperCase()}
    </span>
  );
}

/** FX / volatility tile — the move leads, the last print supports it. */
function QuoteTile({ symbol, q }: { symbol: string; q: Quote | undefined }) {
  const tone = toneFor(q?.changePct);
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/50 bg-muted/[0.06] px-3 py-2.5 transition-colors hover:border-border">
      <span aria-hidden className="absolute inset-y-2 left-0 w-px" style={{ background: q?.changePct ? tone : "var(--border)" }} />
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[11px] font-bold tracking-wide text-muted-foreground">{symbol}</span>
        <span className="font-mono text-xs font-bold tabular-nums" style={{ color: tone }}>
          {q ? fmtPct(q.changePct) : "n/a"}
        </span>
      </div>
      <div className="mt-1 font-mono text-sm font-semibold tabular-nums text-foreground/85">{fmtPrice(q?.price, q?.unit)}</div>
    </div>
  );
}

export function MarketsTab() {
  const { env: quotesEnv } = useGmi<Quote[]>("/api/gmi/quotes", 60_000);
  const { env: macroEnv } = useGmi<MacroSeries[]>("/api/gmi/macro", 10 * 60_000);
  const { env: gyEnv } = useGmi<GlobalYield[]>("/api/gmi/global-yields", 6 * 60 * 60_000);
  const [selected, setSelected] = useState<string | null>("us");
  const [sort, setSort] = useState("yield");

  const q = new Map((quotesEnv?.data ?? []).map((x) => [x.symbol, x]));
  const byId = new Map((macroEnv?.data ?? []).map((s) => [s.id, s]));
  const yields = useMemo(() => gyEnv?.data ?? [], [gyEnv]);
  const sel = yields.find((y) => y.id === selected) ?? null;
  const us = yields.find((y) => y.id === "us") ?? null;

  const rows = useMemo(() => {
    const withDerived = yields.map((y) => ({
      y,
      change: y.value != null && y.prev != null ? y.value - y.prev : null,
      spread: y.value != null && us?.value != null ? y.value - us.value : null,
    }));
    const rank = (v: number | null) => (v == null ? -Infinity : v);
    return withDerived.sort((m, n) =>
      sort === "yield" ? rank(n.y.value) - rank(m.y.value)
      : sort === "change" ? rank(n.change) - rank(m.change)
      : rank(n.spread) - rank(m.spread)
    );
  }, [yields, us, sort]);

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
      {/* ── Sovereign yields ─────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Panel
          eyebrow="World"
          title="Sovereign 10-year yields"
          accent="cyan"
          bodyClassName="px-3 pb-3"
          action={<span className="text-[10px] text-muted-foreground/70">Select an economy</span>}
        >
          <div className="relative w-full overflow-hidden rounded-xl border border-border/40" style={{ height: "clamp(320px, 46vh, 520px)", background: "#0b1120" }}>
            <WorldMap3D markers={markers} selected={selected} onSelect={setSelected} />

            {sel && (
              <div className="pointer-events-none absolute left-3 top-3 w-52 rounded-xl border border-border/60 bg-card/85 p-3 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <CountryCode id={sel.id} active />
                  <span className="truncate text-sm font-semibold text-foreground">{sel.country}</span>
                </div>
                <div className="mt-2.5 flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-bold leading-none tabular-nums text-foreground">
                    {sel.value != null ? `${sel.value.toFixed(2)}%` : "—"}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">10Y</span>
                </div>
                <dl className="mt-2.5 space-y-1 border-t border-border/40 pt-2 text-[10px]">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground/70">Δ 1 month</dt>
                    <dd className="font-mono tabular-nums" style={{ color: toneFor(sel.value != null && sel.prev != null ? sel.value - sel.prev : null) }}>
                      {bp(sel.value != null && sel.prev != null ? sel.value - sel.prev : null)}
                    </dd>
                  </div>
                  {sel.id !== "us" && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground/70">Spread vs US</dt>
                      <dd className="font-mono tabular-nums text-foreground/80">
                        {bp(sel.value != null && us?.value != null ? sel.value - us.value : null)}
                      </dd>
                    </div>
                  )}
                  {sel.fxSymbol && q.get(sel.fxSymbol) && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground/70">{sel.fxSymbol}</dt>
                      <dd className="font-mono tabular-nums" style={{ color: toneFor(q.get(sel.fxSymbol)!.changePct) }}>
                        {fmtPct(q.get(sel.fxSymbol)!.changePct)}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground/70">Central bank</dt>
                    <dd className="truncate pl-2 text-right text-foreground/80">{sel.centralBank}</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        </Panel>

        <Panel
          eyebrow="Ranked"
          title="Yields, highest first"
          env={gyEnv}
          className="flex h-full flex-col"
          bodyClassName="flex min-h-0 flex-1 flex-col"
          action={<Segmented options={SORTS} value={sort} onChange={setSort} size="xs" />}
        >
          {yields.length === 0 ? (
            <Unavailable label="Loading yields…" />
          ) : (
            <>
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-x-2 pb-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/50">
                <span />
                <span>Economy</span>
                <span className="w-14 text-right">10Y</span>
                <span className="w-14 text-right">Δ 1m</span>
                <span className="w-14 text-right">vs US</span>
              </div>
              <div className="-mx-1 min-h-0 flex-1 space-y-px overflow-y-auto px-1">
                {rows.map(({ y, change, spread }) => {
                  const isSel = y.id === selected;
                  return (
                    <button
                      key={y.id}
                      onClick={() => setSelected(y.id)}
                      className={`relative grid w-full grid-cols-[auto_1fr_auto_auto_auto] items-center gap-x-2 overflow-hidden rounded-lg px-1 py-1.5 text-left transition-colors ${
                        isSel ? "bg-primary/[0.12]" : "hover:bg-muted/20"
                      }`}
                    >
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-y-0 left-0 transition-[width] duration-500"
                        style={{ width: `${((y.value ?? 0) / maxYield) * 100}%`, background: a("var(--chart-2)", isSel ? 14 : 7) }}
                      />
                      <CountryCode id={y.id} active={isSel} />
                      <span className="relative min-w-0 truncate text-xs font-medium text-foreground">{y.country}</span>
                      <span className="relative w-14 text-right font-mono text-xs font-bold tabular-nums text-foreground">
                        {y.value != null ? `${y.value.toFixed(2)}%` : "—"}
                      </span>
                      <span className="relative w-14 text-right font-mono text-[10px] font-semibold tabular-nums" style={{ color: toneFor(change) }}>
                        {bp(change)}
                      </span>
                      <span className="relative w-14 text-right font-mono text-[10px] tabular-nums text-muted-foreground/80">
                        {y.id === "us" ? "—" : bp(spread)}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 border-t border-border/40 pt-2 text-[10px] text-muted-foreground/70">
                OECD harmonised long-term rates · {FRESHNESS_LABEL.monthly.toLowerCase()} · {gyEnv?.asOf ? timeAgo(gyEnv.asOf) : "—"}. Spread is this yield minus the US 10Y.
              </p>
            </>
          )}
        </Panel>
      </div>

      {/* ── US curve + policy ────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel eyebrow="United States" title="Treasury curve" subtitle="Constant-maturity yields, daily" env={macroEnv}>
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

        <Panel eyebrow="Policy" title="Fed & liquidity" subtitle="Balance sheet and money-market plumbing" env={macroEnv}>
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

      {/* ── FX + volatility ──────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel eyebrow="Currencies" title="FX" subtitle="Change on the day, versus the prior close" env={quotesEnv}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {FX.map((s) => <QuoteTile key={s} symbol={s} q={q.get(s)} />)}
          </div>
        </Panel>
        <Panel eyebrow="Risk" title="Volatility" env={quotesEnv}>
          <div className="grid grid-cols-3 gap-2">
            {VOL.map((s) => <QuoteTile key={s} symbol={s} q={q.get(s)} />)}
          </div>
          <p className="mt-2.5 text-[10px] leading-relaxed text-muted-foreground/70">
            Quotes are delayed, so treat these as the last capture rather than the current print. Realized vol and
            per-instrument option vol need a paid options source and are left out rather than estimated.
          </p>
        </Panel>
      </div>
    </div>
  );
}
