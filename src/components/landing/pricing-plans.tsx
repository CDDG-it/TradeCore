"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type BillingPeriod = "monthly" | "annually";
type PricingPlan = { name: "Basic" | "Plus" | "Pro"; monthly: number; annual: number; annualMonthly: string; description: string; features: readonly string[]; popular?: boolean };

const PLANS: readonly PricingPlan[] = [
  { name: "Basic", monthly: 10, annual: 100, annualMonthly: "8.33", description: "The essentials for building a consistent trading process.", features: ["1 trading account", "Unlimited trade journal", "Dashboard and core statistics", "5 pre-market exercises / month", "Weekly performance overview"] },
  { name: "Plus", monthly: 20, annual: 180, annualMonthly: "15.00", description: "For active traders ready to measure and refine their edge.", popular: true, features: ["Everything in Basic", "Up to 5 trading accounts", "Unlimited pre-market exercises", "MC Mindscore", "Habits, goals and commitments", "Advanced analytics and screenshots"] },
  { name: "Pro", monthly: 35, annual: 315, annualMonthly: "26.25", description: "The complete performance system for serious traders.", features: ["Everything in Plus", "Unlimited trading accounts", "Full MC Trade Therapist", "Best-trade, weekly and monthly reviews", "Monte Carlo evaluation simulator", "Full Global Markets context", "Priority support"] },
] as const;

export function PricingPlans() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const reduceMotion = useReducedMotion();
  return <div>
    <div className="mx-auto flex w-fit items-center rounded-full border border-white/12 bg-white/[0.04] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,.05)]" role="group" aria-label="Billing period">
      {(["monthly", "annually"] as const).map((option) => <button key={option} type="button" aria-pressed={period === option} onClick={() => setPeriod(option)} className={cn("min-w-28 rounded-full px-5 py-2.5 text-xs font-semibold capitalize transition-all", period === option ? "bg-[#14b8a6] text-[#07151e] shadow-[0_6px_20px_rgba(20,184,166,.28)]" : "text-[#9db6bb] hover:text-white")}>{option}{option === "annually" && <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wide">3 free</span>}</button>)}
    </div>
    <div className="mt-5 grid grid-flow-dense items-stretch gap-4 lg:grid-cols-3">
      {PLANS.map((plan, index) => {
        const annual = period === "annually";
        return <motion.article
          key={plan.name}
          initial={reduceMotion ? false : { opacity: 0, y: 26, scale: .975 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: .55, delay: reduceMotion ? 0 : .08 + index * .08, ease: [.23, 1, .32, 1] }}
          whileHover={reduceMotion ? undefined : { y: -7, scale: 1.008 }}
          className={cn("group relative flex min-h-[400px] flex-col overflow-hidden rounded-[22px] border p-5 transition-[border-color,box-shadow] duration-500", plan.popular ? "border-[#36ccbd]/60 bg-[linear-gradient(155deg,rgba(20,184,166,.20)_0%,rgba(13,28,41,.96)_34%,#0d1c29_100%)] shadow-[0_22px_60px_rgba(6,182,212,.14)] hover:shadow-[0_28px_75px_rgba(6,182,212,.22)]" : "border-white/12 bg-[#0d1c29]/90 shadow-[0_18px_50px_rgba(0,0,0,.2)] hover:border-white/25 hover:shadow-[0_26px_65px_rgba(0,0,0,.32)]")}
        >
          <div aria-hidden className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#70d9cf]/70 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          {plan.popular && <div className="absolute right-0 top-0 rounded-bl-2xl bg-[#14b8a6] px-4 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#07151e]">Most popular</div>}
          <h2 className="text-base font-semibold text-white">{plan.name}</h2>
          <p className="mt-2 min-h-10 max-w-[32ch] text-xs leading-relaxed text-[#9db6bb]">{plan.description}</p>
          <div className="mt-5 min-h-[72px]"><div className="flex items-end gap-2"><span className="font-display text-5xl font-semibold leading-none tracking-[-.065em] text-white">$<AnimatePresence mode="wait" initial={false}><motion.span key={`${plan.name}-${period}`} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: .18 }} className="inline-block">{annual ? plan.annual : plan.monthly}</motion.span></AnimatePresence></span><span className="pb-1 text-xs font-medium text-[#829da4]">/ {annual ? "year" : "month"}</span></div><p className="mt-1.5 text-[11px] text-[#7f9aa1]">{annual ? `$${plan.annualMonthly}/month · billed annually` : "Billed monthly"}</p></div>
          <Link href="/signup" className={cn("marketing-cta mt-4 inline-flex min-h-10 items-center justify-center rounded-full px-6 text-xs font-semibold", plan.popular ? "bg-[#14b8a6] text-[#07151e] hover:bg-[#70d9cf]" : "border border-white/15 bg-white/[.04] text-white hover:border-[#65d4c8]/60 hover:bg-white/[.08]")}>Start free</Link>
          <div className="my-5 h-px bg-white/10" />
          <ul className="space-y-2.5">{plan.features.map((feature) => <li key={feature} className="border-l border-[#14b8a6]/35 pl-3 text-xs leading-snug text-[#c4d5d8] transition-colors duration-300 group-hover:border-[#70d9cf]/70">{feature}</li>)}</ul>
        </motion.article>;
      })}
    </div>
  </div>;
}
