import Link from "next/link";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/footer";
import { LaptopDashboard } from "@/components/landing/dashboard-sample";
import { MarketContextVisual, MindscoreVisual, ProcessStack, TherapistVisual, TradeComparison } from "@/components/landing/marketing-visuals";

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return <p className={`mb-6 border-l-2 pl-4 text-xs font-semibold uppercase tracking-[0.14em] ${light ? "border-[#0d8d82] text-[#41656e]" : "border-[#14b8a6] text-[#87d8ce]"}`}>{children}</p>;
}

export default function HomePage() {
  return (
    <div className="marketing-page min-h-screen overflow-x-clip bg-[#0b1120] text-white">
      <a href="#main" className="sr-only bg-[#14b8a6] px-4 py-2 font-semibold text-[#0b1120] focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50">Skip to content</a>
      <LandingNav />
      <main id="main">
        <section className="marketing-hero relative overflow-hidden px-6 pb-24 pt-20 sm:px-10 sm:pt-28 lg:px-12 lg:pb-32 lg:pt-32">
          <div aria-hidden="true" className="marketing-grid pointer-events-none absolute inset-0 opacity-35" />
          <div className="relative mx-auto grid max-w-[1380px] grid-cols-[minmax(0,1fr)] items-center gap-14 lg:grid-cols-[0.86fr_1.14fr] lg:gap-8">
            <div className="relative z-10 min-w-0 max-w-[610px]">
              <Eyebrow>For the work behind the trade</Eyebrow>
              <h1 className="font-display max-w-[720px] text-balance text-[clamp(3.6rem,6.1vw,7.2rem)] font-semibold leading-[0.98] tracking-[-0.06em]">Your trades tell a story. <span className="text-[#6ad5c9]">Build a better one.</span></h1>
              <p className="mt-8 max-w-[520px] text-base leading-[1.75] text-[#b8ccd0] sm:text-lg">A journal can show what happened. TradingMC helps you write a plan, keep commitments and review the decisions that shape the next session.</p>
              <div className="mt-10 flex flex-wrap items-center gap-6">
                <Link href="/signup" className="inline-flex min-h-12 items-center justify-center bg-[#14b8a6] px-7 py-3 text-sm font-semibold text-[#081721] transition-colors hover:bg-[#70d9cf]">Start building your process</Link>
                <a href="#the-approach" className="border-b border-[#82b3b6] pb-1 text-sm font-medium text-[#d9e8e9] transition-colors hover:border-white hover:text-white">See how it works</a>
              </div>
              <p className="mt-10 border-l border-[#3b777b] pl-4 text-xs leading-relaxed text-[#9ab5bc]">Your private trading desk, from preparation to reflection.</p>
            </div>
            <div className="relative z-10 min-w-0 lg:translate-x-5"><LaptopDashboard /></div>
          </div>
          <div className="relative mx-auto mt-24 max-w-[1380px] border-t border-white/10 pt-5 text-xs text-[#829ca5]">The dashboard shown above uses the app&apos;s own components and local illustrative data.</div>
        </section>

        <section id="the-problem" className="bg-[#f7f9f9] px-6 py-28 text-[#0b1120] sm:px-10 md:py-40 lg:px-12">
          <div className="mx-auto max-w-[1260px]">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
              <Eyebrow light>The gap after logging</Eyebrow>
              <div><h2 className="font-display max-w-[840px] text-balance text-[clamp(3rem,5vw,6rem)] font-semibold leading-[1.02] tracking-[-0.055em]">A profitable trade can still be a poor decision.</h2><p className="mt-8 max-w-[630px] text-lg leading-[1.7] text-[#4f6670]">The result rarely tells you whether you followed your rules. That difference matters when you sit down to trade again.</p></div>
            </div>
            <div className="mt-20"><TradeComparison /></div>
          </div>
        </section>

        <section id="the-approach" className="relative overflow-hidden bg-[#0c1a2a] px-6 py-28 sm:px-10 md:py-40 lg:px-12">
          <div aria-hidden="true" className="absolute right-[-20%] top-[-30%] h-[700px] w-[700px] rounded-full bg-[#14b8a6]/[0.08] blur-[120px]" />
          <div className="relative mx-auto grid max-w-[1260px] items-center gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
            <div><Eyebrow>Make the work specific</Eyebrow><h2 className="font-display max-w-[620px] text-balance text-[clamp(3rem,5vw,5.7rem)] font-semibold leading-[1.02] tracking-[-0.055em]">Give the next session a direction.</h2><p className="mt-8 max-w-[520px] text-lg leading-[1.7] text-[#b1c5cb]">Write a trading plan that fits your edge. Turn the mistakes you recognise into commitments you can check. Build habits outside market hours and set goals against the numbers you already track.</p><p className="mt-8 max-w-[520px] border-t border-white/15 pt-6 text-sm leading-relaxed text-[#81d1c8]">The process is yours to adjust as you learn.</p></div>
            <ProcessStack />
          </div>
        </section>

        <section id="mindscore" className="bg-[#eaf3f3] px-6 py-28 text-[#0b1120] sm:px-10 md:py-40 lg:px-12">
          <div className="mx-auto grid max-w-[1260px] items-center gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
            <div><Eyebrow light>MC Mindscore</Eyebrow><h2 className="font-display max-w-[640px] text-balance text-[clamp(3rem,5vw,5.7rem)] font-semibold leading-[1.02] tracking-[-0.055em]">Your effort, made visible.</h2><p className="mt-8 max-w-[540px] text-lg leading-[1.7] text-[#4d6871]">The MC Mindscore brings together rule adherence, execution, habits, reflection work and goal progress. It reflects what you do on and off the charts, using information you actually log.</p><p className="mt-6 max-w-[520px] text-sm leading-relaxed text-[#526d75]">Every part has a stated weight. Active goals are measured against their own timeline; when a part has no measurable data, its weight is shared across the others.</p></div>
            <MindscoreVisual />
          </div>
        </section>

        <section id="trade-therapist" className="bg-[#0b1120] px-6 py-28 sm:px-10 md:py-40 lg:px-12">
          <div className="mx-auto max-w-[1260px]">
            <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20"><div><Eyebrow>MC Trade Therapist</Eyebrow><h2 className="font-display max-w-[660px] text-balance text-[clamp(3rem,5vw,5.7rem)] font-semibold leading-[1.02] tracking-[-0.055em]">Reflection with a place in your week.</h2></div><p className="max-w-[560px] self-end text-lg leading-[1.7] text-[#b1c5cb]">Prepare before the market, examine the session afterward and write a weekly review while the decisions are still clear. A monthly rollup brings those weekly reviews together, so you can see what changed and what kept returning.</p></div>
            <div className="mt-16 pb-8"><TherapistVisual /></div>
          </div>
        </section>

        <section className="bg-white px-6 py-28 text-[#0b1120] sm:px-10 md:py-40 lg:px-12">
          <div className="mx-auto grid max-w-[1260px] items-center gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
            <div><Eyebrow light>The next decision</Eyebrow><h2 className="font-display max-w-[600px] text-balance text-[clamp(3rem,5vw,5.7rem)] font-semibold leading-[1.02] tracking-[-0.055em]">A review should change what you do.</h2><p className="mt-8 max-w-[530px] text-lg leading-[1.7] text-[#536b74]">When a pattern appears, make it concrete. Commit to a response, check whether you followed it and carry the lesson into the next plan.</p></div>
            <div className="border border-[#bed5d6] bg-[#f4faf9] p-8 shadow-[18px_18px_0_#d7eae8] sm:p-10"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#497781]">From a weekly reflection</p><p className="mt-8 font-display text-2xl font-medium leading-snug tracking-[-0.03em] sm:text-3xl">“I entered early after the first loss because I wanted the day back.”</p><div className="mt-10 border-t border-[#d2e1e3] pt-6"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#497781]">A commitment for the next session</p><p className="mt-3 text-lg font-semibold leading-relaxed text-[#0e635e]">If I take a loss, I wait for my level and confirmation before entering again.</p></div></div>
          </div>
        </section>

        <section className="bg-[#f1f6f6] px-6 py-24 text-[#0b1120] sm:px-10 md:py-32 lg:px-12">
          <div className="mx-auto grid max-w-[1260px] items-center gap-14 lg:grid-cols-[1fr_0.8fr] lg:gap-24"><div><Eyebrow light>Market context</Eyebrow><h2 className="font-display max-w-[650px] text-balance text-[clamp(2.7rem,4.5vw,5rem)] font-semibold leading-[1.04] tracking-[-0.055em]">Your process meets the market you actually trade.</h2></div><MarketContextVisual /></div>
        </section>

        <section className="relative overflow-hidden bg-[#0b1120] px-6 py-32 sm:px-10 md:py-44 lg:px-12"><div aria-hidden="true" className="marketing-grid pointer-events-none absolute inset-0 opacity-20" /><div className="relative mx-auto max-w-[1260px]"><Eyebrow>Make the next trade count</Eyebrow><h2 className="font-display max-w-[1050px] text-balance text-[clamp(3.8rem,7vw,8rem)] font-semibold leading-[0.98] tracking-[-0.06em]">An ordinary journal won&apos;t build an <span className="text-[#65d4c8]">extraordinary trader.</span></h2><div className="mt-12 flex flex-wrap items-center gap-8"><Link href="/signup" className="inline-flex min-h-12 items-center justify-center bg-[#14b8a6] px-7 py-3 text-sm font-semibold text-[#081721] transition-colors hover:bg-[#70d9cf]">Create your account</Link><p className="max-w-sm text-sm leading-relaxed text-[#a9c2c7]">Start with the trades you already make. Build a process you can keep refining.</p></div></div></section>
      </main>
      <LandingFooter />
    </div>
  );
}
