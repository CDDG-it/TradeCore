"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  ArrowUp, ArrowDown, Minus, RefreshCw, Loader2, AlertTriangle,
  TrendingUp, Activity, AlertOctagon, Info, ChevronDown, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BondSnapshot, CurveShape, Spread, Tenor } from "@/lib/bonds/types";

const TURQUOISE = "#14B8A6";
const CYAN = "#06B6D4";

const SHAPE_META: Record<CurveShape, { icon: typeof TrendingUp; tone: string; ring: string }> = {
  normal: { icon: TrendingUp, tone: "text-success", ring: "border-success/25 bg-success/5" },
  flat: { icon: Activity, tone: "text-warning", ring: "border-warning/25 bg-warning/5" },
  inverted: { icon: AlertOctagon, tone: "text-destructive", ring: "border-destructive/25 bg-destructive/5" },
};

const fmtBps = (n: number | null) => (n == null ? "—" : `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n)} bp`);

/** Rising yields are not "good" or "bad", so changes use a neutral accent. */
function ChangeChip({ bps }: { bps: number | null }) {
  if (bps == null) return <span className="text-[10px] text-muted-foreground">—</span>;
  const up = bps > 0;
  const flat = bps === 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-bold tabular-nums",
        flat ? "bg-muted/50 text-muted-foreground" : up ? "bg-primary/12 text-primary" : "bg-[#06B6D4]/12 text-[#06B6D4]"
      )}
    >
      {flat ? <Minus className="w-2.5 h-2.5" /> : up ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
      {Math.abs(bps)}
    </span>
  );
}

/**
 * Bond Yields — the US Treasury curve, live from the Treasury's own daily
 * publication, with the spreads and plain-language reads that matter to an
 * index and commodity trader.
 */
