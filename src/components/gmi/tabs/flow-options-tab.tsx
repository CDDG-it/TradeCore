"use client";

/**
 * 06 POSITIONING — who is holding what.
 *
 * The CFTC's weekly Commitments of Traders report, read as a board rather than
 * a stack of cards: one line per futures market, the selected line opened up
 * beside it. Large speculators lead because they are the directional money;
 * commercials sit opposite them by construction, so "short" there is hedging,
 * not a bet.
 *
 * Tuesday's positions, published Friday — weekly by nature, never realtime, and
 * labelled that way. ETF creation flow is not on the free sources this desk
 * uses, so it is stated as missing rather than estimated.
 */
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import type { CotInstrument, CotGroup, CotSnapshot } from "@/lib/cot/types";
import { Pane, Empty, Label, Switch } from "../pane";
import { Sparkline } from "../sparkline";

const GROUPS = [
  { key: "all", label: "All" },
  { key: "index", label: "Indices" },
  { key: "metal", label: "Metals" },
  { key: "energy", label: "Energy" },
];

/** Tone per derived read — colour only, the words carry the meaning. */
const SIGNAL_TONE: Record<string, string> = {
  "crowded-long": "var(--destructive)",
  "crowded-short": "var(--chart-2)",
  "building-long": "var(--success)",
  "building-short": "var(--destructive)",
  flipped: "var(--warning)",
  unwinding: "var(--muted-foreground)",
  balanced: "var(--muted-foreground)",
};

const compact = (n: number) => {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  return abs >= 1000 ? `${sign}${(abs / 1000).toFixed(1)}k` : `${sign}${Math.round(abs)}`;
};
const signed = (n: number) => `${n > 0 ? "+" : ""}${compact(n)}`;

/** Where this week sits in its own one-year range, as a rail with a marker. */
function RangeRail({ value }: { value: number }) {
  return (
    <span className="relative block h-[7px] w-full border-x border-border/40 bg-muted/20">
      <span aria-hidden className="absolute inset-y-0 left-1/2 w-px bg-border/50" />
      <span
        className="absolute top-[-2px] h-[11px] w-[2px]"
        style={{
          left: `calc(${Math.min(100, Math.max(0, value))}% - 1px)`,
          background: value > 80 ? "var(--destructive)" : value < 20 ? "var(--chart-2)" : "var(--primary)",
        }}
      />
    </span>
  );
}

