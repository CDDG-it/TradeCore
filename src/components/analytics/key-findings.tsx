"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import type { Finding } from "@/lib/journal/analytics-findings";
import { LOSS_COLOR, WIN_COLOR, alpha } from "@/lib/journal/colors";

export function KeyFindings({ findings }: { findings: Finding[] }) {
  if (findings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 px-5 py-6 text-sm leading-relaxed text-muted-foreground">
        No clear findings yet. A finding only appears once a time, setup or rule has at least 5 trades behind it, so it
        reflects how you trade and not a lucky streak. Keep logging, with entry times, confluences and rule checks filled in.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {findings.map((f) => {
        const color = f.tone === "good" ? WIN_COLOR : LOSS_COLOR;
        const Icon = f.tone === "good" ? TrendingUp : TrendingDown;
        return (
          <div
            key={f.id}
            className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-4"
            style={{ backgroundImage: `linear-gradient(160deg, ${alpha(color, 10)}, transparent 55%)` }}
          >
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Icon className="h-3.5 w-3.5" style={{ color }} />
              {f.eyebrow}
            </p>
            <p className="mt-2.5 truncate text-base font-semibold" title={f.headline}>{f.headline}</p>
            <p className="mt-0.5 text-xl font-black tabular-nums" style={{ color }}>{f.value}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.detail}</p>
          </div>
        );
      })}
    </div>
  );
}
