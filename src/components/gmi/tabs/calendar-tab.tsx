"use client";

/**
 * CALENDAR — the most recent US macro releases, as clean cards: latest actual,
 * change vs the prior print, a 12-period trend, reference period and cadence.
 * Consensus and forward-dated events need a paid provider and are shown as
 * unavailable rather than invented. Objective only.
 */
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useGmi, FRESHNESS_LABEL, toneFor } from "@/lib/gmi/client";
import type { CalendarEntry } from "@/lib/gmi/calendar";
import { Panel, Unavailable } from "../panel";
import { Sparkline } from "../sparkline";

const IMPORTANCE: Record<string, { label: string; stripe: string; chip: string }> = {
  high: { label: "High", stripe: "var(--destructive)", chip: "bg-destructive/12 text-destructive" },
  medium: { label: "Medium", stripe: "var(--warning)", chip: "bg-warning/12 text-warning" },
  low: { label: "Low", stripe: "var(--muted-foreground)", chip: "bg-muted/50 text-muted-foreground" },
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

export function CalendarTab() {
  const { env } = useGmi<CalendarEntry[]>("/api/gmi/calendar", 30 * 60_000);
  const [imp, setImp] = useState<"all" | "high" | "medium">("all");
  const entries = env?.data ?? [];

  const filtered = useMemo(
    () => entries.filter((e) => imp === "all" || e.importance === imp),
    [entries, imp]
  );

  return (
    <Panel
      title="Recent US economic releases"
      env={env}
      action={
        <div className="flex rounded-lg border border-border/60 overflow-hidden">
          {(["all", "high", "medium"] as const).map((k) => (
            <button key={k} onClick={() => setImp(k)} className={`px-2.5 py-1 text-[11px] font-semibold capitalize transition-colors ${imp === k ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>{k}</button>
          ))}
        </div>
      }
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
                <div key={e.id} className="relative overflow-hidden rounded-xl border border-border/50 bg-muted/10 p-3 pl-4">
                  <span className="absolute inset-y-0 left-0 w-1" style={{ background: cfg.stripe }} />
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">{e.label}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {e.referenceDate ? format(new Date(e.referenceDate + "T12:00:00"), "MMM yyyy") : "—"}
                        <span className="ml-1.5 uppercase tracking-wider text-muted-foreground/50">{FRESHNESS_LABEL[e.freshness]}</span>
                      </p>
                    </div>
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold ${cfg.chip}`}>{cfg.label}</span>
                  </div>

                  <div className="mt-2 flex items-end justify-between gap-2">
                    <div>
                      <div className="font-mono text-xl font-bold tabular-nums text-foreground">{fmtVal(e.actual, e.unit)}</div>
                      {delta != null && (
                        <div className="mt-0.5 font-mono text-[11px] font-semibold tabular-nums" style={{ color: toneFor(delta) }}>
                          {delta > 0 ? "▲" : delta < 0 ? "▼" : "▬"} {fmtDelta(delta, e.unit)} vs prev
                        </div>
                      )}
                    </div>
                    {e.history.length > 2 && <Sparkline data={e.history.map((h) => h.value)} width={84} height={30} />}
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground/60">
                    <span>Prev {fmtVal(e.previous, e.unit)}</span>
                    <span>Consensus n/a</span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[10px] text-muted-foreground/70">
            Actual, prior & trend from FRED by reference period. Market consensus, exact release clock-times and
            forward-dated events (ISM/PMI, auctions, central-bank speakers) require a dedicated calendar provider —
            shown as unavailable rather than estimated.
          </p>
        </>
      )}
    </Panel>
  );
}
