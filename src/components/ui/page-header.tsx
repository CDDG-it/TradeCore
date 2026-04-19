"use client";

import { motion } from "motion/react";

interface PageHeaderProps {
  badge?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ badge, title, subtitle, action, className = "" }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-start justify-between gap-4 mb-8 ${className}`}
    >
      <div>
        {badge && (
          <p className="font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25 mb-2">
            {badge}
          </p>
        )}
        <h1 className="font-heading italic text-3xl md:text-4xl text-white tracking-tight leading-[0.92]">
          {title}
        </h1>
        {subtitle && (
          <p className="font-body text-sm font-light text-white/40 mt-2 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 pt-1">{action}</div>}
    </motion.div>
  );
}
