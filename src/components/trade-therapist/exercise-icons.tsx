"use client";

import { motion, type Variants } from "motion/react";
import type { ExerciseTypeId } from "@/lib/types";

/**
 * One drawn icon per pre-market exercise, each a small picture of what the
 * exercise does: two candles for the loss and win review, a needle for the
 * state check, a wave that flattens for calm. The base strokes stay put; the
 * accent (in cyan) moves when the card is hovered or selected.
 *
 * They read `rest`, `hover` and `active` from the parent's motion variants, so
 * a card only has to set `initial="rest" animate=... whileHover="hover"`.
 */

const SPRING = { type: "spring", stiffness: 320, damping: 18 } as const;
const v = (rest: object, move: object): Variants => ({ rest: { ...rest, transition: SPRING }, hover: { ...move, transition: SPRING }, active: { ...move, transition: SPRING } });
const draw = v({ pathLength: 1, opacity: 0.9 }, { pathLength: [0, 1], opacity: 1 });

function Frame({ size, children }: { size: number; children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

const ACCENT = { stroke: "var(--ice)" } as const;
/** Pivot for a rotate or scale, in the icon's own 24-unit grid. */
const at = (x: number, y: number) => ({ transformBox: "view-box", transformOrigin: `${x}px ${y}px` }) as const;

const ICONS: Record<ExerciseTypeId, () => React.ReactNode> = {
  // A red candle and a green one, with the lesson arcing from one to the other.
  loss_win_review: () => <>
    <path d="M7 4v16M5 9h4v7H5z" />
    <path d="M17 3v15M15 6h4v7h-4z" />
    <motion.path variants={v({ y: 0 }, { y: -1.5 })} d="M8.5 19.5c2.5 1.5 6 1.5 8-1.5" style={ACCENT} />
  </>,
  // The outcome is the flag; the bar in front is the obstacle you plan for.
  mental_contrasting: () => <>
    <path d="M7 21V4" />
    <motion.path variants={v({ rotate: 0 }, { rotate: -8 })} style={{ ...ACCENT, ...at(7, 5) }} d="M7 4.5h9l-2 3 2 3H7" />
    <path d="M3 17h8M5 17v4M9 17v4" />
  </>,
  // A clock whose hand sweeps back: looking at the session from its end.
  pre_mortem: () => <>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4" />
    <motion.g variants={v({ rotate: 0 }, { rotate: -50 })} style={{ ...at(12, 13) }}>
      <path d="M12 13l3 2" style={ACCENT} />
    </motion.g>
    <path d="M4.5 6.5 3 4M19.5 6.5 21 4" />
  </>,
  // A screen with the trade played through before it happens.
  mental_rehearsal: () => <>
    <rect x="3" y="5" width="18" height="13" rx="2.5" />
    <path d="M8 21h8" />
    <motion.path variants={v({ scale: 1 }, { scale: 1.2 })} style={{ ...ACCENT, ...at(12, 11.5) }} d="M10.5 9v5l4-2.5z" />
  </>,
  // Three rules, each ticked off from memory.
  rules_recall: () => <>
    <path d="M10 7h10M10 12h10M10 17h7" />
    <motion.path variants={draw} style={ACCENT} d="M4 7l1.2 1.2L7 6M4 12l1.2 1.2L7 11M4 17l1.2 1.2L7 16" />
  </>,
  // A gauge whose needle swings to where you are today.
  state_check: () => <>
    <path d="M4 16a8 8 0 0 1 16 0" />
    <path d="M6.5 10.5 7.5 11.5M12 7.5v1.5M17.5 10.5l-1 1" />
    <motion.g variants={v({ rotate: -35 }, { rotate: 35 })} style={{ ...at(12, 16) }}>
      <path d="M12 16l0-6" style={ACCENT} />
    </motion.g>
    <circle cx="12" cy="16" r="1.3" />
  </>,
  // One stem, two planned branches.
  scenario_plan: () => <>
    <path d="M12 21v-7" />
    <motion.path variants={draw} style={ACCENT} d="M12 14 6 6M6 6v4M6 6h4M12 14l6-8M18 6v4M18 6h-4" />
  </>,
  // A falling line caught by a reset arrow.
  post_loss_reset: () => <>
    <path d="M3 6l5 5 3-2 4 5" />
    <motion.g variants={v({ rotate: 0 }, { rotate: -180 })} style={{ ...at(16.5, 16.5) }}>
      <path d="M20 16.5a3.5 3.5 0 1 1-1-2.5M20 12.5v2.5h-2.5" style={ACCENT} />
    </motion.g>
  </>,
  // A choppy line that settles flat.
  calm_plan: () => <>
    <motion.path
      variants={v({ d: "M3 12c2-5 4-5 6 0s4 5 6 0 4-5 6 0" }, { d: "M3 12c2-0.6 4-0.6 6 0s4 0.6 6 0 4-0.6 6 0" })}
      style={ACCENT}
    />
    <path d="M3 18h18" opacity={0.5} />
    <path d="M3 6h18" opacity={0.5} />
  </>,
  // A barrier that drops between the urge and the click.
  impulse_gate: () => <>
    <path d="M5 21V8M19 21V8" />
    <circle cx="5" cy="6.5" r="1.5" />
    <motion.g variants={v({ rotate: -32 }, { rotate: 0 })} style={{ ...at(5, 11) }}>
      <path d="M5 11h14" style={ACCENT} />
    </motion.g>
    <circle cx="19" cy="6.5" r="1.5" />
  </>,
  // A calendar with today's promise kept.
  follow_through: () => <>
    <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    <motion.path variants={draw} style={ACCENT} d="M8.5 14.5l2.3 2.3 4.7-4.6" />
  </>,
  // The excitement goes into a socket, away from the chart.
  thrill_outlet: () => <>
    <circle cx="12" cy="12" r="8.5" />
    <motion.path variants={v({ scale: 1, rotate: 0 }, { scale: 1.18, rotate: -6 })} style={{ ...ACCENT, ...at(12, 12) }} d="M13 6.5 9 12.5h3l-1 5 4-6.5h-3z" />
  </>,
  // A bulb with its ideas parked around it.
  idea_parking: () => <>
    <path d="M9 18h6M10 21h4M8.5 14.5a5 5 0 1 1 7 0c-.8.8-1.5 1.6-1.5 3.5h-4c0-1.9-.7-2.7-1.5-3.5z" />
    <motion.path variants={v({ opacity: 0.4, scale: 0.9 }, { opacity: 1, scale: 1.1 })} style={{ ...ACCENT, ...at(12, 9.5) }} d="M12 1.8V3M4.5 9.5H3.3M20.7 9.5h-1.2M6.6 4.1l.8.8M17.4 4.1l-.8.8" />
  </>,
  // A folder of proof, sealed with a tick.
  evidence_file: () => <>
    <path d="M3 7.5a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <motion.path variants={draw} style={ACCENT} d="M9 14l2 2 4-4" />
  </>,
};

export function ExerciseIcon({ id, size = 18 }: { id: ExerciseTypeId; size?: number }) {
  return <Frame size={size}>{ICONS[id]()}</Frame>;
}