export function FlowOptionsTab() {
  const [snapshot, setSnapshot] = useState<CotSnapshot | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [stale, setStale] = useState(false);
  const [group, setGroup] = useState("all");
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cot", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { snapshot: CotSnapshot | null; stale?: boolean }) => {
        if (cancelled) return;
        if (data?.snapshot) {
          setSnapshot(data.snapshot);
          setStale(Boolean(data.stale));
          setStatus("ready");
        } else {
          setStatus("error");
        }
      })
      .catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; };
  }, []);

  const rows = useMemo(() => {
    const list = snapshot?.instruments ?? [];
    const filtered = group === "all" ? list : list.filter((i) => i.group === (group as CotGroup));
    // Lead with the markets where positioning is actually saying something.
    return [...filtered].sort(
      (x, y) => y.signal.weight - x.signal.weight || Math.abs(y.cotIndex - 50) - Math.abs(x.cotIndex - 50)
    );
  }, [snapshot, group]);

  const selected: CotInstrument | null = rows.find((r) => r.symbol === picked) ?? rows[0] ?? null;
  const longs = (snapshot?.instruments ?? []).filter((i) => i.bias === "long").length;
  const shorts = (snapshot?.instruments ?? []).filter((i) => i.bias === "short").length;

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-2 lg:grid-cols-12">
      {/* ── The board ─────────────────────────────────────────────────── */}
      <Pane
        index="01"
        label="CFTC Commitments of Traders"
        right={
          <span className="flex items-center gap-4">
            <Switch options={GROUPS} value={group} onChange={setGroup} />
            <span className="hidden text-[11px] font-semibold uppercase tracking-wider md:inline">
              <span className="text-success">{longs} net long</span>
              <span className="mx-1.5 text-foreground/65">/</span>
              <span className="text-destructive">{shorts} net short</span>
            </span>
          </span>
        }
        bodyClassName="flex flex-col p-0"
        className="lg:col-span-8"
      >
        {status === "loading" ? (
          <Empty label="Loading CFTC positioning" />
        ) : status === "error" ? (
          <Empty label="CFTC feed unreachable" hint="The report updates weekly; the desk will pick it up on the next load." />
        ) : (
          <>
            <div className="grid shrink-0 grid-cols-[2.6rem_1fr_4.4rem_3.8rem_7rem_5rem_1fr] items-center gap-x-2 border-b border-border/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/65">
              <span>Sym</span>
              <span>Market</span>
              <span className="text-right">Net specs</span>
              <span className="text-right">Δ week</span>
              <span>1-yr range</span>
              <span className="text-right">Net/OI</span>
              <span className="pl-2">Read</span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {rows.map((inst) => {
                const on = inst.symbol === selected?.symbol;
                const tone = SIGNAL_TONE[inst.signal.kind] ?? "var(--muted-foreground)";
                return (
                  <button
                    key={inst.symbol}
                    onClick={() => setPicked(inst.symbol)}
                    className={`grid w-full grid-cols-[2.6rem_1fr_4.4rem_3.8rem_7rem_5rem_1fr] items-center gap-x-2 border-b border-border/20 px-3 py-[9px] text-left transition-colors ${
                      on ? "bg-primary/[0.09]" : "hover:bg-muted/20"
                    }`}
                  >
                    <span className={`font-mono text-[12px] font-bold tracking-[0.1em] ${on ? "text-primary" : "text-foreground/85"}`}>
                      {inst.symbol}
                    </span>
                    <span className="min-w-0 truncate text-[12px] text-foreground/80">{inst.label}</span>
                    <span
                      className="text-right text-[14px] font-bold tabular-nums"
                      style={{ color: inst.latest.netSpec >= 0 ? "var(--success)" : "var(--destructive)" }}
                    >
                      {signed(inst.latest.netSpec)}
                    </span>
                    <span
                      className="text-right text-[12px] tabular-nums"
                      style={{ color: inst.netSpecChg > 0 ? "var(--success)" : inst.netSpecChg < 0 ? "var(--destructive)" : "var(--muted-foreground)" }}
                    >
                      {signed(inst.netSpecChg)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <RangeRail value={inst.cotIndex} />
                      <span className="w-6 shrink-0 text-right text-[11px] tabular-nums text-foreground/75">
                        {Math.round(inst.cotIndex)}
                      </span>
                    </span>
                    <span className="text-right text-[12px] tabular-nums text-foreground/80">
                      {(inst.netShareOfOi * 100).toFixed(0)}%
                    </span>
                    <span className="min-w-0 truncate pl-2 text-[11px] font-semibold" style={{ color: tone }}>
                      {inst.signal.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="shrink-0 border-t border-border/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/65">
              {snapshot ? `Positions as of Tuesday ${format(new Date(snapshot.reportDate + "T12:00:00"), "d MMM yyyy")}` : ""}
              {stale && " · served from cache"} · 1-yr range: 0 = most short in a year, 100 = most long
            </p>
          </>
        )}
      </Pane>

      {/* ── The selected market ───────────────────────────────────────── */}
      <div className="flex min-h-0 flex-col gap-2 lg:col-span-4">
        <Pane
          index="02"
          label={selected ? `${selected.symbol} · ${selected.label}` : "Market"}
          scroll
          className="min-h-0 flex-1"
        >
          {!selected ? (
            <Empty label="No market selected" />
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="block">Large speculators, net</Label>
                <div className="mt-1 flex items-baseline gap-2">
                  <span
                    className="text-[32px] font-black leading-none tabular-nums"
                    style={{ color: selected.latest.netSpec >= 0 ? "var(--success)" : "var(--destructive)" }}
                  >
                    {signed(selected.latest.netSpec)}
                  </span>
                  <span className="text-[13px] tabular-nums text-foreground/80">
                    {signed(selected.netSpecChg)} on the week
                  </span>
                </div>
              </div>

              {/* Who is on which side — the three groups, as one bar each */}
              <div className="space-y-2">
                <Label className="block">Long share of each group</Label>
                {[
                  { k: "Large specs", long: selected.latest.specLong, short: selected.latest.specShort },
                  { k: "Commercials", long: selected.latest.commLong, short: selected.latest.commShort },
                  { k: "Small traders", long: selected.latest.retailLong, short: selected.latest.retailShort },
                ].map(({ k, long, short }) => {
                  const total = long + short || 1;
                  const pct = (long / total) * 100;
                  return (
                    <div key={k} className="flex items-center gap-2">
                      <span className="w-[76px] shrink-0 text-[11px] text-foreground/80">{k}</span>
                      <span className="relative h-[7px] flex-1 overflow-hidden bg-destructive/45">
                        <span className="absolute inset-y-0 left-0 bg-success/70" style={{ width: `${pct}%` }} />
                      </span>
                      <span className="w-8 shrink-0 text-right text-[12px] tabular-nums text-foreground/85">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* A year of net positioning */}
              {selected.history.length > 2 && (
                <div>
                  <Label className="block">Net position · past year</Label>
                  <div className="mt-1.5 border border-border/30 bg-muted/[0.05] p-2">
                    <Sparkline data={selected.history.map((h) => h.netSpec)} width={280} height={44} strokeWidth={1.3} className="w-full" />
                  </div>
                  <div className="mt-1 flex justify-between text-[11px] font-semibold uppercase tracking-wider text-foreground/65">
                    <span>{format(new Date(selected.history[0].date + "T12:00:00"), "MMM yy")}</span>
                    <span>open interest {compact(selected.latest.openInterest)} · {signed(selected.oiChg)} wk</span>
                  </div>
                </div>
              )}

              {/* The read, in words */}
              <div className="border-l-2 pl-2.5" style={{ borderColor: SIGNAL_TONE[selected.signal.kind] }}>
                <p className="text-[12px] font-semibold" style={{ color: SIGNAL_TONE[selected.signal.kind] }}>
                  {selected.signal.label}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-foreground/80">{selected.signal.detail}</p>
              </div>
            </div>
          )}
        </Pane>

        <Pane index="03" label="ETF creations & redemptions" className="h-[120px] shrink-0">
          <Empty
            label="Not available"
            hint="Reliable QQQ / SPY / IWM flow isn't on the free sources this desk uses. Wire up a provider and this pane fills itself."
          />
        </Pane>
      </div>
    </div>
  );
}
