"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { PLANS, type PlanDefinition } from "@/lib/plans";

type BillingPeriod = "monthly" | "annually";
const PLAN_LIST = [PLANS.basic, PLANS.plus, PLANS.pro] as const;

function features(plan: PlanDefinition): string[] {
  const e = plan.entitlements;
  return [
    `${e.accounts === "unlimited" ? "Unlimited" : e.accounts} trading account${e.accounts === 1 ? "" : "s"}`,
    "Unlimited journal and all pre-market exercises",
    "Daily session review",
    e.historyRetentionDays ? `${e.historyRetentionDays}-day history retention` : "Full history retention",
    e.mindscore === "full" ? "MC Mindscore breakdown and trend" : "MC Mindscore score",
    e.goals ? "Habits, goals and standing rules" : "Habits",
    ...(e.advancedAnalytics ? ["Advanced analytics and screenshots", "Best trade of the day"] : []),
    ...(e.weeklyReviews ? [e.monthlyReviews ? "Weekly and monthly reviews" : "Weekly reviews"] : []),
    ...(e.monteCarlo ? ["Monte Carlo evaluation simulator"] : []),
    `Global Markets: ${e.globalMarkets === "full" ? "calendar, markets and COT" : e.globalMarkets}`,
    ...(e.prioritySupport ? ["Priority support"] : []),
  ];
}

export function PricingPlans() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const reduceMotion = useReducedMotion();
  return <div>
    <div className="mx-auto flex w-fit items-center rounded-full border border-white/12 bg-white/[0.04] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,.05)]" role="group" aria-label="Billing period">
      {(["monthly", "annually"] as const).map((option) => <motion.button key={option} type="button" aria-pressed={period === option} onClick={() => setPeriod(option)} whileTap={reduceMotion ? undefined : { scale: .96 }} className={cn("relative min-w-28 overflow-hidden rounded-full px-5 py-2.5 text-xs font-semibold capitalize", period === option ? "text-[#07151e]" : "text-[#9db6bb] hover:text-white")}>
        {period === option && <motion.span layoutId="pricing-billing-pill" aria-hidden className="absolute inset-0 rounded-full bg-[#14b8a6] shadow-[0_6px_20px_rgba(20,184,166,.28)]" transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 470, damping: 36 }} />}
        <span className="relative z-10">{option}</span>
      </motion.button>)}
    </div>
    <div className="mt-5 grid grid-flow-dense items-stretch gap-4 lg:grid-cols-3">
      {PLAN_LIST.map((plan, index) => {
        const annual = period === "annually";
        return <motion.article
          key={plan.id}
          initial={reduceMotion ? false : { opacity: 0, y: 26, scale: .975 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: .55, delay: reduceMotion ? 0 : .08 + index * .08, ease: [.23, 1, .32, 1] }}
          whileHover={reduceMotion ? undefined : { y: -7, scale: 1.008 }}
          className={cn("group relative flex min-h-[400px] flex-col overflow-hidden rounded-[22px] border p-5 transition-[border-color,box-shadow] duration-500", plan.popular ? "border-[#36ccbd]/60 bg-[linear-gradient(155deg,rgba(20,184,166,.20)_0%,rgba(13,28,41,.96)_34%,#0d1c29_100%)] shadow-[0_22px_60px_rgba(6,182,212,.14)] hover:shadow-[0_28px_75px_rgba(6,182,212,.22)]" : "border-white/12 bg-[#0d1c29]/90 shadow-[0_18px_50px_rgba(0,0,0,.2)] hover:border-white/25 hover:shadow-[0_26px_65px_rgba(0,0,0,.32)]")}
        >
          <div aria-hidden className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#70d9cf]/70 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <AnimatePresence mode="wait" initial={false}>{annual ? <motion.div key="saving" initial={reduceMotion ? false : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -8 }} className="absolute right-0 top-0 rounded-bl-2xl bg-[#b5e5f2] px-4 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#07151e]">2 months free</motion.div> : plan.popular ? <motion.div key="popular" initial={reduceMotion ? false : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -8 }} className="absolute right-0 top-0 rounded-bl-2xl bg-[#14b8a6] px-4 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#07151e]">Most popular</motion.div> : null}</AnimatePresence>
          <h2 className="text-base font-semibold text-white">{plan.name}</h2>
          <p className="mt-2 min-h-10 max-w-[32ch] text-xs leading-relaxed text-[#9db6bb]">{plan.description}</p>
          <div className="mt-5 min-h-[72px]"><div className="flex items-end gap-2"><span className="font-display text-5xl font-semibold leading-none tracking-[-.065em] text-white">$<AnimatePresence mode="wait" initial={false}><motion.span key={`${plan.name}-${period}`} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: .18 }} className="inline-block">{annual ? plan.annualPrice : plan.monthlyPrice}</motion.span></AnimatePresence></span><span className="pb-1 text-xs font-medium text-[#829da4]">/ {annual ? "year" : "month"}</span></div><p className="mt-1.5 text-[11px] text-[#7f9aa1]">{annual ? `$${(plan.annualPrice / 12).toFixed(2)}/month · billed annually` : "Billed monthly"}</p></div>
          <motion.div className="mt-4" whileHover={reduceMotion ? undefined : { y: -2, scale: 1.012 }} whileTap={reduceMotion ? undefined : { scale: .975 }}><Link href="/signup" className={cn("marketing-cta relative inline-flex min-h-10 w-full items-center justify-center overflow-hidden rounded-full px-6 text-xs font-semibold", plan.popular ? "bg-[#14b8a6] text-[#07151e] hover:bg-[#70d9cf]" : "border border-white/15 bg-white/[.04] text-white hover:border-[#65d4c8]/60 hover:bg-white/[.08]")}><span className="relative z-10">Start free</span><span aria-hidden className="absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" /></Link></motion.div>
          <div className="my-5 h-px bg-white/10" />
          <ul className="space-y-2.5">{features(plan).map((feature) => <li key={feature} className="border-l border-[#14b8a6]/35 pl-3 text-xs leading-snug text-[#c4d5d8] transition-colors duration-300 group-hover:border-[#70d9cf]/70">{feature}</li>)}</ul>
        </motion.article>;
      })}
    </div>
  </div>;
}

