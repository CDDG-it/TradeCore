/**
 * The app's motion vocabulary, in one place, so every surface moves alike.
 *
 * - EASE_OUT: the strong ease-out for entrances and state changes.
 * - SPRING: sliding indicators (a period pill, a selected tab) and small pops.
 * - rise(): the one-time staggered entrance of a page's sections.
 *
 * Pages wrap themselves in `<MotionConfig reducedMotion="user">`, so under
 * reduced motion the movement drops and the fades stay.
 */

export const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export const SPRING = { type: "spring", stiffness: 420, damping: 36 } as const;

/** A section rising into place, `index` steps after the first. */
export function rise(index = 0, step = 0.07) {
  return {
    initial: { opacity: 0, transform: "translateY(10px)" },
    animate: { opacity: 1, transform: "translateY(0px)" },
    transition: { duration: 0.35, delay: index * step, ease: EASE_OUT },
  } as const;
}
