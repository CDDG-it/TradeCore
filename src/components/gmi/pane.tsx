"use client";

/**
 * The Global Markets desk — its own visual language, deliberately unlike the
 * card-grid dashboards everywhere else.
 *
 * The page is one instrument: a single frame ruled into panes by hairlines,
 * labels set small and letterspaced in the corner of each pane, every number in
 * mono with tabular figures, and colour reserved for direction and state. No
 * rounded cards stacked on a scrolling page, no decorative icons — the screen
 * is the instrument and it holds still while you read it.
 */
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { FRESHNESS_LABEL, timeAgo } from "@/lib/gmi/client";
import type { DataEnvelope } from "@/lib/gmi/types";

/** Alpha-blend toward transparent — `pct` 0–100. */
export const a = (c: string, pct: number) => `color-mix(in oklch, ${c} ${pct}%, transparent)`;

export const TURQUOISE = "#14B8A6";
export const CYAN = "#06B6D4";

/** The faint plotting grid that runs under the whole desk. */
export const gridBackground = {
  backgroundImage:
    `linear-gradient(${a("var(--muted-foreground)", 5)} 1px, transparent 1px),` +
    `linear-gradient(90deg, ${a("var(--muted-foreground)", 5)} 1px, transparent 1px)`,
  backgroundSize: "28px 28px",
};

/** Corner ticks — the frame's registration marks. */
export function Ticks({ inset = "0.25rem" }: { inset?: string }) {
  const common = "pointer-events-none absolute h-2 w-2 border-primary/40";
  return (
    <>
      <span aria-hidden className={cn(common, "border-l border-t")} style={{ left: inset, top: inset }} />
      <span aria-hidden className={cn(common, "border-r border-t")} style={{ right: inset, top: inset }} />
      <span aria-hidden className={cn(common, "border-b border-l")} style={{ bottom: inset, left: inset }} />
      <span aria-hidden className={cn(common, "border-b border-r")} style={{ bottom: inset, right: inset }} />
    </>
  );
}

/** A pane's label: the smallest type on the page, and the loudest signal of structure. */
export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("text-[11px] font-semibold uppercase tracking-wider text-foreground/80", className)}>
      {children}
    </span>
  );
}

/**
 * Provenance, stated in the terse form the desk uses everywhere: cadence,
 * source, age. Never a claim of liveness the provider cannot back.
 */
export function Meta({ env, className }: { env?: DataEnvelope<unknown> | null; className?: string }) {
  if (env === undefined) return null;
  if (!env) {
    return <span className={cn("text-[11px] font-semibold uppercase tracking-wider text-foreground/65", className)}>Loading</span>;
  }
  if (env.status === "unavailable") {
    return (
      <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-destructive", className)}>
        <AlertTriangle className="h-2.5 w-2.5" /> Unavailable
      </span>
    );
  }
  const stale = env.status === "stale";
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider", className)}>
      <span
        className="h-1 w-1 rounded-full"
        style={{ background: stale ? "var(--warning)" : "var(--success)" }}
      />
      <span className={stale ? "text-warning" : "text-foreground/75"}>
        {stale ? "Stale" : FRESHNESS_LABEL[env.freshness].toLowerCase()}
      </span>
      <span className="normal-case tracking-normal text-foreground/65">
        {env.source.split(" ")[0]} · {env.asOf ? timeAgo(env.asOf) : timeAgo(env.fetchedAt)}
      </span>
    </span>
  );
}

/**
 * A region of the desk. Never scrolls the page: a pane that outgrows its slot
 * scrolls inside itself, so the frame around it never moves.
 */
export function Pane({
  label,
  index,
  right,
  scroll = false,
  className,
  bodyClassName,
  children,
}: {
  label?: string;
  /** Optional pane number, e.g. "02" — the desk's own index. */
  index?: string;
  right?: React.ReactNode;
  scroll?: boolean;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("relative flex min-h-0 min-w-0 flex-col border border-border/45 bg-card/35", className)}>
      {(label || right) && (
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border/40 px-3 py-[7px]">
          <span className="flex min-w-0 items-baseline gap-2">
            {index && <span className="text-[11px] font-bold tabular-nums text-primary/85">{index}</span>}
            {label && <Label className="truncate">{label}</Label>}
          </span>
          {right}
        </header>
      )}
      <div className={cn("min-h-0 flex-1", scroll ? "overflow-y-auto" : "overflow-hidden", bodyClassName ?? "p-3")}>
        {children}
      </div>
    </section>
  );
}

/** Label … value, joined by a dotted leader — a table without table furniture. */
export function Field({
  label,
  value,
  tone,
  sub,
  trailing,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  tone?: string;
  sub?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-2 py-[5px]">
      <span className="shrink-0 text-[13px] text-foreground/85">{label}</span>
      {sub && <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-foreground/65">{sub}</span>}
      <span aria-hidden className="min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-border/70" />
      {trailing}
      <span className="shrink-0 text-[14px] font-bold tabular-nums" style={{ color: tone ?? "var(--foreground)" }}>
        {value}
      </span>
    </div>
  );
}

/** A headline number: the figure, its unit, and what it did. */
export function Figure({
  value,
  unit,
  delta,
  size = "md",
  tone,
}: {
  value: React.ReactNode;
  unit?: React.ReactNode;
  delta?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  tone?: string;
}) {
  const cls = size === "lg" ? "text-[32px]" : size === "md" ? "text-[22px]" : "text-[16px]";
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={cn("font-black leading-none tabular-nums", cls)} style={{ color: tone ?? "var(--foreground)" }}>
        {value}
      </span>
      {unit && <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/75">{unit}</span>}
      {delta}
    </div>
  );
}

/** Honest empty state, in the desk's own voice. */
export function Empty({ label = "No data", hint }: { label?: string; hint?: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1.5 px-6 text-center">
      <Label>{label}</Label>
      {hint && <p className="max-w-xs text-[11px] leading-relaxed text-foreground/75">{hint}</p>}
    </div>
  );
}

/** The desk's only control: a row of words, the live one underlined. */
export function Switch<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className={cn(
              "border-b pb-px text-[12px] font-semibold uppercase tracking-wider transition-colors",
              active
                ? "border-primary text-primary"
                : "border-transparent text-foreground/75 hover:text-foreground"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Direction, without an icon: the sign carries it, colour confirms it. */
export function Delta({ value, format, className }: { value: number | null | undefined; format?: (v: number) => string; className?: string }) {
  if (value == null || !Number.isFinite(value)) {
    return <span className={cn("text-[12px] text-foreground/65", className)}>—</span>;
  }
  const color = value > 0 ? "var(--success)" : value < 0 ? "var(--destructive)" : "var(--muted-foreground)";
  const text = format ? format(value) : `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
  return (
    <span className={cn("text-[12px] font-bold tabular-nums", className)} style={{ color }}>
      {text}
    </span>
  );
}
