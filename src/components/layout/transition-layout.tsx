"use client";

import { motion, AnimatePresence } from "motion/react";
import { usePathname } from "next/navigation";

/**
 * Pathname-keyed page transition. The new page fades in immediately (no
 * mode="wait", so it doesn't sit and wait for the old page to leave). Kept
 * intentionally lean — a short opacity + tiny y offset only, no blur filter
 * (GPU-heavy, made routes feel like they were "loading in"). Duration is
 * short enough that navigation reads as instant, long enough that content
 * doesn't visibly pop into place.
 */
export function TransitionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
