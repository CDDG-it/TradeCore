"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  ArrowUp, ArrowDown, Minus, RefreshCw, Loader2, AlertTriangle,
  Flame, Snowflake, RotateCcw, TrendingUp, TrendingDown, Scale, ExternalLink, Info, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CotInstrument, CotGroup, CotSnapshot, CotSignalKind } from "@/lib/cot/types";

const GROUP_LABEL: Record<CotGroup | "all", string> = {
  all: "All markets",
  index: "Indices",
  metal: "Metals",
  energy: "Energy",
};
const GROUPS: (CotGroup | "all")[] = ["all", "index", "metal", "energy"];

/** Icon + tone per derived signal, so the read is scannable at a glance. */
const SIGNAL_META: Record<CotSignalKind, { icon: typeof Flame; tone: string }> = {
  "crowded-long": { icon: Flame, tone: "text-destructive" },
  "crowded-short": { icon: Snowflake, tone: "text-primary" },
  "building-long": { icon: TrendingUp, tone: "text-success" },
  "building-short": { icon: TrendingDown, tone: "text-destructive" },
  flipped: { icon: RotateCcw, tone: "text-warning" },
  unwinding: { icon: Minus, tone: "text-muted-foreground" },
  balanced: { icon: Scale, tone: "text-muted-foreground" },
};

