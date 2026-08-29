"use client";

/**
 * REACTIONS — how markets moved around events. A faithful before/after grid needs
 * timestamped intraday history captured at each release, which the current free
 * data sources don't provide. Rather than fabricate reactions, this shows the
 * events it would populate (recent FRED releases) and states the requirement
 * plainly. Purely descriptive by design.
 */
import { format } from "date-fns";
import { useGmi } from "@/lib/gmi/client";
import type { CalendarEntry } from "@/lib/gmi/calendar";
import { Panel, Unavailable } from "../panel";

const REACTION_ASSETS = ["NQ", "ES", "US10Y", "DXY", "VIX"];
const WINDOWS = ["Before", "+1m", "+5m", "+15m", "+30m", "+1h"];

export function ReactionsTab() {
  const { env } = useGmi<CalendarEntry[]>("/api/gmi/calendar", 30 * 60_000);
  const events = (env?.data ?? []).filter((e) => e.importance === "high").slice(0, 6);

  return (
    <div className="space-y-4">
      <Panel title="Event → market reaction">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-3 font-semibold">Asset</th>
                {WINDOWS.map((w) => (
                  <th key={w} className="py-2 px-2 text-right font-semibold">{w}</th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums">
              {REACTION_ASSETS.map((a) => (
                <tr key={a} className="border-b border-border/40 last:border-0">
                  <td className="py-2 pr-3 font-bold text-foreground">{a}</td>
                  {WINDOWS.map((w) => (
                    <td key={w} className="py-2 px-2 text-right text-muted-foreground/40">—</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3">
          <Unavailable
            label="Reaction data unavailable"
            hint="A before/after grid requires intraday prices captured at each release timestamp. Free sources don't retain that history. Add an intraday-history or events provider (or let the app record snapshots around scheduled releases) to populate this."
          />
        </div>
      </Panel>

      <Panel title="Events this would cover" env={env}>
        {events.length === 0 ? (
          <Unavailable label="No recent high-impact releases" />
        ) : (
          <ul className="space-y-1.5">
            {events.map((e) => (
              <li key={e.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/10 px-3 py-2 text-xs">
                <span className="font-medium text-foreground">{e.label}</span>
                <span className="text-muted-foreground">
                  {e.referenceDate ? format(new Date(e.referenceDate + "T12:00:00"), "MMM yyyy") : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