export function BondYields() {
  const [snapshot, setSnapshot] = useState<BondSnapshot | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [stale, setStale] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showMethod, setShowMethod] = useState(false);
  const [histRange, setHistRange] = useState<60 | 120>(120);

  async function load(manual = false) {
    if (manual) setRefreshing(true);
    try {
      const res = await fetch("/api/bonds", { cache: "no-store" });
      const data = await res.json();
      if (data?.snapshot?.tenors?.length) {
        setSnapshot(data.snapshot);
        setStale(Boolean(data.stale));
        setStatus("ready");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const curveData = useMemo(
    () => (snapshot?.tenors ?? []).map((t) => ({ ...t, x: Math.log(t.years) })),
    [snapshot]
  );
  const histData = useMemo(
    () => (snapshot?.history ?? []).slice(-histRange),
    [snapshot, histRange]
  );

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading the Treasury curve…</p>
      </div>
    );
  }

  if (status === "error" || !snapshot) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <AlertTriangle className="w-6 h-6 text-warning" />
        <p className="text-sm text-muted-foreground max-w-sm">
          The US Treasury feed is unreachable right now. Yields publish once per business day — try again in a moment.
        </p>
        <button
          onClick={() => load(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/40"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  const shape = SHAPE_META[snapshot.shape];
  const ShapeIcon = shape.icon;
  const key10 = snapshot.tenors.find((t) => t.key === "10Y");
  const key2 = snapshot.tenors.find((t) => t.key === "2Y");
  const key30 = snapshot.tenors.find((t) => t.key === "30Y");

  return (
    <div className="space-y-4">
      {/* Freshness */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-60", stale ? "bg-warning" : "bg-success animate-ping")} />
            <span className={cn("relative inline-flex h-2 w-2 rounded-full", stale ? "bg-warning" : "bg-success")} />
          </span>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">US Treasury par yield curve</span>
            {" · "}close of {format(new Date(snapshot.date + "T12:00:00"), "MMM d, yyyy")}
            {stale && <span className="text-warning"> · cached</span>}
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/40 disabled:opacity-60"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} /> Refresh
        </button>
      </div>

      {/* Headline: curve shape read */}
      <div className={cn("rounded-2xl border p-4", shape.ring)}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card">
            <ShapeIcon className={cn("w-5 h-5", shape.tone)} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Curve read</span>
              <span className={cn("text-sm font-bold", shape.tone)}>{snapshot.readLabel}</span>
            </div>
            <p className="mt-1 text-sm leading-snug text-foreground/85">{snapshot.readDetail}</p>
          </div>
        </div>
      </div>

      {/* Headline tenors */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[key2, key10, key30].map((t) =>
          t ? <HeadlineTenor key={t.key} tenor={t} /> : null
        )}
      </div>

      {/* Curve + spreads */}
      <div className="grid gap-3 lg:grid-cols-3">
        {/* Yield curve */}
        <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card p-4">
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <p className="text-sm font-semibold">Today&apos;s yield curve</p>
            <p className="text-[11px] text-muted-foreground">yield by maturity</p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curveData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  interval="preserveStartEnd"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v) => `${Number(v).toFixed(1)}%`}
                  domain={["dataMin - 0.15", "dataMax + 0.15"]}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)", border: "1px solid var(--border)",
                    borderRadius: 12, fontSize: 12,
                  }}
                  formatter={(v) => [`${Number(v ?? 0).toFixed(2)}%`, "Yield"]}
                />
                {/* Entry animation is off: ResponsiveContainer can report a -1
                    first measurement, which leaves the animated path stuck at
                    zero length while the dots still draw. */}
                <Line
                  type="monotone" dataKey="yield" stroke={TURQUOISE} strokeWidth={2.5}
                  dot={{ r: 3, fill: TURQUOISE, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spreads */}
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold mb-2.5">Key spreads</p>
          <div className="space-y-2.5">
            {snapshot.spreads.map((s) => <SpreadRow key={s.key} spread={s} />)}
          </div>
        </div>
      </div>

      {/* History */}
      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
          <p className="text-sm font-semibold">Yields over time</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 text-[11px]">
              <LegendDot color={CYAN} label="2 yr" />
              <LegendDot color={TURQUOISE} label="10 yr" />
              <LegendDot color="#8b5cf6" label="30 yr" />
            </div>
            <div className="flex rounded-lg border border-border/60 overflow-hidden">
              {([60, 120] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setHistRange(r)}
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-semibold transition-colors",
                    histRange === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {r}d
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={histData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickFormatter={(d: string) => format(new Date(d + "T12:00:00"), "MMM d")}
                interval="preserveStartEnd"
                minTickGap={40}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickFormatter={(v) => `${Number(v).toFixed(1)}%`}
                domain={["dataMin - 0.1", "dataMax + 0.1"]}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)", border: "1px solid var(--border)",
                  borderRadius: 12, fontSize: 12,
                }}
                labelFormatter={(d) => format(new Date(String(d) + "T12:00:00"), "MMM d, yyyy")}
                formatter={(v, name) => [`${Number(v ?? 0).toFixed(2)}%`, String(name)]}
              />
              <ReferenceLine y={0} stroke="var(--border)" />
              <Line type="monotone" dataKey="y2" name="2 yr" stroke={CYAN} strokeWidth={1.8} dot={false} connectNulls isAnimationActive={false} />
              <Line type="monotone" dataKey="y10" name="10 yr" stroke={TURQUOISE} strokeWidth={2.2} dot={false} connectNulls isAnimationActive={false} />
              <Line type="monotone" dataKey="y30" name="30 yr" stroke="#8b5cf6" strokeWidth={1.8} dot={false} connectNulls isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Full curve table */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        <p className="px-4 pt-4 pb-2 text-sm font-semibold">Every maturity</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-y border-border/50 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2 text-left font-semibold">Maturity</th>
                <th className="px-3 py-2 text-right font-semibold">Yield</th>
                <th className="px-3 py-2 text-right font-semibold">1 day</th>
                <th className="px-3 py-2 text-right font-semibold">1 week</th>
                <th className="px-4 py-2 text-right font-semibold">1 month</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {snapshot.tenors.map((t) => (
                <tr key={t.key} className="transition-colors hover:bg-muted/25">
                  <td className="px-4 py-2 font-semibold">{t.label}</td>
                  <td className="px-3 py-2 text-right font-bold tabular-nums" style={{ color: TURQUOISE }}>
                    {t.yield.toFixed(2)}%
                  </td>
                  <td className="px-3 py-2 text-right"><ChangeChip bps={t.chgDay} /></td>
                  <td className="px-3 py-2 text-right"><ChangeChip bps={t.chgWeek} /></td>
                  <td className="px-4 py-2 text-right"><ChangeChip bps={t.chgMonth} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Method + sources */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        <button
          onClick={() => setShowMethod((v) => !v)}
          className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/30"
        >
          <Info className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-semibold flex-1">Why yields matter to your trading — and where the data comes from</span>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", showMethod && "rotate-180")} />
        </button>

        {showMethod && (
          <div className="border-t border-border/50 px-4 py-4 space-y-4 text-xs leading-relaxed text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground mb-1.5">What a yield actually is</p>
              <p>
                The yield is the annual return on lending money to the US government for a given term. It is the
                <span className="font-semibold text-foreground"> risk-free rate</span> every other asset is priced against.
                Bond prices and yields move inversely: when yields rise, existing bonds are worth less, because newer ones pay more.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-1.5">Reading the curve</p>
              <ul className="space-y-1.5">
                <li><span className="font-semibold text-foreground">Short end (1M–2Y)</span> — tracks what the market thinks the Fed will do next. It moves on policy expectations.</li>
                <li><span className="font-semibold text-foreground">Long end (10Y–30Y)</span> — tracks long-run growth, inflation and fiscal risk. It moves on the economy, not the next meeting.</li>
                <li><span className="font-semibold text-foreground">Normal</span> — long yields above short. Lenders are paid for duration risk; the healthy shape.</li>
                <li><span className="font-semibold text-foreground">Inverted</span> — short above long. The market expects rates to be cut, i.e. a slowdown. Historically preceded recessions by 6–18 months, but with a long and unreliable lag.</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-1.5">Why an index trader watches this</p>
              <ul className="space-y-1.5">
                <li><span className="font-semibold text-foreground">NQ is the rate-sensitive one.</span> Tech earnings sit far in the future, so a higher discount rate cuts their present value hardest. Sharp 10-year moves usually hit the Nasdaq before the Dow.</li>
                <li><span className="font-semibold text-foreground">Speed beats level.</span> A 4.7% ten-year is not itself a problem; the market breaks on a fast repricing. A 15–20 bp move in a day is the kind that moves ES and NQ.</li>
                <li><span className="font-semibold text-foreground">Gold trades against real yields.</span> Gold pays no coupon, so rising real yields raise its opportunity cost — and falling real yields are its strongest tailwind.</li>
                <li><span className="font-semibold text-foreground">The 2-year is the Fed proxy.</span> When it moves hard, expectations for policy just changed, which is the fastest read on a CPI or jobs surprise.</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-1.5">Timing</p>
              <p>
                The Treasury publishes the par yield curve once per business day, based on
                <span className="font-semibold text-foreground"> roughly 3:30 pm ET bid-side quotes</span>. So this is an
                end-of-day series, not a live feed: intraday it will lag the futures market. Basis points (bp) are hundredths
                of a percent — 0.25% = 25 bp.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-1.5">Sources</p>
              <ul className="space-y-1">
                <li>
                  <a href="https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline">
                    US Treasury — Daily Treasury Par Yield Curve Rates <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-muted-foreground/70"> — the exact series this tab reads.</span>
                </li>
                <li>
                  <a href="https://home.treasury.gov/policy-issues/financing-the-government/interest-rate-statistics" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline">
                    US Treasury — Interest rate statistics <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-muted-foreground/70"> — how the par curve is constructed and quoted.</span>
                </li>
                <li>
                  <a href="https://www.newyorkfed.org/research/capital_markets/ycfaq" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline">
                    NY Fed — Yield curve as a recession predictor <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-muted-foreground/70"> — the research behind the 3M/10Y signal.</span>
                </li>
              </ul>
              <p className="mt-2 text-muted-foreground/70">
                Public-domain US government data, no API key, fetched server-side and refreshed hourly. Yields are shown exactly
                as published; only the changes, spreads and the curve read are computed, by the rules stated above.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── One headline tenor card ────────────────────────────────────────────── */
function HeadlineTenor({ tenor }: { tenor: Tenor }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:border-primary/30">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {tenor.label} Treasury
        </p>
        <ChangeChip bps={tenor.chgDay} />
      </div>
      <p className="mt-1.5 text-3xl font-black tabular-nums leading-none" style={{ color: TURQUOISE }}>
        {tenor.yield.toFixed(2)}<span className="text-lg">%</span>
      </p>
      <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
        <span>1w {fmtBps(tenor.chgWeek)}</span>
        <span>1m {fmtBps(tenor.chgMonth)}</span>
      </div>
    </div>
  );
}

/* ── One spread row ─────────────────────────────────────────────────────── */
function SpreadRow({ spread }: { spread: Spread }) {
  const color = spread.inverted ? "var(--color-destructive)" : "var(--color-success)";
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-bold">{spread.label}</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-black tabular-nums" style={{ color }}>
            {spread.bps > 0 ? "+" : spread.bps < 0 ? "−" : ""}{Math.abs(spread.bps)}
          </span>
          <span className="text-[10px] text-muted-foreground">bp</span>
          <ChangeChip bps={spread.chgDay} />
        </div>
      </div>
      <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{spread.meaning}</p>
      {spread.inverted && (
        <p className="mt-1 text-[10px] font-semibold text-destructive">Inverted</p>
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
