"use client";

/**
 * CALENDAR — the most recent US economic releases with their actual and prior
 * values (FRED). Consensus and forward-dated events need a paid calendar
 * provider; consensus is shown as unavailable, never invented. Objective only.
 */
import { format } from "date-fns";
import { useGmi, FRESHNESS_LABEL, toneFor } from "@/lib/gmi/client";
import type { CalendarEntry } from "@/lib/gmi/calendar";
import { Panel, Unavailable } from "../panel";

const IMPORTANCE: Record<string, { label: string; cls: string }> = {
  high: { label: "HIGH", cls: "bg-destructive/12 text-destructive" },
  medium: { label: "MED", cls: "bg-warning/12 text-warning" },
  low: { label: "LOW", cls: "bg-muted/50 text-muted-foreground" },
};

function fmtVal(v: number | null, unit: string): string {
  if (v == null) return "—";
  if (unit === "%") return `${v.toFixed(1)}%`;
  if (unit === "count") return Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(v); // e.g. 203K
  if (unit === "kpersons") return `${(v / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`; // FRED value is in thousands
  if (unit === "$B") return `$${(v / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })}T`;
  if (unit === "$M") return `$${(v / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}B`;
  return v.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

export function CalendarTab() {
  const { env } = useGmi<CalendarEntry[]>("/api/gmi/calendar", 30 * 60_000);
  const entries = env?.data ?? [];

  return (
    <Panel title="Recent US economic releases" env={env}>
      {env?.status === "unavailable" ? (
        <Unavailable hint="FRED is temporarily unavailable." />
      ) : entries.length === 0 ? (
        <Unavailable label="Loading releases…" />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/60 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-3 font-semibold">Release</th>
                  <th className="py-2 pr-3 font-semibold">Ref. period</th>
                  <th className="py-2 pr-3 text-right font-semibold">Actual</th>
                  <th className="py-2 pr-3 text-right font-semibold">Previous</th>
                  <th className="py-2 pr-3 text-right font-semibold">Consensus</th>
                  <th className="py-2 text-right font-semibold">Importance</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {entries.map((e) => {
                  const delta = e.actual != null && e.previous != null ? e.actual - e.previous : null;
                  const imp = IMPORTANCE[e.importance];
                  return (
                    <tr key={e.id} className="border-b border-border/40 last:border-0">
                      <td className="py-2 pr-3">
                        <span className="font-medium text-foreground">{e.label}</span>
                        <span className="ml-2 text-[9px] uppercase tracking-wider text-muted-foreground/60">{FRESHNESS_LABEL[e.freshness]}</span>
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {e.referenceDate ? format(new Date(e.referenceDate + "T12:00:00"), "MMM yyyy") : "—"}
                      </td>
                      <td className="py-2 pr-3 text-right font-mono font-semibold text-foreground">{fmtVal(e.actual, e.unit)}</td>
                      <td className="py-2 pr-3 text-right font-mono text-muted-foreground">
                        {fmtVal(e.previous, e.unit)}
                        {delta != null && (
                          <span className="ml-1.5 text-[10px]" style={{ color: toneFor(delta) }}>
                            {delta > 0 ? "▲" : delta < 0 ? "▼" : ""}
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-right text-[10px] uppercase tracking-wider text-muted-foreground/50">n/a</td>
                      <td className="py-2 text-right">
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${imp.cls}`}>{imp.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[10px] text-muted-foreground/70">
            Actual & prior from FRED by reference period. Market consensus, exact release times and forward-dated events
            (ISM/PMI, auctions, central-bank speakers) require a dedicated economic-calendar provider — shown as
            unavailable rather than estimated.
          </p>
        </>
      )}
    </Panel>
  );
}
