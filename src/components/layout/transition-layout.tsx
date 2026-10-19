"use client";

import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";

/**
 * Pathname-keyed page transition: a short opacity handoff avoids a hard pop
 * without delaying the first visible content or moving the layout.
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
  const reduceMotion = useReducedMotion();
  const staticTradePage = pathname === "/journal/new" || /^\/journal\/[^/]+$/.test(pathname);

  if (staticTradePage) return <div>{children}</div>;

  return (
    <motion.div
      key={pathname}
      initial={reduceMotion ? false : { opacity: 0.7 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
