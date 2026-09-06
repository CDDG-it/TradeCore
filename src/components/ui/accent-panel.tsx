import { cn } from "@/lib/utils";

/**
 * The panel treatment used across the discipline surfaces (My Edge, MC
 * Trade Therapist): a coloured spine down the left edge, a faint wash of that
 * same accent through the card ground, and a deep, soft shadow.
 *
 * The accent is meant to carry meaning rather than decoration — turquoise for
 * discipline, cyan for analysis, green for what worked, red for what cost you.
 */
export type PanelAccent = "primary" | "cyan" | "success" | "destructive";

/** Tokens, not literals, so the light theme's darker set applies — a mid-tone
 *  brand colour turns to pastel on a white card. */
const ACCENT_VAR: Record<PanelAccent, string> = {
  primary: "var(--primary)",
  cyan: "var(--ice)",
  success: "var(--win)",
  destructive: "var(--loss)",
};

export function AccentPanel({
  accent = "primary",
  eyebrow,
  title,
  subtitle,
  headerRight,
  className,
  children,
}: {
  accent?: PanelAccent;
  eyebrow?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Optional control rendered opposite the title. */
  headerRight?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  const c = ACCENT_VAR[accent];
  return (
    <div
      className={cn("relative overflow-hidden rounded-2xl border border-border/60 p-4 pl-5 sm:p-5 sm:pl-6", className)}
      style={{
        background: `linear-gradient(160deg, color-mix(in oklch, var(--card) 96%, ${c} 4%), var(--card) 55%)`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), var(--panel-shadow)",
      }}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: `linear-gradient(180deg, ${c}, color-mix(in oklch, ${c} 12%, transparent))` }}
      />

      {(eyebrow || title || subtitle || headerRight) && (
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow && (
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: `color-mix(in oklch, ${c} var(--accent-label-strength), transparent)` }}
              >
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="mt-1.5 font-heading text-lg font-bold tracking-tight">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-1.5 max-w-prose text-xs leading-relaxed text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {headerRight && <div className="shrink-0">{headerRight}</div>}
        </div>
      )}

      {children}
    </div>
  );
}
