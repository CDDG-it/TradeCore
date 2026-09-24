"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type BillingPeriod = "monthly" | "annually";
type PricingPlan = { name: "Basic" | "Plus" | "Pro"; monthly: number; annual: number; annualMonthly: string; description: string; features: readonly string[]; popular?: boolean };

const PLANS: readonly PricingPlan[] = [
  { name: "Basic", monthly: 10, annual: 100, annualMonthly: "8.33", description: "The essentials for building a consistent trading process.", features: ["1 trading account", "Unlimited trade journal", "Dashboard and core statistics", "5 pre-market exercises / month", "Weekly performance overview"] },
  { name: "Plus", monthly: 25, annual: 250, annualMonthly: "20.83", description: "For active traders ready to measure and refine their edge.", popular: true, features: ["Everything in Basic", "Up to 5 trading accounts", "Unlimited pre-market exercises", "MC Mindscore", "Habits, goals and commitments", "Advanced analytics and screenshots"] },
  { name: "Pro", monthly: 45, annual: 450, annualMonthly: "37.50", description: "The complete performance system for serious traders.", features: ["Everything in Plus", "Unlimited trading accounts", "Full MC Trade Therapist", "Best-trade, weekly and monthly reviews", "Monte Carlo evaluation simulator", "Full Global Markets context", "Priority support"] },
] as const;

export function PricingPlans() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  return <div>
    <div className="mx-auto flex w-fit items-center rounded-full border border-white/12 bg-white/[0.04] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,.05)]" role="group" aria-label="Billing period">
      {(["monthly", "annually"] as const).map((option) => <button key={option} type="button" aria-pressed={period === option} onClick={() => setPeriod(option)} className={cn("min-w-28 rounded-full px-5 py-2.5 text-xs font-semibold capitalize transition-all", period === option ? "bg-[#14b8a6] text-[#07151e] shadow-[0_6px_20px_rgba(20,184,166,.28)]" : "text-[#9db6bb] hover:text-white")}>{option}{option === "annually" && <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wide">2 free</span>}</button>)}
    </div>
    <div className="mt-10 grid items-stretch gap-5 lg:grid-cols-3">
      {PLANS.map((plan) => {
        const annual = period === "annually";
        return <article key={plan.name} className={cn("relative flex min-h-[520px] flex-col overflow-hidden rounded-[28px] border p-7 sm:p-8", plan.popular ? "border-[#36ccbd]/60 bg-[linear-gradient(155deg,rgba(20,184,166,.22)_0%,rgba(13,28,41,.96)_35%,#0d1c29_100%)] shadow-[0_25px_70px_rgba(6,182,212,.16)]" : "border-white/12 bg-[#0d1c29]/90 shadow-[0_20px_55px_rgba(0,0,0,.22)]")}>
          {plan.popular && <div className="absolute right-0 top-0 rounded-bl-2xl bg-[#14b8a6] px-4 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#07151e]">Most popular</div>}
          <div className="flex items-center gap-2"><h2 className="text-lg font-semibold text-white">{plan.name}</h2>{plan.popular && <Sparkles className="size-4 text-[#7be0d5]" aria-hidden="true" />}</div>
          <p className="mt-3 min-h-12 text-sm leading-relaxed text-[#9db6bb]">{plan.description}</p>
          <div className="mt-8 min-h-[92px]"><div className="flex items-end gap-2"><span className="font-display text-6xl font-semibold leading-none tracking-[-.065em] text-white">${annual ? plan.annual : plan.monthly}</span><span className="pb-1.5 text-sm font-medium text-[#829da4]">/ {annual ? "year" : "month"}</span></div><p className="mt-2 text-xs text-[#7f9aa1]">{annual ? `$${plan.annualMonthly}/month · billed annually` : "Billed monthly"}</p></div>
          <Link href="/signup" className={cn("marketing-cta mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl px-6 text-sm font-semibold", plan.popular ? "bg-[#14b8a6] text-[#07151e] hover:bg-[#70d9cf]" : "border border-white/20 bg-white/[.04] text-white hover:border-[#65d4c8]/60 hover:bg-white/[.08]")}>Start free</Link>
          <div className="my-7 h-px bg-white/10" />
          <ul className="space-y-3.5">{plan.features.map((feature) => <li key={feature} className="flex gap-3 text-sm leading-snug text-[#c4d5d8]"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#14b8a6]/15 text-[#72d9ce]"><Check className="size-3" strokeWidth={2.5} /></span>{feature}</li>)}</ul>
        </article>;
      })}
    </div>
  </div>;
}
