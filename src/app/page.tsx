import Link from "next/link";
import { Inter } from "next/font/google";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/footer";
import { LaptopDashboard } from "@/components/landing/dashboard-sample";
import { MarketContextVisual, ProcessCanvas, ReviewActionVisual, TherapistVisual } from "@/components/landing/marketing-visuals";
import { MindscoreAssembly } from "@/components/landing/marketing-motion";

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
        <section className="marketing-hero relative overflow-hidden px-6 pb-24 pt-20 sm:px-10 sm:pt-28 lg:px-12 lg:pb-32 lg:pt-32">
          <div aria-hidden="true" className="marketing-grid pointer-events-none absolute inset-0 opacity-35" />
          <div className="relative mx-auto grid max-w-[1380px] grid-cols-[minmax(0,1fr)] items-center gap-14 lg:grid-cols-[0.86fr_1.14fr] lg:gap-8">
            <div className="relative z-10 min-w-0 max-w-[610px]">
              <h1 className="font-display max-w-[720px] text-balance text-[clamp(2.55rem,11vw,3.6rem)] font-semibold leading-[0.98] tracking-[-0.06em] sm:text-[clamp(3.6rem,6.1vw,7.2rem)]">Journal for <span className="text-[#6ad5c9]">extraordinary traders</span></h1>
              <p className="mt-8 max-w-[520px] text-base leading-[1.75] text-[#b8ccd0] sm:text-lg">A journal can show what happened. TradingMC helps you write a plan, keep commitments and review the decisions that shape the next session.</p>
              <div className="mt-10 flex flex-wrap items-center gap-6">
                <Link href="/signup" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#14b8a6] px-7 py-3 text-sm font-semibold text-[#081721] transition-colors hover:bg-[#70d9cf]">Start building your process</Link>
                <a href="#the-approach" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#5a7f87] px-6 py-3 text-sm font-medium text-[#d9e8e9] transition-colors hover:border-[#a9ddd8] hover:bg-white/5 hover:text-white">See how it works</a>
              </div>
            </div>
            <div className="relative z-10 min-w-0 lg:translate-x-5"><LaptopDashboard /></div>
          </div>
        </section>

        <div aria-hidden="true" className="marketing-dark-to-light h-28 sm:h-40" />
        <div className="marketing-light-flow text-[#0b1120]">
          <section id="the-approach" className="px-6 pb-28 pt-16 sm:px-10 md:pb-40 md:pt-24 lg:px-12">
            <div className="mx-auto max-w-[1260px]">
              <div className="mb-16 lg:mb-20"><h2 className="font-display max-w-[900px] text-balance text-[clamp(3rem,5vw,5.7rem)] font-semibold leading-[1.02] tracking-[-0.055em]">Give the next session a direction.</h2><p className="mt-8 max-w-[720px] text-lg leading-[1.7] text-[#4d6871]">Write a trading plan that fits your edge. Turn the mistakes you recognise into commitments you can check. Build habits outside market hours and set goals against the numbers you already track.</p></div>
              <ProcessCanvas />
            </div>
          </section>

          <section id="mindscore" className="px-6 py-28 sm:px-10 md:py-40 lg:px-12">
            <div className="mx-auto max-w-[1260px]">
              <h2 className="font-display max-w-[850px] text-balance text-[clamp(3rem,5vw,5.7rem)] font-semibold leading-[1.02] tracking-[-0.055em]">Your effort, made visible.</h2>
              <p className="mt-8 max-w-[690px] text-lg leading-[1.7] text-[#4d6871]">The MC Mindscore brings together rule adherence, execution, habits, reflection work and goal progress. It reflects what you do on and off the charts, using information you actually log.</p>
              <div className="mt-16 lg:mt-20"><MindscoreAssembly /></div>
            </div>
          </section>

          <section id="trade-therapist" className="px-6 py-28 sm:px-10 md:py-40 lg:px-12">
            <div className="mx-auto max-w-[1260px]">
              <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20"><h2 className="font-display max-w-[660px] text-balance text-[clamp(3rem,5vw,5.7rem)] font-semibold leading-[1.02] tracking-[-0.055em]">A practice of looking closer.</h2><p className="max-w-[560px] self-end text-lg leading-[1.7] text-[#4d6871]">Trade Therapist guides you through a pre-market exercise, a post-market analysis and a written weekly review. At month end, a rollup of those reviews shows which patterns changed and which kept returning.</p></div>
              <div className="mt-16"><TherapistVisual /></div>
            </div>
          </section>

          <section className="px-6 py-28 sm:px-10 md:py-40 lg:px-12">
            <div className="mx-auto max-w-[1260px]">
              <h2 className="font-display max-w-[900px] text-balance text-[clamp(3rem,5vw,5.7rem)] font-semibold leading-[1.02] tracking-[-0.055em]">A review should change what you do.</h2>
              <p className="mt-8 max-w-[680px] text-lg leading-[1.7] text-[#536b74]">When a pattern appears, make it concrete. Commit to a response, check whether you followed it and carry the lesson into the next plan.</p>
              <div className="mt-20"><ReviewActionVisual /></div>
            </div>
          </section>

          <section className="px-6 py-24 sm:px-10 md:py-32 lg:px-12">
            <div className="mx-auto grid max-w-[1260px] items-center gap-14 lg:grid-cols-[1fr_0.8fr] lg:gap-24"><h2 className="font-display max-w-[650px] text-balance text-[clamp(2.7rem,4.5vw,5rem)] font-semibold leading-[1.04] tracking-[-0.055em]">Your process meets the market you actually trade.</h2><MarketContextVisual /></div>
          </section>
        </div>
        <div aria-hidden="true" className="marketing-light-to-dark h-28 sm:h-40" />

        <section className="relative overflow-hidden bg-[#0b1120] px-6 py-32 sm:px-10 md:py-44 lg:px-12"><div aria-hidden="true" className="marketing-grid pointer-events-none absolute inset-0 opacity-20" /><div className="relative mx-auto max-w-[1260px]"><h2 className="font-display max-w-[1050px] text-balance text-[clamp(2.6rem,10vw,3.8rem)] font-semibold leading-[0.98] tracking-[-0.06em] sm:text-[clamp(3.8rem,7vw,8rem)]">An ordinary journal won&apos;t build an <span className="text-[#65d4c8]">extraordinary trader.</span></h2><div className="mt-12 flex flex-wrap items-center gap-8"><Link href="/signup" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#14b8a6] px-7 py-3 text-sm font-semibold text-[#081721] transition-colors hover:bg-[#70d9cf]">Create your account</Link></div></div></section>
      </main>
      <LandingFooter />
    </div>
  );
}
