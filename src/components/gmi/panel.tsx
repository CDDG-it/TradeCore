"use client";

/** Shared surface primitives for the Global Markets subtabs — kept minimal and
 *  dense to match the app's fintech card styling. */
import { cn } from "@/lib/utils";
import { DataStatus } from "./data-status";
import type { DataEnvelope } from "@/lib/gmi/types";

export function Panel({
  title,
  env,
  action,
  className,
  children,
}: {
  title?: string;
  env?: DataEnvelope<unknown> | null;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl border border-border/60 bg-card p-4", className)}>
      {(title || env || action) && (
        <header className="mb-3 flex items-center justify-between gap-3">
          {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
          <div className="flex items-center gap-3">
            {action}
            {env !== undefined && <DataStatus env={env ?? null} />}
          </div>
        </header>
      )}
      {children}
    </section>
  );
}

/** Honest empty/unavailable state — used wherever a provider has no data. */
export function Unavailable({ label = "Data unavailable", hint }: { label?: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border/60 bg-muted/10 py-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      {hint && <p className="max-w-md text-[11px] text-muted-foreground/70">{hint}</p>}
    </div>
  );
}
