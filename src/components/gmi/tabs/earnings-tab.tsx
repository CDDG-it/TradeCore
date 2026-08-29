"use client";

/**
 * EARNINGS — EPS estimate / actual / surprise for index heavyweights (Twelve
 * Data). Revenue figures are not available on the free tier and are shown as
 * unavailable rather than guessed. Descriptive only.
 */
import { format } from "date-fns";
import { toneFor, useGmi } from "@/lib/gmi/client";
import type { EarningsRow } from "@/lib/gmi/types";
import { Panel, Unavailable } from "../panel";

type Payload = { rows: EarningsRow[]; missing: string[] };

function fmtNum(v: number | null, digits = 2): string {
  return v == null ? "—" : v.toFixed(digits);
}
function fmtDate(d: string): string {
  const t = new Date(d + "T12:00:00");
  return Number.isNaN(t.getTime()) ? d : format(t, "MMM d, yyyy");
}

export function EarningsTab() {
  const { env } = useGmi<Payload>("/api/gmi/earnings", 30 * 60_000);
  const rows = env?.data?.rows ?? [];
  const missing = env?.data?.missing ?? [];

  return (
    <Panel title="Earnings — index heavyweights" env={env}>
      {env?.status === "unavailable" ? (
        <Unavailable hint="Twelve Data earnings is temporarily unavailable or the free-tier request budget is exhausted." />
      ) : rows.length === 0 ? (
        <Unavailable label="Loading earnings…" />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/60 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-3 font-semibold">Company</th>
                  <th className="py-2 pr-3 font-semibold">Latest report</th>
                  <th className="py-2 pr-3 text-right font-semibold">EPS est.</th>
                  <th className="py-2 pr-3 text-right font-semibold">EPS actual</th>
                  <th className="py-2 pr-3 text-right font-semibold">Surprise</th>
                  <th className="py-2 text-right font-semibold">Revenue</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {rows.map((r) => (
                  <tr key={r.symbol} className="border-b border-border/40 last:border-0">
                    <td className="py-2 pr-3">
                      <span className="font-bold text-foreground">{r.symbol}</span>
                      <span className="ml-2 font-sans text-[11px] text-muted-foreground">{r.name}</span>
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">{fmtDate(r.date)}</td>
                    <td className="py-2 pr-3 text-right text-foreground">{fmtNum(r.epsEstimate)}</td>
                    <td className="py-2 pr-3 text-right font-semibold text-foreground">{fmtNum(r.epsActual)}</td>
                    <td className="py-2 pr-3 text-right font-semibold" style={{ color: toneFor(r.epsSurprisePct) }}>
                      {r.epsSurprisePct == null ? "—" : `${r.epsSurprisePct > 0 ? "+" : ""}${r.epsSurprisePct.toFixed(1)}%`}
                    </td>
                    <td className="py-2 text-right text-[10px] uppercase tracking-wider text-muted-foreground/60">n/a</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {missing.length > 0 && (
            <p className="mt-3 text-[10px] text-muted-foreground/70">
              Still loading (free-tier rate limit): {missing.join(", ")}. These fill in on the next refresh.
            </p>
          )}
          <p className="mt-1 text-[10px] text-muted-foreground/70">
            Revenue estimates/actuals and price reaction require a paid earnings source; shown as unavailable rather than estimated.
          </p>
        </>
      )}
    </Panel>
  );
}
