"use client";

import { motion } from "motion/react";
import { usePathname } from "next/navigation";

/**
 * Pathname-keyed page transition: the incoming page fades up over its own
 * 160ms — short enough that navigation reads as instant, long enough that
 * content doesn't visibly pop into place.
 *
 * Deliberately no `AnimatePresence`. An exit animation keeps the outgoing page
 * mounted while the new one arrives, and the two then stack in normal flow: the
 * document briefly doubles in height and the router, scrolling the new segment
 * into view, lands somewhere down the combined page. On a phone that reads as
 * opening a tab onto a blank screen and having to scroll up to find it. Letting
 * the old page unmount with the route keeps the document one page tall.
 */
export function TransitionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
