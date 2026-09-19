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

        <div aria-hidden="true" className="marketing-gradient-bridge marketing-gradient-bridge--light" />
        <div className="marketing-light-flow text-[#0b1120]">
          <section id="the-approach" className="marketing-section marketing-section--mist px-6 pb-16 pt-16 sm:px-10 md:pb-24 md:pt-24 lg:px-12">
            <div className="mx-auto max-w-[1260px]">
              <div className="mb-14 grid gap-7 lg:mb-18 lg:grid-cols-[1fr_0.58fr] lg:items-end lg:gap-20"><h2 className="font-display max-w-[900px] text-balance text-[clamp(3rem,5vw,5.7rem)] font-semibold leading-[1.02] tracking-[-0.055em]">Give the next session a direction.</h2><p className="max-w-[500px] text-lg leading-[1.65] text-[#4d6871]">Plan the session. Turn recurring mistakes into commitments, then track the habits and goals that support execution.</p></div>
              <ProcessCanvas />
            </div>
          </section>

          <section id="mindscore" className="marketing-section marketing-section--white px-6 py-24 sm:px-10 md:py-36 lg:px-12">
            <div className="mx-auto max-w-[1260px]">
              <h2 className="font-display max-w-[850px] text-balance text-[clamp(3rem,5vw,5.7rem)] font-semibold leading-[1.02] tracking-[-0.055em]">Your effort, made visible.</h2>
              <p className="mt-8 max-w-[680px] text-lg leading-[1.65] text-[#4d6871]">MC Mindscore turns the work you log on and off the charts into one explainable view.</p>
              <div className="mt-16 lg:mt-20"><MindscoreAssembly /></div>
            </div>
          </section>

          <section id="trade-therapist" className="marketing-section marketing-section--tint px-6 py-28 sm:px-10 md:py-40 lg:px-12">
            <div className="mx-auto max-w-[1260px]">
              <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20"><h2 className="font-display max-w-[660px] text-balance text-[clamp(3rem,5vw,5.7rem)] font-semibold leading-[1.02] tracking-[-0.055em]">A practice of looking closer.</h2><p className="max-w-[520px] self-end text-lg leading-[1.65] text-[#4d6871]">Prepare before the market, analyse after it and turn each week into a lesson. Monthly rollups show what persists.</p></div>
              <div className="mt-16"><TherapistVisual /></div>
            </div>
          </section>

          <section className="marketing-section marketing-section--white px-6 py-28 sm:px-10 md:py-40 lg:px-12">
            <div className="mx-auto grid max-w-[1260px] gap-14 lg:grid-cols-[0.68fr_1.32fr] lg:items-center lg:gap-24">
              <div><h2 className="font-display max-w-[580px] text-balance text-[clamp(3rem,5vw,5.7rem)] font-semibold leading-[1.02] tracking-[-0.055em]">A review should change what you do.</h2><p className="mt-8 max-w-[450px] text-lg leading-[1.65] text-[#536b74]">Turn a recognised pattern into one response for the next session.</p></div>
              <ReviewActionVisual />
            </div>
          </section>

          <section className="marketing-section marketing-section--mist px-6 py-24 sm:px-10 md:py-32 lg:px-12">
            <div className="mx-auto max-w-[1260px]"><h2 className="font-display max-w-[850px] text-balance text-[clamp(2.7rem,4.5vw,5rem)] font-semibold leading-[1.04] tracking-[-0.055em]">Your process meets the market you actually trade.</h2><div className="mt-14 lg:mt-18"><MarketContextVisual /></div></div>
          </section>
        </div>
        <div aria-hidden="true" className="marketing-gradient-bridge marketing-gradient-bridge--dark" />

        <section className="relative overflow-hidden bg-[#0b1120] px-6 py-32 sm:px-10 md:py-44 lg:px-12"><div aria-hidden="true" className="marketing-grid pointer-events-none absolute inset-0 opacity-20" /><div className="relative mx-auto max-w-[1260px]"><h2 className="font-display max-w-[1050px] text-balance text-[clamp(2.6rem,10vw,3.8rem)] font-semibold leading-[0.98] tracking-[-0.06em] sm:text-[clamp(3.8rem,7vw,8rem)]">An ordinary journal won&apos;t build an <span className="text-[#65d4c8]">extraordinary trader.</span></h2><div className="mt-12 flex flex-wrap items-center gap-8"><Link href="/signup" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#14b8a6] px-7 py-3 text-sm font-semibold text-[#081721] transition-colors hover:bg-[#70d9cf]">Create your account</Link></div></div></section>
      </main>
      <LandingFooter />
    </div>
  );
}
