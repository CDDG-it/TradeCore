import Link from "next/link";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Check, Infinity as InfinityIcon, Layers3 } from "lucide-react";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/footer";
import { MarketingReveal } from "@/components/landing/marketing-motion";
import { PricingPlans } from "@/components/landing/pricing-plans";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Pricing",
  description: "Explore TradingMC Basic, Plus and Pro. Every plan is currently free during launch, with no card required.",
};

const questions = [
  { q: "Why is TradingMC free right now?", a: "We are opening every feature during launch so traders can use the full product and help shape what comes next. No card is required." },
  { q: "When will billing begin?", a: "There is no billing date yet. We will announce paid access clearly before anything changes; you will never be charged automatically for joining now." },
  { q: "How does annual billing work?", a: "Annual plans include two months free: $100 for Basic, $250 for Plus and $450 for Pro, billed once per year." },
  { q: "Can I change plans later?", a: "Yes. Once billing launches, you will be able to upgrade or downgrade as your accounts and workflow change." },
  { q: "Is my data mine?", a: "Yes. Your trades, plans, reviews and screenshots remain scoped to your account and are protected by row-level access controls." },
] as const;

const comparison = [
  { icon: Layers3, title: "Accounts grow with you", body: "Start with one account, move to five with Plus, or manage an unlimited account book with Pro." },
  { icon: InfinityIcon, title: "Practice without friction", body: "Basic includes five pre-market exercises each month. Plus and Pro remove that limit." },
  { icon: Check, title: "Depth where you need it", body: "Every tier journals trades. Higher tiers add Mindscore, deeper reviews, simulation and market context." },
] as const;

export default function PricingPage() {
  return <div className={`${inter.variable} marketing-page min-h-screen overflow-x-clip bg-[#0b1120] text-white`}>
    <LandingNav />
    <main id="main">
      <section className="marketing-hero relative overflow-hidden px-5 pb-16 pt-10 sm:px-10 sm:pt-14 lg:min-h-[calc(100svh-72px)] lg:px-12 lg:pb-10">
        <div aria-hidden="true" className="marketing-grid pointer-events-none absolute inset-0 opacity-30" />
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[-280px] h-[620px] w-[900px] -translate-x-1/2 rounded-full bg-[#0b67c9]/20 blur-[110px]" />
        <div className="relative mx-auto max-w-[1180px]">
          <MarketingReveal className="mx-auto max-w-5xl text-center">
            <h1 className="font-display text-balance text-[clamp(2.7rem,5vw,4.8rem)] font-semibold leading-[.98] tracking-[-.06em]">A plan that grows with <span className="text-[#6ad5c9]">your edge.</span></h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-[1.65] text-[#b8ccd0] sm:text-base">From your first structured journal to a complete performance system. Choose the depth you need and move up when your trading does.</p>
          </MarketingReveal>
          <MarketingReveal delay={0.08} className="mx-auto mt-5 max-w-2xl rounded-full border border-[#14b8a6]/25 bg-[#14b8a6]/[.08] px-5 py-2.5 text-center">
            <p className="text-xs leading-relaxed text-[#cce6e3]"><strong className="text-white">Launch access is free.</strong> Every feature is open now. No card, no automatic charge.</p>
          </MarketingReveal>
          <MarketingReveal delay={0.14} className="mt-5"><PricingPlans /></MarketingReveal>
        </div>
      </section>

      <div aria-hidden="true" className="marketing-gradient-bridge marketing-gradient-bridge--light" />
      <div className="marketing-light-flow text-[#0b1120]">
        <section className="marketing-section marketing-section--mist px-6 py-20 sm:px-10 md:py-28 lg:px-12">
          <div className="mx-auto max-w-[1180px]">
            <MarketingReveal className="max-w-2xl"><p className="marketing-eyebrow text-[#0d817c]">What changes between plans</p><h2 className="font-display mt-5 text-balance text-[clamp(2.2rem,5vw,4.4rem)] font-semibold leading-[1.02] tracking-[-.055em]">More scale. More context. The same process.</h2></MarketingReveal>
            <div className="mt-12 grid gap-px overflow-hidden rounded-[28px] border border-[#c2dcda] bg-[#c2dcda] md:grid-cols-3">
              {comparison.map(({ icon: Icon, title, body }, index) => <MarketingReveal key={title} delay={index * .08} className="bg-[#edf7f5] p-7 sm:p-9"><Icon className="size-5 text-[#0d817c]" /><h3 className="mt-10 text-lg font-semibold text-[#102b37]">{title}</h3><p className="mt-3 text-sm leading-relaxed text-[#4d6871]">{body}</p></MarketingReveal>)}
            </div>
          </div>
        </section>
        <section className="marketing-section bg-white px-6 py-20 sm:px-10 md:py-28 lg:px-12">
          <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[.55fr_1fr] lg:gap-20">
            <MarketingReveal><p className="marketing-eyebrow text-[#0d817c]">The details</p><h2 className="font-display mt-5 text-balance text-[clamp(2.2rem,4vw,3.8rem)] font-semibold leading-[1.04] tracking-[-0.05em]">Questions, answered plainly.</h2><Link href="/signup" className="marketing-cta mt-8 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#14b8a6] px-7 text-sm font-semibold text-[#081721] hover:bg-[#70d9cf]">Start free</Link></MarketingReveal>
            <dl className="divide-y divide-[#c2dcda] border-y border-[#c2dcda]">{questions.map((item, index) => <MarketingReveal key={item.q} delay={.08 + index * .05} distance={12} className="grid gap-2 py-6 sm:grid-cols-[.42fr_1fr] sm:gap-8"><dt className="text-base font-semibold text-[#102b37]">{item.q}</dt><dd className="text-base leading-[1.65] text-[#4d6871]">{item.a}</dd></MarketingReveal>)}</dl>
          </div>
        </section>
      </div>
      <div aria-hidden="true" className="marketing-gradient-bridge marketing-gradient-bridge--dark" />
    </main>
    <LandingFooter />
  </div>;
}
