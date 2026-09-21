import Link from "next/link";
import { Inter } from "next/font/google";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/footer";
import { DashboardScreenshot } from "@/components/landing/dashboard-sample";
import { MarketContextVisual, ProcessCanvas, ReviewCanvas, TherapistVisual, marketTabs, reviewSteps, therapistCadence } from "@/components/landing/marketing-visuals";
import { MarketingReveal, MindscoreAssembly, SectionHeader } from "@/components/landing/marketing-motion";

// The landing page's own typeface. Loaded here rather than in the root layout
// so the signed-in app never preloads a family it does not use.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export default function HomePage() {
  return (
    <div className={`${inter.variable} marketing-page min-h-screen overflow-x-clip bg-[#0b1120] text-white`}>
      <a href="#main" className="sr-only bg-[#14b8a6] px-4 py-2 font-semibold text-[#0b1120] focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50">Skip to content</a>
      <LandingNav />
      <main id="main">
        <section id="dashboard" className="marketing-hero relative flex min-h-[calc(100svh-72px)] flex-col justify-center overflow-hidden px-6 py-16 sm:px-10 sm:py-20 lg:px-12 lg:py-24">
          <div aria-hidden="true" className="marketing-grid pointer-events-none absolute inset-0 opacity-35" />
          <div className="relative mx-auto grid w-full max-w-[1500px] grid-cols-[minmax(0,1fr)] items-center gap-14 lg:grid-cols-[0.94fr_1.06fr] lg:gap-16">
            <div className="relative z-10 min-w-0 max-w-[720px]">
              <h1 className="font-display max-w-[720px] text-balance text-[clamp(2.6rem,11vw,3.7rem)] font-semibold leading-[0.96] tracking-[-0.06em] sm:text-[clamp(3.9rem,5.7vw,6rem)]">Journal for <span className="text-[#6ad5c9]">extraordinary traders</span></h1>
              <p className="mt-9 max-w-[560px] text-lg leading-[1.7] text-[#b8ccd0] sm:text-xl">A journal can show what happened. TradingMC helps you write a plan, keep commitments and review the decisions that shape the next session.</p>
              <div className="mt-12 flex flex-wrap items-center gap-5">
                <Link href="/signup" className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-[#14b8a6] px-9 py-4 text-base font-semibold text-[#081721] transition-colors hover:bg-[#70d9cf]">Start building your process</Link>
                <a href="#the-approach" className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-[#5a7f87] px-8 py-4 text-base font-medium text-[#d9e8e9] transition-colors hover:border-[#a9ddd8] hover:bg-white/5 hover:text-white">See how it works</a>
              </div>
            </div>
            <div className="relative z-10 min-w-0"><DashboardScreenshot /></div>
          </div>
        </section>

        <div aria-hidden="true" className="marketing-gradient-bridge marketing-gradient-bridge--light" />
        <div className="marketing-light-flow text-[#0b1120]">
          <section id="the-approach" className="marketing-section marketing-section--mist px-6 pb-20 pt-16 sm:px-10 md:pb-28 md:pt-24 lg:px-12">
            <div className="mx-auto max-w-[1260px]">
              <SectionHeader index="01" label="My Edge" title="Give the next session a direction." className="mb-14 lg:mb-18">
                Plan the session. Turn recurring mistakes into commitments, then track the habits and goals that support execution.
              </SectionHeader>
              <ProcessCanvas />
            </div>
          </section>

          <section id="mindscore" className="marketing-section marketing-section--white px-6 py-24 sm:px-10 md:py-32 lg:px-12 lg:py-40">
            <div className="mx-auto max-w-[1260px]">
              <SectionHeader index="02" label="MC Mindscore" title="Your effort, made visible." className="mb-14 lg:mb-20">
                MC Mindscore turns the work you log on and off the charts into one explainable view.
              </SectionHeader>
              <MindscoreAssembly />
            </div>
          </section>

          <section id="trade-therapist" className="marketing-section marketing-section--tint px-6 py-24 sm:px-10 md:py-32 lg:px-12 lg:py-40">
            <div className="mx-auto grid max-w-[1260px] gap-12 lg:grid-cols-[0.42fr_0.58fr] lg:gap-20">
              <div className="marketing-sticky">
                <SectionHeader index="03" label="MC Trade Therapist" title="A practice of looking closer." align="stack">
                  Prepare before the market, analyse after it and turn each week into a lesson. Monthly rollups show what persists.
                </SectionHeader>
                <MarketingReveal delay={0.2} distance={12} className="mt-10 hidden lg:block">
                  <ol className="divide-y divide-[#c2dcda] border-y border-[#c2dcda]">
                    {therapistCadence.map((item, index) => (
                      <li key={item.label} className="flex items-baseline justify-between gap-6 py-4 text-sm">
                        <span className="flex items-baseline gap-4"><span className="font-display tabular-nums text-[#167c79]">0{index + 1}</span><span className="font-medium text-[#102b37]">{item.label}</span></span>
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6b858b]">{item.meta}</span>
                      </li>
                    ))}
                  </ol>
                </MarketingReveal>
              </div>
              <TherapistVisual />
            </div>
          </section>

          <section id="review" className="marketing-section marketing-section--white px-6 py-24 sm:px-10 md:py-32 lg:px-12 lg:py-40">
            <div className="mx-auto grid max-w-[1260px] gap-12 lg:grid-cols-[0.38fr_0.62fr] lg:gap-20">
              <div className="marketing-sticky">
                <SectionHeader index="04" label="Best trade of the day" title="A review should change what you do." align="stack">
                  Look back at the trade you took, mark the best trade that was on offer, and turn the difference into one response for the next session.
                </SectionHeader>
                <MarketingReveal delay={0.2} distance={12} className="mt-10 hidden lg:block">
                  <ol className="divide-y divide-[#c2dcda] border-y border-[#c2dcda]">
                    {reviewSteps.map((item, index) => (
                      <li key={item.label} className="flex items-baseline justify-between gap-6 py-4 text-sm">
                        <span className="flex items-baseline gap-4"><span className="font-display tabular-nums text-[#167c79]">0{index + 1}</span><span className="font-medium text-[#102b37]">{item.label}</span></span>
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6b858b]">{item.meta}</span>
                      </li>
                    ))}
                  </ol>
                </MarketingReveal>
              </div>
              <ReviewCanvas />
            </div>
          </section>

          <section id="market-context" className="marketing-section marketing-section--mist px-6 py-24 sm:px-10 md:py-32 lg:px-12 lg:py-40">
            <div className="mx-auto max-w-[1260px]">
              <SectionHeader index="05" label="Global Markets" title="Your process meets the market you actually trade." className="mb-14 lg:mb-18">
                Releases, positioning and the rates backdrop sit beside the plan you already wrote, so context informs the session without rewriting it.
              </SectionHeader>
              <MarketingReveal delay={0.15} distance={10} className="mb-6 hidden lg:block">
                <ol className="flex divide-x divide-[#c2dcda] border-y border-[#c2dcda] text-sm">
                  {marketTabs.map((tab, index) => (
                    <li key={tab.label} className="flex flex-1 items-baseline gap-4 px-5 py-4 first:pl-0 last:pr-0">
                      <span className="font-display tabular-nums text-[#167c79]">0{index + 1}</span>
                      <span className="font-medium text-[#102b37]">{tab.label}</span>
                      <span className="ml-auto text-xs font-semibold uppercase tracking-[0.12em] text-[#6b858b]">{tab.meta}</span>
                    </li>
                  ))}
                </ol>
              </MarketingReveal>
              <MarketContextVisual />
            </div>
          </section>
        </div>
        <div aria-hidden="true" className="marketing-gradient-bridge marketing-gradient-bridge--dark" />

        <section className="relative overflow-hidden bg-[#0b1120] px-6 py-32 sm:px-10 md:py-44 lg:px-12">
          <div aria-hidden="true" className="marketing-grid pointer-events-none absolute inset-0 opacity-20" />
          <div className="relative mx-auto max-w-[1260px]">
            <MarketingReveal>
              <h2 className="font-display max-w-[1050px] text-balance text-[clamp(2.6rem,10vw,3.8rem)] font-semibold leading-[0.98] tracking-[-0.06em] sm:text-[clamp(3.8rem,7vw,8rem)]">An ordinary journal won&apos;t build an <span className="text-[#65d4c8]">extraordinary trader.</span></h2>
            </MarketingReveal>
            <MarketingReveal delay={0.15} distance={16} className="mt-12 flex flex-wrap items-center gap-6">
              <Link href="/signup" className="marketing-cta inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#14b8a6] px-7 py-3 text-sm font-semibold text-[#081721] hover:bg-[#70d9cf]">Create your account</Link>
              <Link href="/login" className="marketing-cta inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#5a7f87] px-6 py-3 text-sm font-medium text-[#d9e8e9] hover:border-[#a9ddd8] hover:bg-white/5 hover:text-white">Sign in</Link>
            </MarketingReveal>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
