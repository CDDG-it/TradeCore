"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { ArrowUp, ArrowDown, Minus, Target, Activity, Layers, Gauge, RefreshCw, Waves } from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type {
  InstrumentKey,
  Timeframe,
  Zone,
  Zones,
  SessionLevels,
  BiasDirection,
  ZoneStatus,
  ZoneConfidence,
  GreeksProfile,
  InstrumentFlow,
} from "@/lib/option-flow/types";

const INSTRUMENT_KEYS: InstrumentKey[] = ["NQ", "GC"];

// ── Formatting helpers ────────────────────────────────────────────────────────
function fmtPrice(p: number | null, key: InstrumentKey): string {
  if (p === null) return "—";
  const decimals = key === "NQ" ? 0 : 1;
  return p.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function pctFromSpot(price: number, spot: number): string {
  const pct = ((price - spot) / spot) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
}

// ── Bias / direction color helpers ────────────────────────────────────────────
const BIAS_META: Record<BiasDirection, { color: string; icon: typeof ArrowUp; tint: string }> = {
  BULLISH: { color: "text-success", icon: ArrowUp, tint: "bg-success/10 border-success/30" },
  BEARISH: { color: "text-destructive", icon: ArrowDown, tint: "bg-destructive/10 border-destructive/30" },
  NEUTRAL: { color: "text-gold", icon: Minus, tint: "bg-gold/10 border-gold/30" },
};

function dirColor(score: number): string {
  if (score > 0.2) return "text-success";
  if (score < -0.2) return "text-destructive";
  return "text-gold";
}

const STATUS_META: Record<ZoneStatus, { label: string; cls: string }> = {
  untested: { label: "Untested", cls: "text-muted-foreground bg-muted/40" },
  approaching: { label: "Approaching", cls: "text-gold bg-gold/10" },
  defended: { label: "Defended", cls: "text-success bg-success/10" },
  broken: { label: "Broken", cls: "text-destructive bg-destructive/10" },
};

const CONF_COLOR: Record<ZoneConfidence, string> = {
  STRONG: "text-success",
  HIGH: "text-success/80",
  MEDIUM: "text-gold",
  LOW: "text-muted-foreground",
  BREAKING: "text-destructive",
};

// ── Small UI primitives ───────────────────────────────────────────────────────
function Stars({ n }: { n: number }) {
  const count = Math.min(Math.max(n, 0), 5);
  return (
    <span className="text-gold tracking-tight" title={`Strength ${count}/5`}>
      {"★".repeat(count)}
      <span className="text-muted-foreground/30">{"★".repeat(5 - count)}</span>
    </span>
  );
}

function ComponentBar({ label, value, weight }: { label: string; value: number; weight: string }) {
  const pct = ((value + 1) / 2) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">
          {label} <span className="text-muted-foreground/50">· {weight}</span>
        </span>
        <span className={cn("text-xs font-semibold tabular-nums", dirColor(value))}>
          {value >= 0 ? "+" : ""}
          {value.toFixed(2)}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/40 relative overflow-hidden">
        {/* center marker */}
        <span className="absolute left-1/2 top-0 bottom-0 w-px bg-border/80" />
        <span
          className={cn(
            "absolute top-0 bottom-0 rounded-full",
            value >= 0 ? "bg-success" : "bg-destructive"
          )}
          style={
            value >= 0
              ? { left: "50%", width: `${pct - 50}%` }
              : { right: "50%", width: `${50 - pct}%` }
          }
        />
      </div>
    </div>
  );
}

