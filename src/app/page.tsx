import Link from "next/link";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/footer";
import { DashboardScreenshot } from "@/components/landing/dashboard-sample";
import { MarketContextVisual, ProcessCanvas, ReviewCanvas, TherapistVisual } from "@/components/landing/marketing-visuals";
import { MindscoreAssembly, SectionHeader } from "@/components/landing/marketing-motion";
import { SmokeBackground } from "@/components/landing/smoke-background";

export default function HomePage() {
  return (
    <div className="marketing-page min-h-screen overflow-x-clip bg-[#0b1120] text-white">
      <a href="#main" className="sr-only bg-[#14b8a6] px-4 py-2 font-semibold text-[#0b1120] focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50">Skip to content</a>
      <LandingNav />
      <main id="main">
        <section id="dashboard" className="marketing-hero relative flex min-h-[calc(100svh-72px)] flex-col justify-center overflow-hidden px-6 py-16 sm:px-10 sm:py-20 lg:px-12 lg:py-24">
          <div className="relative mx-auto grid w-full max-w-[1500px] grid-cols-[minmax(0,1fr)] items-center gap-14 lg:grid-cols-[0.94fr_1.06fr] lg:gap-16">
            <div className="marketing-hero-copy relative z-10 min-w-0 max-w-[720px]">
              <h1 className="font-display max-w-[720px] text-balance text-[clamp(2.6rem,11vw,3.7rem)] font-semibold leading-[0.96] tracking-[-0.06em] sm:text-[clamp(3.9rem,5.7vw,6rem)]">Journal for <span className="marketing-hero-word italic">extraordinary</span> traders</h1>
              <p className="mt-8 max-w-[500px] text-lg leading-[1.65] text-[#b8ccd0] sm:text-xl">A journal shows what happened. TradingMC helps you shape what happens next: write the plan, keep the commitments and review the decisions behind every session.</p>
              <div className="mt-11 flex flex-wrap items-center gap-4">
                <Link href="/signup" className="marketing-cta group inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#14b8a6] px-9 py-4 text-base font-semibold text-[#081721] hover:bg-[#70d9cf]">
                  Start building your process
                  <span aria-hidden="true" className="transition-transform duration-200 ease-out group-hover:translate-x-0.5">&#8594;</span>
                </Link>
                <a href="#the-approach" className="marketing-cta inline-flex min-h-14 items-center justify-center rounded-2xl border border-[#5a7f87] px-8 py-4 text-base font-medium text-[#d9e8e9] hover:border-[#a9ddd8] hover:bg-white/5 hover:text-white">See how it works</a>
              </div>
            </div>
            <div className="relative z-10 min-w-0"><DashboardScreenshot /></div>
          </div>
        </section>

        <div className="marketing-dark-flow marketing-dark-flow--smoke relative text-white">
          {/* The smoke sits behind every section here: viewport-high and sticky, so it is always on screen without painting the whole run. */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="sticky top-0 h-svh">
              <SmokeBackground className="absolute inset-0" />
              <div className="absolute inset-0 bg-[#0b1120]/10" />
            </div>
          </div>
          <section id="the-approach" className="marketing-section marketing-section--blue-glow px-6 pb-20 pt-16 sm:px-10 md:pb-28 md:pt-24 lg:px-12">
            <div className="mx-auto max-w-[1260px]">
              <SectionHeader label="My Edge" title="Make your edge something you can repeat." tone="dark" className="mb-14 lg:mb-18">
                Bring your habits, goals, trading rules and confluences into one clear process.
              </SectionHeader>
              <ProcessCanvas />
            </div>
          </section>

          <section id="mindscore" className="marketing-section marketing-section--blue-glow px-6 py-24 sm:px-10 md:py-32 lg:px-12 lg:py-40">
            <div className="mx-auto max-w-[1260px]">
              <SectionHeader label="MC Mindscore" title="Your effort, made visible." tone="dark" className="mb-14 lg:mb-20">
                MC Mindscore turns the work you log on and off the charts into one explainable view.
              </SectionHeader>
              <MindscoreAssembly />
            </div>
          </section>

          <section id="trade-therapist" className="marketing-section marketing-section--blue-glow px-6 py-24 sm:px-10 md:py-32 lg:px-12 lg:py-40">
            <div className="mx-auto max-w-[1260px]">
              <SectionHeader label="MC Trade Therapist" title="Practice before the market. Learn after it." tone="dark" className="mb-14 lg:mb-18">
                Start with a pre-market exercise shaped by recent sessions. Review your decisions afterward and carry the lesson forward.
              </SectionHeader>
              <TherapistVisual />
            </div>
          </section>

          <section id="review" className="marketing-section marketing-section--blue-glow px-6 py-24 sm:px-10 md:py-32 lg:px-12 lg:py-40">
            <div className="mx-auto grid max-w-[1260px] gap-12 lg:grid-cols-[0.38fr_0.62fr] lg:gap-20">
              <div className="marketing-sticky">
                <SectionHeader label="Best trade of the day" title="A review should change what you do." tone="dark" align="stack">
                  Compare the trade you took with the better opportunity. See the decision that made the difference.
                </SectionHeader>
              </div>
              <ReviewCanvas />
            </div>
          </section>

          <section id="market-context" className="marketing-section marketing-section--blue-glow px-6 py-24 sm:px-10 md:py-32 lg:px-12 lg:py-40">
            <div className="mx-auto max-w-[1260px]">
              <SectionHeader label="Global Markets" title="Your process meets the market you actually trade." tone="dark" className="mb-14 lg:mb-18">
                See the events and market signals that matter before you trade. Keep your plan in view.
              </SectionHeader>
              <MarketContextVisual />
            </div>
          </section>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
