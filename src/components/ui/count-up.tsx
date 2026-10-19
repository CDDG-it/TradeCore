"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "motion/react";
import { EASE_OUT } from "@/lib/motion";

/** Re-exported for the surfaces that already import it from here. */
export { EASE_OUT };

/**
 * A number that runs up to its value instead of appearing at it. Used for the
 * one headline reading on a panel (a streak, a kept rate, a goal's current
 * value): a change in that number is the state change the panel exists to
 * show, so it gets the motion. Later changes run from the previous value, so
 * an answer that moves a rate by two points moves it by two points. Reduced
 * motion shows the value at once.
 */
export function CountUp({
  value, format = (n) => String(Math.round(n)), duration = 0.8, changeDuration, className,
}: {
  value: number;
  format?: (n: number) => string;
  /** The first run, up from zero. */
  duration?: number;
  /** Later runs, from one value to the next; quicker keeps a switch responsive. Defaults to `duration`. */
  changeDuration?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(() => (reduce ? value : 0));
  const first = useRef(true);

  useEffect(() => {
    const length = first.current ? duration : changeDuration ?? duration;
    first.current = false;
    if (reduce) {
      setShown(value);
      return;
    }
    const controls = animate(shown, value, {
      duration: length,
      ease: EASE_OUT,
      onUpdate: (v) => setShown(v),
    });
    return () => controls.stop();
    // `shown` is the tween's starting point, not a trigger: re-running on every
    // frame would restart the tween from itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduce, duration, changeDuration]);

  return <span className={className}>{format(shown)}</span>;
}
