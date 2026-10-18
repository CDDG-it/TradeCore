"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { copy } from "@/lib/trade-profile/content/copy";
import { traitName } from "@/lib/trade-profile/content/traits";
import type { DiffRow } from "@/lib/trade-profile/progress";
import { cn } from "@/lib/utils";

const tick = { fontSize: 10, fill: "var(--color-muted-foreground)" };

export function StateLine({ data }: { data: { day: number; state: number }[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
          <CartesianGrid stroke="var(--color-border)" strokeOpacity={0.6} vertical={false} />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={tick} />
          <YAxis domain={[1, 7]} ticks={[1, 4, 7]} axisLine={false} tickLine={false} tick={tick} />
          <Tooltip
            cursor={{ stroke: "var(--color-border)" }}
            contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)", fontSize: 12 }}
            labelFormatter={(d) => `${copy.common.day} ${d}`}
            formatter={(v) => [v, copy.progress.stateChart]}
          />
          <Line type="monotone" dataKey="state" stroke="var(--ice)" strokeWidth={2.25} dot={{ r: 2.5, fill: "var(--ice)", strokeWidth: 0 }} activeDot={{ r: 4.5 }} animationDuration={800} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Paired bars per trait: start vs. retest, with the change in points. */
export function BeforeAfter({ rows, afterLabel }: { rows: DiffRow[]; afterLabel: string }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><i className="h-1.5 w-3 rounded-full bg-muted-foreground/50" />{copy.retest.before}</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-1.5 w-3 rounded-full bg-ice" />{afterLabel}</span>
      </div>
      {rows.map((r, i) => (
        <div key={r.trait} className={cn(i === 0 && "border-b border-border/50 pb-4")}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className={cn(i === 0 ? "font-semibold" : "text-foreground/80")}>{traitName(r.trait)}</span>
            <span className="tabular-nums text-muted-foreground">
              {Math.round(r.before)} → <span className="font-semibold text-foreground">{Math.round(r.after)}</span>
              <span className={cn("ml-1.5", Math.abs(r.change) < 5 ? "text-muted-foreground" : "text-ice")}>
                ({r.change > 0 ? "+" : ""}
                {Math.round(r.change)})
              </span>
            </span>
          </div>
          <div className="space-y-1">
            <div className="h-1.5 rounded-full bg-muted/60"><div className="h-full rounded-full bg-muted-foreground/50" style={{ width: `${r.before}%` }} /></div>
            <div className="h-1.5 rounded-full bg-muted/60"><div className="transition-[width] duration-700 ease-out h-full rounded-full bg-ice" style={{ width: `${r.after}%` }} /></div>
          </div>
        </div>
      ))}
    </div>
  );
}
