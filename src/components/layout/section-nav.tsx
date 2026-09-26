"use client";

import { motion, useReducedMotion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The in-page section switcher, in the exact language of the main top-nav rail:
 * one glass rail with the sections inside it and a single pill that slides
 * between them, a turquoise underline riding along inside it. Every hub page
 * (My Edge, Trade Therapist, Global Markets) uses this same control instead of
 * inventing its own, so the app reads as one navigation system.
 *
 * Desktop only (the phone keeps its docked `MobileSubnav`). Pass a unique `id`
 * per page: it names the shared-layout pill, so two rails never fight over it.
 */
export interface SectionNavItem<T extends string> {
  key: T;
  label: string;
  icon?: LucideIcon;
}

export function SectionNav<T extends string>({
  id,
  items,
  value,
  onChange,
  className,
}: {
  id: string;
  items: readonly SectionNavItem<T>[];
  value: T;
  onChange: (key: T) => void;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <nav
      aria-label="Sections"
      className={cn(
        "hidden max-w-full items-center gap-0.5 rounded-full border border-white/[0.08] bg-white/[0.03] p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] lg:flex",
        className
      )}
    >
      {items.map((item) => {
        const active = item.key === value;
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => onChange(item.key)}
            className={cn(
              "press relative flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-xs font-semibold",
              active ? "text-foreground" : "text-sidebar-foreground/60 hover:bg-white/[0.04] hover:text-sidebar-foreground"
            )}
          >
            {active && (
              <motion.span
                layoutId={`section-nav-pill-${id}`}
                aria-hidden
                className="absolute inset-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 480, damping: 38 }}
              >
                {/* The turquoise underline rides inside the pill, so one spring moves both. */}
                <span
                  className="absolute inset-x-4 bottom-0 h-[2px] rounded-full"
                  style={{ background: "var(--primary)", boxShadow: "0 0 10px color-mix(in oklch, var(--primary) 70%, transparent)" }}
                />
              </motion.span>
            )}
            {Icon && <Icon className={cn("relative z-10 size-3.5", active ? "text-primary" : "text-sidebar-foreground/45")} strokeWidth={active ? 2.3 : 2} />}
            <span className="relative z-10">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
