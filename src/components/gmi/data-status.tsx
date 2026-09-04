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
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/40 px-2 py-0.5 text-[10px] font-medium tabular-nums",
        className
      )}
    >
      {unavailable ? (
        <span className="inline-flex items-center gap-1 font-semibold uppercase tracking-[0.14em] text-destructive">
          <AlertTriangle className="h-2.5 w-2.5" /> Unavailable
        </span>
      ) : (
        <span
          className={cn(
            "inline-flex items-center gap-1 font-semibold uppercase tracking-[0.14em]",
            stale ? "text-warning" : "text-muted-foreground"
          )}
        >
          <Circle className={cn("w-1.5 h-1.5", stale ? "fill-warning text-warning" : "fill-success text-success")} />
          {stale ? "Stale" : freshnessLabel}
        </span>
      )}
      {showSource && !unavailable && (
        <span className="text-muted-foreground/50">
          {env.source}
          {env.asOf ? ` · ${timeAgo(env.asOf)}` : ""}
        </span>
      )}
    </span>
  );
}
