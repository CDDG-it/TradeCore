"use client";

import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "motion/react";

/** The app's strong ease-out, for Motion's `animate` and `transition` props. */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/**
 * A number that runs up to its value instead of appearing at it. Used for the
 * one headline reading on a panel (a streak, a kept rate, a goal's current
 * value): a change in that number is the state change the panel exists to
 * show, so it gets the motion. Later changes run from the previous value, so
 * an answer that moves a rate by two points moves it by two points. Reduced
 * motion shows the value at once.
 */
export function CountUp({
  value, format = (n) => String(Math.round(n)), duration = 0.8, className,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(() => (reduce ? value : 0));

  useEffect(() => {
    if (reduce) {
      setShown(value);
      return;
    }
    const controls = animate(shown, value, {
      duration,
      ease: EASE_OUT,
      onUpdate: (v) => setShown(v),
    });
    return () => controls.stop();
    // `shown` is the tween's starting point, not a trigger: re-running on every
    // frame would restart the tween from itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduce, duration]);

  return <span className={className}>{format(shown)}</span>;
}