// ── Bias hero ─────────────────────────────────────────────────────────────────
function BiasHero({ flow }: { flow: InstrumentFlow }) {
  const meta = BIAS_META[flow.bias.bias];
  const Icon = meta.icon;
  return (
    <Card className={cn("border", meta.tint)}>
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex items-center gap-4 shrink-0">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", meta.tint)}>
              <Icon className={cn("w-7 h-7", meta.color)} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Weekly Bias
              </p>
              <p className={cn("font-heading font-black text-2xl leading-none mt-1", meta.color)}>
                {flow.bias.bias}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {flow.bias.confidence} confidence ·{" "}
                <span className={cn("font-semibold tabular-nums", meta.color)}>
                  {flow.bias.score >= 0 ? "+" : ""}
                  {flow.bias.score.toFixed(2)}
                </span>
              </p>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:border-l sm:border-border/50 sm:pl-5">
            <ComponentBar label="COT" value={flow.bias.components.cot} weight="40%" />
            <ComponentBar label="Macro" value={flow.bias.components.macro} weight="35%" />
            <ComponentBar label="PCR" value={flow.bias.components.pcr} weight="25%" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Bias summary chips (both instruments) ─────────────────────────────────────
function BiasSummary({
  flows,
  selected,
  onSelect,
}: {
  flows: InstrumentFlow[];
  selected: InstrumentKey;
  onSelect: (k: InstrumentKey) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {flows.map((f) => {
        const meta = BIAS_META[f.bias.bias];
        const isSel = f.key === selected;
        return (
          <button
            key={f.key}
            onClick={() => onSelect(f.key)}
            className={cn(
              "text-left rounded-xl border p-4 transition-all hover:scale-[1.01]",
              isSel ? "border-primary/50 bg-primary/5" : "border-border/50 bg-card hover:border-border"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-sm">{f.key}</span>
              <span className={cn("text-xs font-semibold", meta.color)}>{f.bias.bias}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{f.label}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-lg font-bold tabular-nums">{fmtPrice(f.spot, f.key)}</span>
              <span className={cn("text-xs tabular-nums", meta.color)}>
                {f.bias.score >= 0 ? "+" : ""}
                {f.bias.score.toFixed(2)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Zones ─────────────────────────────────────────────────────────────────────
function ZoneRow({ zone, spot, side, instKey }: { zone: Zone; spot: number; side: "resistance" | "support"; instKey: InstrumentKey }) {
  const status = STATUS_META[zone.status];
  const accent = side === "resistance" ? "text-destructive" : "text-success";
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors">
      <div className="w-20 shrink-0">
        <p className={cn("font-bold tabular-nums text-sm", accent)}>{fmtPrice(zone.price, instKey)}</p>
        <p className="text-[10px] text-muted-foreground tabular-nums">{pctFromSpot(zone.price, spot)}</p>
      </div>
      <div className="w-16 shrink-0 text-xs">
        <Stars n={zone.strength} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap gap-1">
          {zone.sources.map((s, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground whitespace-nowrap">
              {s}
            </span>
          ))}
        </div>
      </div>
      <div className="w-24 shrink-0 flex flex-col items-end gap-1">
        <span className={cn("text-[10px] font-semibold uppercase tracking-wide", CONF_COLOR[zone.confidence])}>
          {zone.confidence}
        </span>
        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", status.cls)}>{status.label}</span>
      </div>
    </div>
  );
}

function ZonesPanel({ zones, spot, instKey }: { zones: Zones; spot: number; instKey: InstrumentKey }) {
  const nearestRes = useMemo(
    () => zones.resistance.filter((z) => z.price > spot).sort((a, b) => a.price - b.price)[0],
    [zones, spot]
  );
  const nearestSup = useMemo(
    () => zones.support.filter((z) => z.price < spot).sort((a, b) => b.price - a.price)[0],
    [zones, spot]
  );

  return (
    <div className="space-y-4">
      {/* Nearest actionable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { z: nearestRes, label: "Nearest Resistance", side: "resistance" as const },
          { z: nearestSup, label: "Nearest Support", side: "support" as const },
        ].map(({ z, label, side }) => {
          if (!z) return null;
          const isRes = side === "resistance";
          const accent = isRes ? "text-destructive" : "text-success";
          const border = isRes ? "border-destructive/30 bg-destructive/5" : "border-success/30 bg-success/5";
          return (
            <div key={label} className={cn("rounded-xl border p-4", border)}>
              <div className="flex items-center justify-between">
                <span className={cn("text-[10px] font-semibold uppercase tracking-[0.14em]", accent)}>
                  {isRes ? "▲" : "▼"} {label}
                </span>
                <span className={cn("text-[10px] font-semibold", CONF_COLOR[z.confidence])}>{z.confidence}</span>
              </div>
              <p className="font-heading font-black text-2xl mt-1 tabular-nums">{fmtPrice(z.price, instKey)}</p>
              <p className={cn("text-xs font-medium", accent)}>
                {pctFromSpot(z.price, spot)} · {Math.abs(z.price - spot).toFixed(instKey === "NQ" ? 0 : 1)} pts away
              </p>
              <div className="mt-2"><Stars n={z.strength} /></div>
              <p className="text-[10px] text-muted-foreground mt-2 truncate">{z.sources.join(" · ")}</p>
            </div>
          );
        })}
      </div>

      {/* Resistance list */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-destructive mb-1 px-3">Resistance</p>
        <div className="rounded-xl border border-border/50 bg-card divide-y divide-border/30">
          {zones.resistance.map((z, i) => (
            <ZoneRow key={i} zone={z} spot={spot} side="resistance" instKey={instKey} />
          ))}
        </div>
      </div>

      {/* Spot marker */}
      <div className="flex items-center gap-3 px-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs font-semibold text-primary tabular-nums">
          SPOT {fmtPrice(spot, instKey)}
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Support list */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-success mb-1 px-3">Support</p>
        <div className="rounded-xl border border-border/50 bg-card divide-y divide-border/30">
          {zones.support.map((z, i) => (
            <ZoneRow key={i} zone={z} spot={spot} side="support" instKey={instKey} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Session levels ────────────────────────────────────────────────────────────
const SESSION_GROUPS: { title: string; rows: { key: keyof SessionLevels; label: string }[] }[] = [
  {
    title: "Prior Day",
    rows: [
      { key: "PDH", label: "Prior Day High" },
      { key: "PDC", label: "Prior Day Close" },
      { key: "PDO", label: "Prior Day Open" },
      { key: "PDL", label: "Prior Day Low" },
    ],
  },
  {
    title: "Overnight / Globex",
    rows: [
      { key: "ONH", label: "Overnight High" },
      { key: "ONL", label: "Overnight Low" },
    ],
  },
  {
    title: "World Sessions",
    rows: [
      { key: "Asia_H", label: "Asian High" },
      { key: "Asia_L", label: "Asian Low" },
      { key: "London_H", label: "London High" },
      { key: "London_L", label: "London Low" },
      { key: "PreNY_H", label: "Pre-NY High" },
      { key: "PreNY_L", label: "Pre-NY Low" },
    ],
  },
  {
    title: "RTH Session",
    rows: [
      { key: "ORH", label: "Opening Range High" },
      { key: "ORL", label: "Opening Range Low" },
      { key: "Sess_H", label: "Session High" },
      { key: "Sess_L", label: "Session Low" },
    ],
  },
  {
    title: "VWAP Bands",
    rows: [
      { key: "VWAP+2", label: "VWAP +2σ" },
      { key: "VWAP+1", label: "VWAP +1σ" },
      { key: "VWAP", label: "VWAP" },
      { key: "VWAP-1", label: "VWAP −1σ" },
      { key: "VWAP-2", label: "VWAP −2σ" },
    ],
  },
];

function SessionLevelsPanel({ levels, spot, instKey }: { levels: SessionLevels; spot: number; instKey: InstrumentKey }) {
  // Build a sorted ladder of all available levels for the visual rail
  const ladder = useMemo(() => {
    const all: { label: string; price: number }[] = [];
    for (const g of SESSION_GROUPS) {
      for (const r of g.rows) {
        const v = levels[r.key];
        if (typeof v === "number") all.push({ label: r.key, price: v });
      }
    }
    all.push({ label: "SPOT", price: spot });
    return all.sort((a, b) => b.price - a.price);
  }, [levels, spot]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
      {/* Grouped tables */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SESSION_GROUPS.map((g) => (
          <Card key={g.title} className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {g.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1">
              {g.rows.map((r) => {
                const v = levels[r.key];
                const num = typeof v === "number" ? v : null;
                const above = num !== null && num > spot;
                return (
                  <div key={String(r.key)} className="flex items-center justify-between text-sm py-0.5">
                    <span className="text-muted-foreground text-xs">{r.label}</span>
                    <span
                      className={cn(
                        "font-semibold tabular-nums",
                        num === null ? "text-muted-foreground/40" : above ? "text-destructive" : "text-success"
                      )}
                    >
                      {fmtPrice(num, instKey)}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Visual ladder rail */}
      <Card className="border-border/50 hidden lg:block">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Level Ladder
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-0.5">
            {ladder.map((l, i) => {
              const isSpot = l.label === "SPOT";
              const above = l.price > spot;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-center justify-between text-xs px-2 py-1 rounded",
                    isSpot && "bg-primary/10 border border-primary/30"
                  )}
                >
                  <span
                    className={cn(
                      "font-medium",
                      isSpot ? "text-primary font-bold" : "text-muted-foreground"
                    )}
                  >
                    {l.label}
                  </span>
                  <span
                    className={cn(
                      "tabular-nums font-semibold",
                      isSpot ? "text-primary" : above ? "text-destructive/80" : "text-success/80"
                    )}
                  >
                    {fmtPrice(l.price, instKey)}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── COT ───────────────────────────────────────────────────────────────────────
function CotTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { date: string } }> }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground mb-1">{p.payload.date}</p>
      <p className="font-semibold text-primary tabular-nums">
        Net spec: {p.value.toLocaleString()}
      </p>
    </div>
  );
}

function CotPanel({ flow }: { flow: InstrumentFlow }) {
  const { cot, macro, bias } = flow;
  const metrics = [
    { label: "Net Spec (large)", value: cot.net_spec.toLocaleString(), color: cot.net_spec >= 0 ? "text-success" : "text-destructive" },
    { label: "Weekly Change", value: `${cot.net_spec_chg >= 0 ? "+" : ""}${cot.net_spec_chg.toLocaleString()}`, color: cot.net_spec_chg >= 0 ? "text-success" : "text-destructive" },
    { label: "Positioning vs 26wk", value: `${Math.round(cot.normalized_positioning * 100)}%`, color: "text-foreground" },
    { label: "4wk Momentum", value: `${cot.momentum_4wk >= 0 ? "+" : ""}${cot.momentum_4wk.toFixed(2)}`, color: dirColor(cot.momentum_4wk) },
    { label: "Net Commercial", value: cot.net_comm.toLocaleString(), color: cot.net_comm >= 0 ? "text-success" : "text-destructive" },
    { label: "Open Interest", value: cot.open_interest.toLocaleString(), color: "text-foreground" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Chart */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Large Speculator Net Position · 26wk</CardTitle>
            <p className="text-xs text-muted-foreground">CFTC Commitment of Traders — weekly</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cot.history} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cotFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.72 0.22 45)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="oklch(0.72 0.22 45)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.01 252 / 0.3)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => format(new Date(d), "MMM d")}
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    interval={5}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip content={<CotTooltip />} />
                  <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="2 2" />
                  <Area
                    type="monotone"
                    dataKey="net_spec"
                    stroke="oklch(0.72 0.22 45)"
                    strokeWidth={2}
                    fill="url(#cotFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Metrics */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">COT Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 grid grid-cols-2 gap-x-4 gap-y-3">
            {metrics.map((m) => (
              <div key={m.label}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{m.label}</p>
                <p className={cn("text-base font-bold tabular-nums", m.color)}>{m.value}</p>
              </div>
            ))}
            <div className="col-span-2 pt-1 border-t border-border/40">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">COT Bias Score</p>
              <p className={cn("text-lg font-bold tabular-nums", dirColor(cot.score))}>
                {cot.score >= 0 ? "+" : ""}
                {cot.score.toFixed(2)} · {String(cot.label).toUpperCase()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Macro contribution */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Macro Drivers → Weekly Bias</CardTitle>
          <p className="text-xs text-muted-foreground">
            COT 40% · Macro 35% · PCR 25% → net{" "}
            <span className={cn("font-semibold", dirColor(bias.score))}>
              {bias.score >= 0 ? "+" : ""}
              {bias.score.toFixed(2)} {bias.bias}
            </span>
          </p>
        </CardHeader>
        <CardContent className="pt-0 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {macro.map((m) => (
            <div key={m.name} className="rounded-lg border border-border/40 p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{m.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  corr {m.relationship > 0 ? "+" : ""}
                  {m.relationship}
                </span>
              </div>
              <p className={cn("text-lg font-bold tabular-nums mt-1", dirColor(m.score))}>
                {m.score >= 0 ? "+" : ""}
                {m.score.toFixed(2)}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Greeks (GEX / DEX) ────────────────────────────────────────────────────────
function compact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(0)}k`;
  return n.toFixed(0);
}

function GreeksTooltip({
  active,
  payload,
  instKey,
  metric,
}: {
  active?: boolean;
  payload?: Array<{ payload: { strike: number; gex: number; dex: number } }>;
  instKey: InstrumentKey;
  metric: "gex" | "dex";
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground mb-1">Strike {fmtPrice(p.strike, instKey)}</p>
      <p className={cn("font-semibold tabular-nums", p[metric] >= 0 ? "text-success" : "text-destructive")}>
        {metric.toUpperCase()}: {compact(p[metric])}
      </p>
    </div>
  );
}

function GreeksPanel({ greeks, spot, instKey }: { greeks: GreeksProfile; spot: number; instKey: InstrumentKey }) {
  const [metric, setMetric] = useState<"gex" | "dex">("gex");
  // Trim to strikes within a sensible window around spot for readability
  const data = useMemo(
    () =>
      greeks.profile
        .filter((p) => Math.abs(p.strike - spot) / spot <= 0.06)
        .map((p) => ({ ...p, value: p[metric] })),
    [greeks.profile, spot, metric]
  );

  const stats = [
    {
      label: "GEX Regime",
      value: greeks.gexRegime === "positive" ? "🟢 Positive" : "🔴 Negative",
      sub: greeks.gexRegime === "positive" ? "pinning / mean-revert" : "amplifying / trending",
      color: greeks.gexRegime === "positive" ? "text-success" : "text-destructive",
    },
    {
      label: "Net GEX",
      value: compact(greeks.totalGex),
      sub: "$ / 1% move",
      color: greeks.totalGex >= 0 ? "text-success" : "text-destructive",
    },
    {
      label: "DEX Bias",
      value: greeks.dexBias === "long" ? "🟢 Net long" : "🔴 Net short",
      sub: compact(greeks.totalDex),
      color: greeks.dexBias === "long" ? "text-success" : "text-destructive",
    },
    {
      label: "Gamma Flip",
      value: greeks.flip ? fmtPrice(greeks.flip, instKey) : "—",
      sub: greeks.flip ? (spot > greeks.flip ? "spot above" : "spot below") : "n/a",
      color: "text-foreground",
    },
    {
      label: "Call Wall",
      value: greeks.callWall ? fmtPrice(greeks.callWall, instKey) : "—",
      sub: "largest +GEX",
      color: "text-destructive",
    },
    {
      label: "Put Wall",
      value: greeks.putWall ? fmtPrice(greeks.putWall, instKey) : "—",
      sub: "largest −GEX",
      color: "text-success",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
          <Waves className="w-3.5 h-3.5" />
          Dealer exposure via <span className="font-semibold text-foreground">{greeks.proxy}</span> options ·
          scaled ×{greeks.ratio} to {instKey} futures
          {greeks.stale ? (
            <span className="text-gold">· last good {format(new Date(greeks.asOf), "HH:mm")} (chain rate-limited)</span>
          ) : (
            <span className="text-success/70">· {format(new Date(greeks.asOf), "HH:mm")}</span>
          )}
        </p>
        <Segmented
          options={[
            { value: "gex" as const, label: "Gamma (GEX)" },
            { value: "dex" as const, label: "Delta (DEX)" },
          ]}
          value={metric}
          onChange={setMetric}
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border/40 p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
            <p className={cn("text-base font-bold tabular-nums leading-tight mt-0.5", s.color)}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground/70">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Exposure profile chart */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            {metric === "gex" ? "Gamma" : "Delta"} Exposure by Strike
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Green = positive (dealers dampen moves) · Red = negative (dealers amplify)
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.01 252 / 0.3)" vertical={false} />
                <XAxis
                  dataKey="strike"
                  tickFormatter={(v) => fmtPrice(v, instKey)}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  minTickGap={28}
                />
                <YAxis
                  tickFormatter={(v) => compact(v)}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                />
                <Tooltip
                  content={<GreeksTooltip instKey={instKey} metric={metric} />}
                  cursor={{ fill: "oklch(0.5 0.01 252 / 0.08)" }}
                />
                <ReferenceLine y={0} stroke="var(--border)" />
                <ReferenceLine
                  x={data.reduce((best, p) => (Math.abs(p.strike - spot) < Math.abs(best - spot) ? p.strike : best), data[0]?.strike ?? spot)}
                  stroke="oklch(0.72 0.22 45)"
                  strokeDasharray="4 2"
                  label={{ value: "Spot", fill: "oklch(0.72 0.22 45)", fontSize: 10, position: "top" }}
                />
                <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.value >= 0 ? "oklch(0.68 0.20 130)" : "oklch(0.62 0.24 18)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Toggle control ────────────────────────────────────────────────────────────
function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg bg-muted/40 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
            value === o.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function OptionFlowPage() {
  const [flows, setFlows] = useState<InstrumentFlow[]>([]);
  const [instrument, setInstrument] = useState<InstrumentKey>("NQ");
  const [timeframe, setTimeframe] = useState<Timeframe>("intraday");
  const [loading, setLoading] = useState(true);
  const [cooldown, setCooldown] = useState(0); // seconds until the manual button re-enables

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Cache-bust so each refresh hits the route handler.
      const res = await fetch(`/api/option-flow?t=${Date.now()}`, { cache: "no-store" });
      const data: { flows?: InstrumentFlow[] } = await res.json();
      if (data.flows?.length) setFlows(data.flows);
    } catch {
      /* keep current/mock data */
    } finally {
      setLoading(false);
    }
  }, []);

  const manualRefresh = useCallback(async () => {
    await load();
    setCooldown(60); // lock the button for 60s after a manual refresh
  }, [load]);

  // Initial load
  useEffect(() => {
    void load();
  }, [load]);

  // Auto-refresh every 60s (independent of the manual cooldown)
  useEffect(() => {
    const id = setInterval(() => void load(), 60_000);
    return () => clearInterval(id);
  }, [load]);

  // 1s ticker that counts the manual cooldown down to zero
  useEffect(() => {
    const id = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  const flow = flows.find((f) => f.key === instrument) ?? flows[0];

  // No data yet (cold start / upstream unreachable) — never show mock, just wait.
  if (!flow) {
    return (
      <PageWrapper>
        <PageHeader
          badge="Market Structure"
          title="Option Flow"
          subtitle="Dealer positioning, session structure, and COT-driven weekly bias for NQ & GC."
        />
        <Card className="border-border/50">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            <RefreshCw className={cn("w-6 h-6 mx-auto mb-3 opacity-40", loading && "animate-spin")} />
            {loading ? "Loading live market data…" : "Live data is temporarily unavailable. Retrying shortly."}
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  const zones = flow.zones[timeframe];

  return (
    <PageWrapper>
      <PageHeader
        badge="Market Structure"
        title="Option Flow"
        subtitle="Dealer positioning, session structure, and COT-driven weekly bias for NQ & GC."
        action={
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end gap-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {loading ? "⏳ Loading…" : "🟢 Live · Yahoo"}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {format(new Date(flow.updatedAt), "HH:mm:ss")} · auto 60s
              </span>
            </div>
            <button
              onClick={() => void manualRefresh()}
              disabled={loading || cooldown > 0}
              title={cooldown > 0 ? `Available again in ${cooldown}s` : "Refresh live data"}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border/60 bg-card text-xs font-medium transition-all tabular-nums",
                "hover:border-primary/50 hover:text-primary disabled:opacity-50 disabled:pointer-events-none disabled:hover:border-border/60 disabled:hover:text-foreground"
              )}
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              <span className="hidden sm:inline">{cooldown > 0 ? `${cooldown}s` : "Refresh"}</span>
            </button>
          </div>
        }
      />

      {/* Instrument + bias summary */}
      <BiasSummary flows={flows} selected={instrument} onSelect={setInstrument} />

      {/* Selected bias hero */}
      <BiasHero flow={flow} />

      {/* Detail section */}
      <Card className="border-border/50">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Segmented
                options={INSTRUMENT_KEYS.map((k) => ({ value: k, label: k }))}
                value={instrument}
                onChange={setInstrument}
              />
              <span className="text-xs text-muted-foreground hidden sm:inline">{flow.label}</span>
            </div>
            <Segmented
              options={[
                { value: "intraday" as Timeframe, label: "Intraday" },
                { value: "weekly" as Timeframe, label: "Weekly" },
              ]}
              value={timeframe}
              onChange={setTimeframe}
            />
          </div>

          <Tabs defaultValue="zones">
            <TabsList variant="line" className="mb-4">
              <TabsTrigger value="zones">
                <Layers className="w-3.5 h-3.5" /> Zones
              </TabsTrigger>
              <TabsTrigger value="session">
                <Target className="w-3.5 h-3.5" /> Session Levels
              </TabsTrigger>
              <TabsTrigger value="greeks">
                <Waves className="w-3.5 h-3.5" /> Greeks
              </TabsTrigger>
              <TabsTrigger value="cot">
                <Activity className="w-3.5 h-3.5" /> COT & Bias
              </TabsTrigger>
            </TabsList>

            <TabsContent value="zones">
              <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                <Gauge className="w-3.5 h-3.5" />
                <span>
                  {timeframe === "weekly" ? "Weekly" : "Intraday"} confluence zones · spot{" "}
                  <span className="text-primary font-semibold tabular-nums">{fmtPrice(flow.spot, instrument)}</span>
                  {flow.oi.pcr !== null ? (
                    <>
                      {" "}· PCR {flow.oi.pcr} ({flow.oi.pcr_bias}) · Max pain{" "}
                      {fmtPrice(flow.oi.max_pain, instrument)} · GEX flip {fmtPrice(flow.oi.gex_flip, instrument)}
                    </>
                  ) : (
                    <span className="text-muted-foreground/60"> · PCR/GEX n/a (free feed)</span>
                  )}
                </span>
              </div>
              <ZonesPanel zones={zones} spot={flow.spot} instKey={instrument} />
            </TabsContent>

            <TabsContent value="session">
              <SessionLevelsPanel levels={flow.sessionLevels} spot={flow.spot} instKey={instrument} />
            </TabsContent>

            <TabsContent value="greeks">
              {flow.greeks ? (
                <GreeksPanel greeks={flow.greeks} spot={flow.spot} instKey={instrument} />
              ) : (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  <Waves className="w-6 h-6 mx-auto mb-2 opacity-40" />
                  Options proxy data unavailable right now (Yahoo rate limit or market closed).
                  <br />
                  Hit refresh in a moment — GEX/DEX come from {instrument === "NQ" ? "QQQ" : "GLD"} options.
                </div>
              )}
            </TabsContent>

            <TabsContent value="cot">
              <CotPanel flow={flow} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
