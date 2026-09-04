"use client";

/**
 * CALENDAR — the most recent US macro releases as clean cards: latest actual,
 * change vs the prior print, a 12-period trend, reference period and cadence.
 * Consensus and forward-dated events need a paid provider and are shown as
 * unavailable rather than invented. Objective only.
 */
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useGmi, FRESHNESS_LABEL, toneFor } from "@/lib/gmi/client";
import type { CalendarEntry } from "@/lib/gmi/calendar";
import { Panel, Unavailable, Segmented, a } from "../panel";
import { Sparkline } from "../sparkline";

const IMPORTANCE: Record<string, { label: string; color: string }> = {
  high: { label: "High", color: "var(--destructive)" },
  medium: { label: "Medium", color: "var(--warning)" },
  low: { label: "Low", color: "var(--muted-foreground)" },
};

function fmtVal(v: number | null, unit: string): string {
  if (v == null) return "—";
  if (unit === "%") return `${v.toFixed(1)}%`;
  if (unit === "count") return Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(v);
  if (unit === "kpersons") return `${(v / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`;
  if (unit === "$B") return `$${(v / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })}T`;
  if (unit === "$M") return `$${(v / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}B`;
  return v.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function fmtDelta(v: number, unit: string): string {
  const s = v > 0 ? "+" : "";
  if (unit === "%") return `${s}${(v * 100).toFixed(0)}bp`;
  if (unit === "kpersons") return `${s}${v.toFixed(0)}k`; // FRED already in thousands
  if (unit === "count") return `${s}${Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(v)}`;
  return `${s}${fmtVal(v, unit)}`;
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
];

export function CalendarTab() {
  const { env } = useGmi<CalendarEntry[]>("/api/gmi/calendar", 30 * 60_000);
  const [imp, setImp] = useState("all");
  const entries = useMemo(() => env?.data ?? [], [env]);

  const filtered = useMemo(
    () => entries.filter((e) => imp === "all" || e.importance === imp),
    [entries, imp]
  );

  return (
    <Panel
      eyebrow="Macro"
      title="Recent US economic releases"
      subtitle="Actual, prior print and trend — by reference period"
      env={env}
      action={<Segmented options={FILTERS} value={imp} onChange={setImp} />}
    >
      {env?.status === "unavailable" ? (
        <Unavailable hint="FRED is temporarily unavailable." />
      ) : filtered.length === 0 ? (
        <Unavailable label="Loading releases…" />
      ) : (
        <>
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((e) => {
              const delta = e.actual != null && e.previous != null ? e.actual - e.previous : null;
              const cfg = IMPORTANCE[e.importance];
              return (
                <div
                  key={e.id}
                  className="group relative overflow-hidden rounded-xl border border-border/50 bg-muted/[0.06] p-3.5 transition-colors hover:border-border"
                >
                  {/* Importance reads as a spine, not a badge */}
                  <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ background: cfg.color }} />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: `radial-gradient(90% 60% at 0% 0%, ${a(cfg.color, 8)}, transparent 60%)` }}
                  />

                  <div className="relative flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">{e.label}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {e.referenceDate ? format(new Date(e.referenceDate + "T12:00:00"), "MMM yyyy") : "—"}
                        <span className="ml-1.5 uppercase tracking-wider text-muted-foreground/50">{FRESHNESS_LABEL[e.freshness]}</span>
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-[9px] font-bold uppercase tracking-wider" style={{ color: cfg.color }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.color }} />
                      {cfg.label}
                    </span>
                  </div>

                  <div className="relative mt-3 flex items-end justify-between gap-3">
                    <div>
                      <div className="font-mono text-2xl font-bold leading-none tabular-nums text-foreground">{fmtVal(e.actual, e.unit)}</div>
                      {delta != null && (
                        <div className="mt-1.5 font-mono text-[11px] font-semibold tabular-nums" style={{ color: toneFor(delta) }}>
                          {delta > 0 ? "▲" : delta < 0 ? "▼" : "▬"} {fmtDelta(delta, e.unit)} vs prev
                        </div>
                      )}
                    </div>
                    {e.history.length > 2 && <Sparkline data={e.history.map((h) => h.value)} width={92} height={32} />}
                  </div>

                  <div className="relative mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[10px] text-muted-foreground/60">
                    <span>Prev <span className="font-mono tabular-nums text-muted-foreground/80">{fmtVal(e.previous, e.unit)}</span></span>
                    <span>Consensus n/a</span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 border-t border-border/40 pt-2.5 text-[10px] leading-relaxed text-muted-foreground/70">
            Actual, prior & trend from FRED by reference period. Market consensus, exact release clock-times and
            forward-dated events (ISM/PMI, auctions, central-bank speakers) require a dedicated calendar provider —
            shown as unavailable rather than estimated.
          </p>
        </>
      )}
    </Panel>
  );
}
