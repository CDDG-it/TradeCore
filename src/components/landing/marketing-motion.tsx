"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

/** One-time presentation motion for read-only marketing examples. */
export function MarketingReveal({ children, className, delay = 0 }: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.22 }}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

const scoreParts = [
  { name: "Rule adherence", weight: 35, color: "#174657" },
  { name: "Execution", weight: 20, color: "#0d817c" },
  { name: "Habit consistency", weight: 20, color: "#14b8a6" },
  { name: "Reflection work", weight: 15, color: "#06b6d4" },
  { name: "Goal progress", weight: 10, color: "#91dfd5" },
] as const;

export function MindscoreAssembly() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="marketing-score-assembly grid items-center gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:gap-16" aria-label="MC Mindscore weighting: rule adherence 35 percent, execution 20 percent, habit consistency 20 percent, reflection work 15 percent, goal progress 10 percent">
      <div className="relative mx-auto grid w-full max-w-[390px] place-items-center">
        <div aria-hidden="true" className="absolute inset-[13%] rounded-full bg-[#a9e5dc]/25 blur-3xl" />
        <svg className="relative w-full" viewBox="0 0 300 300" role="img" aria-label="Five weighted segments forming the MC Mindscore">
          <circle cx="150" cy="150" r="112" fill="none" stroke="#d7e8e7" strokeWidth="28" />
          {scoreParts.map((part, index) => {
            const offset = scoreParts.slice(0, index).reduce((sum, previous) => sum + previous.weight, 0);
            return (
              <motion.circle
                key={part.name}
                cx="150" cy="150" r="112" pathLength="100"
                fill="none" stroke={part.color} strokeWidth="28"
                strokeDasharray={`${part.weight} ${100 - part.weight}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 150 150)"
                initial={reduceMotion ? false : { opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.55 }}
                transition={{ duration: 0.55, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
              />
            );
          })}
          <text x="150" y="144" textAnchor="middle" className="marketing-score-center" fill="#102b37">MC</text>
          <text x="150" y="170" textAnchor="middle" className="marketing-score-caption" fill="#5b7780">Mindscore</text>
        </svg>
      </div>
      <div className="min-w-0">
        <p className="mb-7 font-display text-2xl font-semibold tracking-[-0.04em] text-[#102b37] sm:text-3xl">A score built from the work.</p>
        <dl className="border-t border-[#bcd6d4]">
          {scoreParts.map((part, index) => (
            <MarketingReveal key={part.name} delay={index * 0.07} className="flex items-center gap-4 border-b border-[#c9dfdd] py-4 sm:gap-6">
              <span aria-hidden="true" className="h-1 w-7 shrink-0 rounded-full sm:w-10" style={{ backgroundColor: part.color }} />
              <dt className="min-w-0 flex-1 text-sm font-medium text-[#253e48] sm:text-base">{part.name}</dt>
              <dd className="font-display text-2xl font-semibold tabular-nums tracking-[-0.04em] text-[#102b37]">{part.weight}%</dd>
            </MarketingReveal>
          ))}
        </dl>
        <p className="mt-7 max-w-xl text-sm leading-relaxed text-[#526e75]">Active goals are measured against their timeline. If a part has no measurable data, its weight is shared across the others.</p>
      </div>
    </div>
  );
}