const compact = (n: number) => {
  const a = Math.abs(n);
  const s = n < 0 ? "-" : "";
  return a >= 1000 ? `${s}${(a / 1000).toFixed(1)}k` : `${s}${a}`;
};
const signed = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${compact(Math.abs(n))}`;

/**
 * COT Flow — where the big money is positioned.
 *
 * Reads the CFTC's weekly Commitment of Traders report (live, via /api/cot) and
 * turns it into one explainable read per futures market: how large speculators
 * lean, how that shifted this week, how crowded the bet is against its own
 * one-year range, and what that historically implies.
 */
export function CotFlow() {
  const [snapshot, setSnapshot] = useState<CotSnapshot | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [stale, setStale] = useState(false);
  const [group, setGroup] = useState<CotGroup | "all">("all");
  const [refreshing, setRefreshing] = useState(false);
  const [showMethod, setShowMethod] = useState(false);

  async function load(manual = false) {
    if (manual) setRefreshing(true);
    try {
      const res = await fetch("/api/cot", { cache: "no-store" });
      const data = await res.json();
      if (data?.snapshot?.instruments?.length) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const instruments = useMemo(() => {
    const list = snapshot?.instruments ?? [];
    const filtered = group === "all" ? list : list.filter((i) => i.group === group);
    // Lead with the markets where positioning is actually saying something.
    return [...filtered].sort((a, b) => b.signal.weight - a.signal.weight || Math.abs(b.cotIndex - 50) - Math.abs(a.cotIndex - 50));
  }, [snapshot, group]);

  const headline = instruments.find((i) => i.signal.weight === 2) ?? instruments[0];

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading CFTC positioning…</p>
      </div>
    );
  }

  if (status === "error" || !snapshot) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <AlertTriangle className="w-6 h-6 text-warning" />
        <p className="text-sm text-muted-foreground max-w-sm">
          The CFTC feed is unreachable right now. COT data updates weekly — try again in a moment.
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

  return (
    <div className="space-y-4">
      {/* Freshness + refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-60", stale ? "bg-warning" : "bg-success animate-ping")} />
            <span className={cn("relative inline-flex h-2 w-2 rounded-full", stale ? "bg-warning" : "bg-success")} />
          </span>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">CFTC Commitment of Traders</span>
            {" · "}positions as of Tuesday {format(new Date(snapshot.reportDate + "T12:00:00"), "MMM d, yyyy")}
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

      {/* Headline read — the one market positioning is shouting about */}
      {headline && <HeadlineRead inst={headline} />}

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg border border-border/60 overflow-hidden">
          {GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors",
                group === g ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {GROUP_LABEL[g]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold text-success">
            <ArrowUp className="w-3.5 h-3.5" /> {instruments.filter((i) => i.bias === "long").length} net long
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-destructive">
            <ArrowDown className="w-3.5 h-3.5" /> {instruments.filter((i) => i.bias === "short").length} net short
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {instruments.map((inst) => (
          <CotCard key={inst.symbol} inst={inst} />
        ))}
      </div>

      {/* Method + sources */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        <button
          onClick={() => setShowMethod((v) => !v)}
          className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/30"
        >
          <Info className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-semibold flex-1">How to read this — and where the data comes from</span>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", showMethod && "rotate-180")} />
        </button>

        {showMethod && (
          <div className="border-t border-border/50 px-4 py-4 space-y-4 text-xs leading-relaxed text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground mb-1.5">The three groups in every futures market</p>
              <ul className="space-y-1.5">
                <li>
                  <span className="font-semibold text-foreground">Large speculators</span> (non-commercial) — hedge funds,
                  CTAs and managed money trading for profit. Directional, trend-following, and the group this dashboard leads
                  with: their net position is the headline number.
                </li>
                <li>
                  <span className="font-semibold text-foreground">Commercials</span> — producers, miners and industrial
                  hedgers using futures to offset real exposure. They are structurally the other side of the specs, so they
                  usually sit opposite. Being &quot;short&quot; here is hedging, not a bet.
                </li>
                <li>
                  <span className="font-semibold text-foreground">Small traders</span> (non-reportable) — positions below the
                  CFTC reporting threshold, i.e. retail.
                </li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-1.5">What the numbers mean</p>
              <ul className="space-y-1.5">
                <li><span className="font-semibold text-foreground">Net position</span> = longs − shorts, in contracts. Positive = net long.</li>
                <li><span className="font-semibold text-foreground">1-yr positioning (COT index)</span> = where this week&apos;s net sits inside its own past-52-week range. 100 = most net long in a year, 0 = most net short. It is relative to the market&apos;s own history, which is why 20k contracts can be &quot;extreme&quot; in one market and ordinary in another.</li>
                <li><span className="font-semibold text-foreground">Weekly change</span> = this week&apos;s net minus last week&apos;s. Direction of travel matters more than the level.</li>
                <li><span className="font-semibold text-foreground">% of OI</span> = the net bet as a share of all open contracts — how concentrated the positioning is.</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-1.5">Why crowding matters</p>
              <p>
                COT is a <span className="font-semibold text-foreground">contrarian-at-the-extremes</span> tool, not a timing
                signal. When specs are historically crowded on one side, the marginal buyer (or seller) is largely used up, and
                any shock forces the crowd to unwind into itself — which is what makes squeezes violent. Mid-range positioning
                carries little information. It says nothing about the next day; it frames risk over weeks.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-1.5">Timing — and its one real limitation</p>
              <p>
                Positions are measured at <span className="font-semibold text-foreground">Tuesday&apos;s close</span> and published
                <span className="font-semibold text-foreground"> Friday at 15:30 ET</span>. The data you are reading is therefore
                always at least three days old, and up to ten days old by the following Thursday. Treat it as context, never as
                an entry trigger.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-1.5">Sources</p>
              <ul className="space-y-1">
                <li>
                  <a href="https://publicreporting.cftc.gov/Trading-Reports/Legacy-Futures-Only/6dca-aqww" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline">
                    CFTC Public Reporting API — Legacy Futures-Only <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-muted-foreground/70"> — the exact dataset this page queries (resource 6dca-aqww).</span>
                </li>
                <li>
                  <a href="https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline">
                    CFTC — Commitments of Traders home <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-muted-foreground/70"> — release schedule and current reports.</span>
                </li>
                <li>
                  <a href="https://www.cftc.gov/MarketReports/CommitmentsofTraders/ExplanatoryNotes/index.htm" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline">
                    CFTC — Explanatory Notes <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-muted-foreground/70"> — official definitions of each trader category.</span>
                </li>
              </ul>
              <p className="mt-2 text-muted-foreground/70">
                Public-domain US government data, no API key, fetched server-side and refreshed hourly. Every figure shown is
                straight from the report — the only computed values are the 1-yr index, the weekly change and the read, all
                derived by the stated rules above.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Headline read — the market where positioning is most stretched ─────── */
function HeadlineRead({ inst }: { inst: CotInstrument }) {
  const meta = SIGNAL_META[inst.signal.kind];
  const Icon = meta.icon;
  const netColor = inst.bias === "long" ? "var(--color-success)" : inst.bias === "short" ? "var(--color-destructive)" : "var(--color-warning)";
  return (
    <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card">
          <Icon className={cn("w-5 h-5", meta.tone)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">This week&apos;s standout</span>
            <span className="font-mono text-sm font-black">{inst.symbol}</span>
            <span className={cn("text-xs font-bold", meta.tone)}>{inst.signal.label}</span>
          </div>
          <p className="mt-1 text-sm leading-snug text-foreground/85">{inst.signal.detail}</p>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Net{" "}
            <span className="font-bold tabular-nums" style={{ color: netColor }}>{signed(inst.latest.netSpec)}</span>
            {" · "}1-yr positioning <span className="font-bold tabular-nums text-foreground/70">{inst.cotIndex}/100</span>
            {" · "}week {signed(inst.netSpecChg)}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── One market card ──────────────────────────────────────────────────── */
function CotCard({ inst }: { inst: CotInstrument }) {
  const netColor =
    inst.bias === "long" ? "var(--color-success)" : inst.bias === "short" ? "var(--color-destructive)" : "var(--color-warning)";
  const chgUp = inst.netSpecChg > 0;
  const chgFlat = inst.netSpecChg === 0;
  const biasLabel = inst.bias === "long" ? "Net long" : inst.bias === "short" ? "Net short" : "Neutral";
  const meta = SIGNAL_META[inst.signal.kind];
  const SignalIcon = meta.icon;

  return (
    <div className="group rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:border-primary/30">
      {/* Head */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-base font-black font-mono tracking-tight leading-none">{inst.symbol}</p>
          <p className="text-[11px] text-muted-foreground mt-1">{inst.label}</p>
        </div>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
          style={{ background: `color-mix(in oklch, ${netColor} 14%, transparent)`, color: netColor }}
        >
          {inst.bias === "long" ? <ArrowUp className="w-3 h-3" /> : inst.bias === "short" ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {biasLabel}
        </span>
      </div>

      {/* Headline net-spec position + WoW change */}
      <div className="mt-3 flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Large specs net</p>
          <p className="text-2xl font-black tabular-nums leading-none mt-1" style={{ color: netColor }}>
            {signed(inst.latest.netSpec)}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-bold tabular-nums",
            chgFlat ? "bg-muted/50 text-muted-foreground" : chgUp ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive"
          )}
          title="Week-over-week change in net position"
        >
          {chgFlat ? <Minus className="w-3 h-3" /> : chgUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          {signed(inst.netSpecChg)}
        </span>
      </div>

      {/* Positioning ladder: who holds what */}
      <div className="mt-3 space-y-1.5">
        <GroupBar label="Specs" long={inst.latest.specLong} short={inst.latest.specShort} />
        <GroupBar label="Commercials" long={inst.latest.commLong} short={inst.latest.commShort} muted />
        <GroupBar label="Retail" long={inst.latest.retailLong} short={inst.latest.retailShort} muted />
      </div>

      {/* COT index (1-yr positioning) */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>1-yr positioning</span>
          <span className="tabular-nums text-foreground/70">{inst.cotIndex}/100</span>
        </div>
        <div
          className="relative mt-1.5 h-2 w-full rounded-full"
          style={{ background: "linear-gradient(90deg, color-mix(in oklch, var(--color-destructive) 45%, transparent), var(--muted), color-mix(in oklch, var(--color-success) 45%, transparent))" }}
        >
          <div
            className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card"
            style={{ left: `${inst.cotIndex}%`, background: netColor, boxShadow: `0 0 6px ${netColor}` }}
          />
        </div>
      </div>

      {/* Sparkline + open interest */}
      <div className="mt-3 flex items-center gap-3">
        <Sparkline history={inst.history} color={netColor} />
        <div className="text-right shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Open int.</p>
          <p className="text-xs font-bold tabular-nums">{compact(inst.latest.openInterest)}</p>
          <p className={cn("text-[10px] font-semibold tabular-nums", inst.oiChg > 0 ? "text-success" : inst.oiChg < 0 ? "text-destructive" : "text-muted-foreground")}>
            {signed(inst.oiChg)}
          </p>
        </div>
      </div>

      {/* The read */}
      <div className="mt-3 flex items-start gap-2 rounded-lg border border-border/50 bg-muted/20 px-2.5 py-2">
        <SignalIcon className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", meta.tone)} />
        <div className="min-w-0">
          <p className={cn("text-[11px] font-bold", meta.tone)}>{inst.signal.label}</p>
          <p className="text-[11px] leading-snug text-muted-foreground">{inst.signal.detail}</p>
        </div>
      </div>

      <p className="mt-2 text-right text-[10px] tabular-nums text-muted-foreground/60">
        Net = {(inst.netShareOfOi * 100).toFixed(1)}% of open interest
      </p>
    </div>
  );
}

/** Long/short split for one trader group. */
function GroupBar({ label, long, short, muted }: { label: string; long: number; short: number; muted?: boolean }) {
  const total = long + short;
  const pct = total > 0 ? (long / total) * 100 : 50;
  return (
    <div className="flex items-center gap-2">
      <span className={cn("w-16 shrink-0 text-[10px] font-medium", muted ? "text-muted-foreground/70" : "text-foreground/80")}>{label}</span>
      <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-muted/40">
        <div className={cn("h-full", muted ? "bg-success/45" : "bg-success")} style={{ width: `${pct}%` }} />
        <div className={cn("h-full", muted ? "bg-destructive/45" : "bg-destructive")} style={{ width: `${100 - pct}%` }} />
      </div>
      <span className="w-9 shrink-0 text-right text-[10px] font-semibold tabular-nums text-muted-foreground">{Math.round(pct)}%</span>
    </div>
  );
}

/* ── Net-position sparkline (1-year) with a zero baseline ──────────────── */
function Sparkline({ history, color }: { history: { date: string; netSpec: number }[]; color: string }) {
  const W = 132, H = 34;
  if (history.length < 2) return <div className="flex-1 h-[34px]" />;
  const vals = history.map((h) => h.netSpec);
  const min = Math.min(...vals, 0);
  const max = Math.max(...vals, 0);
  const range = max - min || 1;
  const x = (i: number) => (i / (history.length - 1)) * W;
  const y = (v: number) => H - ((v - min) / range) * H;
  const path = vals.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const zeroY = y(0);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="flex-1 overflow-visible" preserveAspectRatio="none">
      <line x1={0} x2={W} y1={zeroY} y2={zeroY} stroke="var(--border)" strokeWidth={1} strokeDasharray="2 2" />
      <path d={path} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(history.length - 1)} cy={y(vals[vals.length - 1])} r={2.4} fill={color} />
    </svg>
  );
}
