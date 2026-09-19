import Link from "next/link";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Check } from "lucide-react";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/footer";
import { MarketingReveal } from "@/components/landing/marketing-motion";
import { FEATURES } from "@/lib/landing/features";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Pricing",
  description: "TradingMC is free during early access. Every feature, no card required.",
};

// There is no billing yet: the whole product is open to every account. The
// page says exactly that instead of dressing up tiers that do not exist.
const questions = [
  { q: "Do I need a card to start?", a: "No. Create an account and the full product is yours. Nothing is charged." },
  { q: "Will it stay free?", a: "Early access is free while the product is being finished. Paid plans, when they arrive, will be announced here first and to every existing account by email." },
  { q: "Is my data mine?", a: "Yes. Every trade, plan, review and screenshot is scoped to your account, and only your account can read it." },
] as const;

export default function PricingPage() {
  return (
    <div className={`${inter.variable} marketing-page min-h-screen overflow-x-clip bg-[#0b1120] text-white`}>
      <LandingNav />
      <main id="main">
        <section className="marketing-hero relative overflow-hidden px-6 pb-20 pt-20 sm:px-10 sm:pt-28 lg:px-12 lg:pb-28">
          <div aria-hidden="true" className="marketing-grid pointer-events-none absolute inset-0 opacity-35" />
          <div className="relative mx-auto max-w-[1260px]">
            <MarketingReveal>
              <p className="marketing-eyebrow" style={{ color: "#7be0d5" }}>Early access</p>
              <h1 className="font-display mt-6 max-w-[820px] text-balance text-[clamp(2.6rem,9vw,3.6rem)] font-semibold leading-[0.98] tracking-[-0.06em] sm:text-[clamp(3.6rem,6vw,6.4rem)]">Everything included. <span className="text-[#6ad5c9]">Free while we build.</span></h1>
              <p className="mt-8 max-w-[560px] text-base leading-[1.75] text-[#b8ccd0] sm:text-lg">One product, one price: none. Every feature is open to every account during early access, with no card and no trial clock.</p>
            </MarketingReveal>

            <div className="mt-14 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
              <MarketingReveal delay={0.1} className="rounded-[32px] border border-[#14b8a6]/35 bg-[#0d1c29] p-8 shadow-[0_30px_80px_rgba(0,0,0,.45)] sm:p-10">
                <p className="text-xs font-semibold tracking-[0.14em] text-[#8de0d5]">EARLY ACCESS</p>
                <p className="font-display mt-6 flex items-baseline gap-2 text-6xl font-semibold tracking-[-0.06em]">€0<span className="text-base font-medium tracking-normal text-[#8aa5ab]">/ month</span></p>
                <p className="mt-4 text-sm leading-relaxed text-[#aac2c7]">The full product. Unlimited trades, accounts, plans and reviews.</p>
                <Link href="/signup" className="marketing-cta mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#14b8a6] px-7 text-sm font-semibold text-[#081721] hover:bg-[#70d9cf]">Create your account</Link>
                <p className="mt-4 text-center text-xs text-[#7f9aa1]">No card required. Already a member? <Link href="/login" className="text-[#8de0d5] underline-offset-4 hover:underline">Sign in</Link></p>
              </MarketingReveal>

              <MarketingReveal delay={0.2} className="rounded-[32px] border border-white/10 bg-white/[0.03] p-8 sm:p-10">
                <p className="text-xs font-semibold tracking-[0.14em] text-[#8aa5ab]">WHAT IS INCLUDED</p>
                <ul className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  {FEATURES.map((feature, index) => (
                    <li key={feature.slug}>
                      <MarketingReveal delay={0.25 + index * 0.05} distance={10} className="flex gap-3">
                        <span aria-hidden="true" className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#14b8a6]/15 text-[#7be0d5]"><Check className="h-3 w-3" /></span>
                        <span><span className="block text-sm font-semibold text-white">{feature.name}</span><span className="mt-0.5 block text-xs leading-relaxed text-[#9db6bb]">{feature.tagline}</span></span>
                      </MarketingReveal>
                    </li>
                  ))}
                </ul>
              </MarketingReveal>
            </div>
          </div>
        </section>

        <div aria-hidden="true" className="marketing-gradient-bridge marketing-gradient-bridge--light" />
        <div className="marketing-light-flow text-[#0b1120]">
          <section className="marketing-section marketing-section--mist px-6 py-20 sm:px-10 md:py-28 lg:px-12">
            <div className="mx-auto grid max-w-[1260px] gap-10 lg:grid-cols-[0.5fr_1fr] lg:gap-20">
              <MarketingReveal><h2 className="font-display text-balance text-[clamp(2.2rem,4vw,3.8rem)] font-semibold leading-[1.04] tracking-[-0.05em]">Questions, answered plainly.</h2></MarketingReveal>
              <dl className="divide-y divide-[#c2dcda] border-y border-[#c2dcda]">
                {questions.map((item, index) => (
                  <MarketingReveal key={item.q} delay={0.1 + index * 0.08} distance={14} className="grid gap-2 py-6 sm:grid-cols-[0.45fr_1fr] sm:gap-8">
                    <dt className="text-base font-semibold text-[#102b37]">{item.q}</dt>
                    <dd className="text-base leading-[1.65] text-[#4d6871]">{item.a}</dd>
                  </MarketingReveal>
                ))}
              </dl>
            </div>
          </section>
        </div>
        <div aria-hidden="true" className="marketing-gradient-bridge marketing-gradient-bridge--dark" />
      </main>
      <LandingFooter />
    </div>
  );
}
