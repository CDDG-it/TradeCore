"use client";

/**
 * Shared surface primitives for Global Markets.
 *
 * The page is a research desk, so the chrome stays quiet: a soft card ground
 * with a single accent hairline, roomy headers, and every dataset wearing its
 * own provenance badge. Nothing here interprets data — the primitives only
 * frame it.
 */
import { cn } from "@/lib/utils";
import { DataStatus } from "./data-status";
import type { DataEnvelope } from "@/lib/gmi/types";

export type Accent = "turquoise" | "cyan" | "neutral";

const ACCENT: Record<Accent, string> = {
  turquoise: "#14B8A6",
  cyan: "#06B6D4",
  neutral: "var(--muted-foreground)",
};

/** Alpha-blend toward transparent — `pct` 0–100. */
export const a = (c: string, pct: number) => `color-mix(in oklch, ${c} ${pct}%, transparent)`;

export function Panel({
  title,
  eyebrow,
  subtitle,
  env,
  action,
  accent = "turquoise",
  bodyClassName,
  className,
  children,
}: {
  title?: React.ReactNode;
  eyebrow?: string;
  subtitle?: React.ReactNode;
  env?: DataEnvelope<unknown> | null;
  action?: React.ReactNode;
  accent?: Accent;
  bodyClassName?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const hex = ACCENT[accent];
  return (
    <section
      className={cn(
        "group/panel relative overflow-hidden rounded-2xl border border-border/60 bg-card",
        "shadow-[0_4px_24px_-14px_rgba(0,0,0,0.55)] transition-[border-color,box-shadow] duration-300",
        "hover:border-border/90 hover:shadow-[0_10px_40px_-18px_rgba(0,0,0,0.7)]",
        className
      )}
    >
      {/* Accent hairline + a whisper of the accent in the ground */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${a(hex, 50)}, transparent)` }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(110% 70% at 0% 0%, ${a(hex, 6)}, transparent 60%)` }}
      />

      {(title || eyebrow || env !== undefined || action) && (
        <header className="relative flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 pb-3 pt-3.5">
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: a(hex, 75) }}>
                {eyebrow}
              </p>
            )}
            {title && (
              <h3 className="truncate text-sm font-semibold tracking-tight text-foreground">{title}</h3>
            )}
            {subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground/80">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {action}
            {env !== undefined && <DataStatus env={env ?? null} />}
          </div>
        </header>
      )}
      <div className={cn("relative px-4 pb-4", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Honest empty/unavailable state — used wherever a provider has no data. */
export function Unavailable({ label = "Data unavailable", hint }: { label?: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/60 bg-muted/[0.06] py-10 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      {hint && <p className="max-w-md px-6 text-[11px] leading-relaxed text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

/** The one toggle control on the page — ranges, filters, importance. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "sm",
  className,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
  size?: "sm" | "xs";
  className?: string;
}) {
  return (
    <div className={cn("inline-flex rounded-lg border border-border/60 bg-background/40 p-0.5", className)}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className={cn(
              "rounded-[7px] font-semibold transition-colors",
              size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
              active
                ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_35%,transparent)]"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** A label/value line with optional trend art — the workhorse of the data panels. */
export function DataRow({
  label,
  sub,
  value,
  tone,
  trailing,
  onClick,
  active,
}: {
  label: React.ReactNode;
  sub?: React.ReactNode;
  value: React.ReactNode;
  tone?: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 border-b border-border/40 py-2 text-left last:border-0",
        onClick && "cursor-pointer transition-colors hover:bg-muted/20",
        active && "bg-primary/[0.07]"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium text-foreground">{label}</div>
        {sub && <div className="mt-0.5 text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60">{sub}</div>}
      </div>
      {trailing}
      <span
        className="w-24 shrink-0 text-right font-mono text-sm font-semibold tabular-nums"
        style={{ color: tone ?? "var(--foreground)" }}
      >
        {value}
      </span>
    </Tag>
  );
}

/** Percent-change chip — the page's one piece of colour semantics. */
export function ChangeChip({ pct, className }: { pct: number | null | undefined; className?: string }) {
  const up = (pct ?? 0) > 0;
  const down = (pct ?? 0) < 0;
  const color = up ? "var(--success)" : down ? "var(--destructive)" : "var(--muted-foreground)";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums",
        className
      )}
      style={{ color, background: a(color, 12) }}
    >
      {pct == null || !Number.isFinite(pct) ? "—" : `${up ? "▲" : down ? "▼" : "▬"} ${Math.abs(pct).toFixed(2)}%`}
    </span>
  );
}
