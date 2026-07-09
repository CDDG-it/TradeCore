"use client";

import { motion, AnimatePresence } from "motion/react";
import { usePathname } from "next/navigation";

/**
 * Wraps the main content with a pathname-keyed AnimatePresence. The new page
 * fades in immediately (no mode="wait", so it doesn't sit and wait for the old
 * page to leave) with just a quick opacity fade — no blur filter, which was
 * GPU-heavy and made routes feel like they slowly "loaded in".
 */
export function TransitionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
