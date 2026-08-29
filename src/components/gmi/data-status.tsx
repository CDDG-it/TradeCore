"use client";

/**
 * DataStatus — the honesty badge shown on every dataset. It states the
 * provider's cadence (REALTIME/DELAYED/DAILY/WEEKLY/MONTHLY), flags stale or
 * unavailable data, and stamps when the data was captured. This is how the page
 * keeps its promise never to imply freshness a provider does not offer.
 */
import { AlertTriangle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { FRESHNESS_LABEL, timeAgo } from "@/lib/gmi/client";
import type { DataEnvelope } from "@/lib/gmi/types";

export function DataStatus({
  env,
  className,
  showSource = true,
}: {
  env: Pick<DataEnvelope<unknown>, "source" | "freshness" | "asOf" | "status"> | null;
  className?: string;
  showSource?: boolean;
}) {
  if (!env) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-[10px] text-muted-foreground/70", className)}>
        <Circle className="w-2 h-2 animate-pulse" /> Loading…
      </span>
    );
  }

  const unavailable = env.status === "unavailable";
  const stale = env.status === "stale";
  const freshnessLabel = FRESHNESS_LABEL[env.freshness];

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-medium tabular-nums", className)}>
      {unavailable ? (
        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold uppercase tracking-wider bg-destructive/12 text-destructive">
          <AlertTriangle className="w-2.5 h-2.5" /> Unavailable
        </span>
      ) : (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold uppercase tracking-wider",
            stale ? "bg-warning/12 text-warning" : "bg-muted/50 text-muted-foreground"
          )}
        >
          <Circle className={cn("w-1.5 h-1.5", stale ? "fill-warning text-warning" : "fill-success text-success")} />
          {stale ? "Stale" : freshnessLabel}
        </span>
      )}
      {showSource && !unavailable && (
        <span className="text-muted-foreground/60">
          {env.source}
          {env.asOf ? ` · ${timeAgo(env.asOf)}` : ""}
        </span>
      )}
    </span>
  );
}