const COMPARISON_ROWS: { label: string; values: [string, string, string] }[] = [
  { label: "Accounts", values: ["1", "5", "Unlimited"] },
  { label: "Journal", values: ["Unlimited", "Unlimited", "Unlimited"] },
  { label: "Pre-market exercises", values: ["Unlimited · all types", "Unlimited · all types", "Unlimited · all types"] },
  { label: "Session review", values: ["Yes", "Yes", "Yes"] },
  { label: "History retention", values: ["90 days", "Full", "Full"] },
  { label: "MC Mindscore", values: ["Score only", "Full breakdown + trend", "Full breakdown + trend"] },
  { label: "Habits, goals, standing rules", values: ["Habits only", "Full", "Full"] },
  { label: "Advanced analytics + screenshots", values: ["—", "Yes", "Yes"] },
  { label: "Best trade of the day", values: ["—", "Yes", "Yes"] },
  { label: "Weekly + monthly reviews", values: ["—", "Weekly", "Weekly + monthly"] },
  { label: "Prop rule tracking", values: ["1 account", "5 accounts", "Unlimited"] },
  { label: "Monte Carlo evaluation simulator", values: ["—", "—", "Yes"] },
  { label: "Global Markets", values: ["Calendar only", "Calendar + markets", "Full incl. COT"] },
  { label: "Priority support", values: ["—", "—", "Yes"] },
];

export function PricingComparisonTable() {
  const plans = [PLANS.basic, PLANS.plus, PLANS.pro] as const;
  return <div className="overflow-x-auto rounded-[24px] border border-[#c2dcda] bg-white shadow-[0_24px_70px_-45px_rgba(13,129,124,.35)]">
    <table className="w-full min-w-[760px] border-collapse text-left text-sm">
      <thead><tr className="bg-[#e8f5f3]"><th className="px-5 py-4 font-semibold text-[#4d6871]">Capability</th>{plans.map((plan) => <th key={plan.id} className="px-5 py-4"><span className="block text-base font-semibold text-[#102b37]">{plan.name}</span><span className="text-xs font-medium text-[#0d817c]">${plan.monthlyPrice}/mo · ${plan.annualPrice}/yr</span></th>)}</tr></thead>
      <tbody>{COMPARISON_ROWS.map((row) => <tr key={row.label} className="border-t border-[#d7e8e6]"><th className="px-5 py-3.5 font-medium text-[#294954]">{row.label}</th>{row.values.map((value, index) => <td key={`${row.label}-${plans[index].id}`} className={cn("px-5 py-3.5", value === "—" ? "text-[#9ab0b3]" : "text-[#102b37]")}>{value}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}
