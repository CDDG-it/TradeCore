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
    <div className="marketing-score-assembly overflow-hidden rounded-[36px] border border-[#c2dcda] bg-[#edf7f5] shadow-[0_28px_75px_rgba(27,88,92,.10)]" aria-label="MC Mindscore weighting: rule adherence 35 percent, execution 20 percent, habit consistency 20 percent, reflection work 15 percent, goal progress 10 percent">
      <div className="grid items-stretch lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative grid min-h-[430px] place-items-center overflow-hidden border-b border-[#c2dcda] p-8 lg:border-b-0 lg:border-r lg:p-12">
          <div aria-hidden="true" className="absolute inset-[13%] rounded-full bg-[#8edbd2]/30 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full border border-[#5fbab3]/20 shadow-[0_0_0_38px_rgba(95,186,179,.04),0_0_0_80px_rgba(95,186,179,.03)]" />
          <svg className="relative w-full max-w-[390px]" viewBox="0 0 300 300" role="img" aria-label="Five weighted segments forming the MC Mindscore">
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
        <div className="min-w-0 p-7 sm:p-10 lg:p-12">
          <div className="flex items-baseline justify-between gap-5"><p className="font-display text-2xl font-semibold tracking-[-0.04em] text-[#102b37] sm:text-3xl">Five measurable parts.</p><span className="text-xs font-semibold tracking-[0.12em] text-[#68848b]">EXPLAINABLE</span></div>
          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[24px] border border-[#bdd7d4] bg-[#bdd7d4]">
          {scoreParts.map((part, index) => (
            <MarketingReveal key={part.name} delay={index * 0.07} className={`relative bg-white/70 p-5 sm:p-6 ${index === scoreParts.length - 1 ? "col-span-2" : ""}`}>
              <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: part.color }} />
              <dd className="font-display text-3xl font-semibold tabular-nums tracking-[-0.05em] text-[#102b37] sm:text-4xl">{part.weight}%</dd>
              <dt className="mt-3 text-xs font-semibold text-[#526f77] sm:text-sm">{part.name}</dt>
            </MarketingReveal>
          ))}
          </dl>
          <p className="mt-7 max-w-xl text-sm leading-relaxed text-[#526e75]">No active goal? Its weight is shared across the other logged work.</p>
        </div>
      </div>
    </div>
  );
}
