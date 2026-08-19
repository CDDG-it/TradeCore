"use client";

import { motion } from "motion/react";

interface PageHeaderProps {
  /** Kept for API compatibility — no longer rendered. */
  badge?: string;
  title: string;
  /** Kept for API compatibility — no longer rendered. */
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Page heading — just a compact title (and an optional action on the right).
 * The old eyebrow badge and subtitle are intentionally dropped so every page
 * leads with a small, clean title.
 */
export function PageHeader({ title, action, className = "" }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-center justify-between gap-4 mb-5 ${className}`}
    >
      <h1 className="font-heading font-bold text-lg md:text-xl text-foreground tracking-tight leading-none">
        {title}
      </h1>
      {action && <div className="shrink-0">{action}</div>}
    </motion.div>
  );
}
