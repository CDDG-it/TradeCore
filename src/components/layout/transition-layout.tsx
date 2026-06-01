"use client";

import { motion, AnimatePresence } from "motion/react";
import { usePathname } from "next/navigation";

/**
 * Wraps the main content with a pathname-keyed AnimatePresence so that
 * every route change gets a smooth fade + slight upward drift enter animation.
 * Exit animation: fast fade-out so it doesn't feel laggy.
 */
export function TransitionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
