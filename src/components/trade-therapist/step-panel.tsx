"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type PanelStatus = { label: string; tone: "done" | "todo" | "waiting" };
const EASE = [0.23, 1, 0.32, 1] as const;

/**
 * A numbered step card in the Therapist's Today style: it rises in on mount,
 * lifts on hover, and the one marked `active` carries the turquoise edge and a
 * live dot so the eye lands on what to do next.
 */
export function StepPanel({ index, reduceMotion, active, step, eyebrow, title, status, action, children }: {
  index: number;
  reduceMotion: boolean | null;
  active: boolean;
  step: string;
  eyebrow: string;
  title: string;
  status: PanelStatus | null;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, delay: reduceMotion ? 0 : 0.06 + index * 0.05, ease: EASE }}
      whileHover={{ y: -3, transition: { duration: 0.2, ease: EASE } }}
      className={cn(
        "group/panel relative flex min-h-72 flex-col overflow-hidden rounded-2xl border bg-card/65 transition-[border-color,box-shadow] duration-300 lg:min-h-0",
        active
          ? "border-primary/45 shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary)_16%,transparent),0_28px_70px_-44px_rgba(0,0,0,.6)]"
          : "border-border/60 hover:border-border hover:shadow-[0_28px_70px_-48px_rgba(0,0,0,.6)]"
      )}
    >
      {active && (
        <motion.div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
          animate={reduceMotion ? undefined : { opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <div className="flex shrink-0 items-start justify-between gap-3 px-5 pt-5">
        <div>
          <p className="flex items-center gap-2 font-heading text-xs font-bold tabular-nums text-muted-foreground/50">
            {step}
            {active && (
              <span className="relative flex h-1.5 w-1.5">
                {!reduceMotion && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />}
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
            )}
          </p>
          <p className={cn("mt-3 text-[10px] font-semibold uppercase tracking-[.16em]", active ? "text-primary" : "text-muted-foreground")}>{eyebrow}</p>
          <h3 className="mt-1 font-heading text-lg font-bold tracking-tight">{title}</h3>
        </div>
        {status && <StatusPill status={status} />}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
      {action && <div className="shrink-0 border-t border-border/50 px-5 py-3.5">{action}</div>}
    </motion.section>
  );
}

export function StatusPill({ status }: { status: PanelStatus }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold leading-none",
      status.tone === "done" ? "bg-success/12 text-success" : status.tone === "todo" ? "bg-primary/12 text-primary" : "bg-muted/40 text-muted-foreground")}>
      {status.tone === "done" && <Check className="h-3 w-3" />}
      {status.tone === "todo" && <span className="h-1.5 w-1.5 rounded-full bg-primary motion-safe:animate-pulse" />}
      {status.label}
    </span>
  );
}

