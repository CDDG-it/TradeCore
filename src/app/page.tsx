import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/footer";
import { DecisionBridge, HeroProcessVisual, MomentsGrid } from "@/components/landing/reference-visuals";
import { GuidelineBuilder, MarketLens, PatternTrace, ReflectionExercise, StoryReveal, TradeLens } from "@/components/landing/story-visuals";

const eyebrow = "font-body text-[11px] font-bold uppercase tracking-[0.2em] text-[#70D8CC]";
const heading = "font-heading text-[clamp(2.5rem,4.9vw,5.2rem)] font-black leading-[1.04] tracking-[-0.05em] text-white";
const body = "font-body text-base leading-[1.7] text-[#AFC0CB] sm:text-lg";

const problems = [
  { number: "01", title: "The result bias", body: "A green trade can hide a broken rule. A red one can hide a good decision." },
  { number: "02", title: "The forgotten moment", body: "The reason for an entry fades faster than the number in your account." },
  { number: "03", title: "The repeated slip", body: "The same small compromise returns when nobody asks what triggered it." },
  { number: "04", title: "The missing context", body: "A plan changes when you ignore the conditions surrounding the trade." },
] as const;

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#0B1120] text-[#F8FAFC]">
      <div aria-hidden="true" className="landing-aurora pointer-events-none absolute inset-x-0 top-0 h-[980px] lg:h-[780px]" />
      <a href="#main" className="sr-only rounded-lg bg-[#14B8A6] px-4 py-2 font-semibold text-[#0B1120] focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50">Skip to content</a>
      <LandingNav />
      <main id="main" className="relative">
        <section className="px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:px-12 lg:pb-24 lg:pt-28">
          <div className="mx-auto grid max-w-[1280px] items-center gap-14 lg:min-h-[530px] lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
            <StoryReveal className="relative z-10 max-w-[610px]">
              <p className="inline-flex rounded-full border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-3 py-1.5 font-body text-[10px] font-bold uppercase tracking-[0.17em] text-[#91E1D8]">The work behind the trade</p>
              <h1 className="mt-7 font-heading text-[clamp(3.2rem,5.6vw,6.2rem)] font-black leading-[1.01] tracking-[-0.06em] text-balance text-white">Build the trader <span className="text-[#14B8A6]">behind the trade.</span></h1>
              <p className="mt-7 max-w-lg font-body text-base leading-[1.75] text-[#CBD8DD] sm:text-lg">An ordinary journal records the result. TradingMC helps you examine the decision and work on what comes next.</p>
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <Link href="/signup" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#14B8A6] px-6 py-3 font-heading text-sm font-extrabold text-[#06161C] transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-[#6DDED2] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Build your process <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link>
                <a href="#the-problem" className="inline-flex min-h-12 items-center gap-2 font-heading text-sm font-bold text-white transition-colors hover:text-[#6DDED2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]">See how it works <ArrowRight aria-hidden="true" className="h-4 w-4" /></a>
              </div>
              <p className="mt-7 font-body text-xs text-[#91AAA9]">A private place for your trades, patterns and next-session work.</p>
            </StoryReveal>
            <StoryReveal className="relative z-10"><HeroProcessVisual /></StoryReveal>
          </div>
        </section>

        <section id="the-problem" className="border-y border-white/[0.06] bg-[#080E17] px-5 py-24 sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto max-w-[1280px]">
            <StoryReveal className="mx-auto max-w-3xl text-center">
              <p className={eyebrow}>The problem</p>
              <h2 className="mt-5 font-heading text-[clamp(2.5rem,4.6vw,4.8rem)] font-black leading-[1.08] tracking-[-0.05em] text-white">You logged the trade.<br /><span className="text-[#AFC6C7]">Did you learn from it?</span></h2>
              <p className={`${body} mx-auto mt-5 max-w-xl`}>Most journals keep a record. The difficult part is seeing what your choices say about the next session.</p>
            </StoryReveal>
            <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {problems.map((item) => (
                <StoryReveal key={item.number}>
                  <article className="h-full rounded-xl border border-white/10 bg-[#121B25] p-6 transition-colors hover:border-[#14B8A6]/35">
                    <span className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 bg-[#1C2932] font-heading text-xs font-extrabold text-[#88D6CD]">{item.number}</span>
                    <h3 className="mt-7 font-heading text-lg font-extrabold text-white">{item.title}</h3>
                    <p className="mt-3 font-body text-sm leading-[1.65] text-[#A9BBC8]">{item.body}</p>
                  </article>
                </StoryReveal>
              ))}
            </div>
          </div>
        </section>

        <section id="the-method" className="bg-[#18232B] px-5 py-24 sm:px-8 md:py-32 lg:px-12">
          <div className="mx-auto grid max-w-[1280px] items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
            <StoryReveal>
              <p className={eyebrow}>The shift</p>
              <h2 className={`${heading} mt-5 max-w-xl`}>Same trade.<br /><span className="text-[#14B8A6]">A different question.</span></h2>
              <p className={`${body} mt-6 max-w-lg`}>The record still matters. Its real value appears when you connect the outcome to execution, psychology and the plan you set beforehand.</p>
              <div className="mt-10 grid max-w-lg grid-cols-2 gap-6 border-t border-white/10 pt-7">
                <div><p className="font-heading text-3xl font-black text-[#6EDACD]">01</p><p className="mt-2 font-body text-sm text-[#BDCCD2]">See the decision behind the result.</p></div>
                <div><p className="font-heading text-3xl font-black text-[#6EDACD]">02</p><p className="mt-2 font-body text-sm text-[#BDCCD2]">Carry the lesson into the next session.</p></div>
              </div>
            </StoryReveal>
            <StoryReveal className="flex justify-center lg:justify-end"><DecisionBridge /></StoryReveal>
          </div>
        </section>

        <section id="the-moments" className="relative overflow-hidden bg-[#090F18] px-5 py-28 sm:px-8 md:py-36 lg:px-12">
          <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-0 h-80 w-[500px] rounded-full bg-[#14B8A6]/10 blur-[100px]" />
          <div className="relative mx-auto max-w-[1280px]">
            <StoryReveal className="mx-auto max-w-3xl text-center">
              <p className={eyebrow}>The process</p>
              <h2 className="mt-5 font-heading text-[clamp(2.5rem,4.6vw,4.8rem)] font-black leading-[1.08] tracking-[-0.05em] text-white">The work happens <span className="text-[#14B8A6]">between trades.</span></h2>
              <p className={`${body} mx-auto mt-5 max-w-xl`}>Explore the moments that shape a session. Each one can leave you with a better question.</p>
            </StoryReveal>
            <StoryReveal className="mt-14"><MomentsGrid /></StoryReveal>
          </div>
        </section>

        <section className="border-t border-white/[0.06] bg-[#0F1924] px-5 py-28 sm:px-8 md:py-36 lg:px-12">
          <div className="mx-auto max-w-[1280px]">
            <StoryReveal className="mb-10 max-w-3xl">
              <p className={eyebrow}>Look again</p>
              <h2 className={`${heading} mt-5`}>Profit can hide a problem.</h2>
              <p className={`${body} mt-5 max-w-xl`}>Choose two trades with the same outcome. The useful lesson changes completely.</p>
            </StoryReveal>
            <StoryReveal><TradeLens /></StoryReveal>
            <StoryReveal className="mb-10 mt-32 max-w-3xl">
              <p className={eyebrow}>Follow the pattern</p>
              <h2 className={`${heading} mt-5`}>Small deviations leave a trail.</h2>
              <p className={`${body} mt-5 max-w-xl`}>A week of decisions can reveal what a single trade cannot.</p>
            </StoryReveal>
            <StoryReveal><PatternTrace /></StoryReveal>
          </div>
        </section>

        <section className="border-t border-white/[0.06] bg-[#080E17] px-5 py-28 sm:px-8 md:py-36 lg:px-12">
          <div className="mx-auto max-w-[1280px]">
            <StoryReveal className="mb-10 max-w-3xl">
              <p className={eyebrow}>Practice the question</p>
              <h2 className={`${heading} mt-5`}>Review the moment,<br />not just the money.</h2>
              <p className={`${body} mt-5 max-w-xl`}>A short exercise can make the next action clearer than another page of numbers.</p>
            </StoryReveal>
            <StoryReveal><ReflectionExercise /></StoryReveal>
          </div>
        </section>

        <section className="border-t border-white/[0.06] bg-[#14212B] px-5 py-28 sm:px-8 md:py-36 lg:px-12">
          <div className="mx-auto max-w-[1280px]">
            <StoryReveal className="mb-10 max-w-3xl">
              <p className={eyebrow}>Make it yours</p>
              <h2 className={`${heading} mt-5`}>Turn the insight into a rule you can use.</h2>
              <p className={`${body} mt-5 max-w-xl`}>Specific guidelines make discipline easier to see and easier to revisit.</p>
            </StoryReveal>
            <StoryReveal><GuidelineBuilder /></StoryReveal>
            <StoryReveal className="mb-10 mt-32 max-w-3xl">
              <p className={eyebrow}>Read the room</p>
              <h2 className={`${heading} mt-5`}>The market has a say, too.</h2>
              <p className={`${body} mt-5 max-w-xl`}>Scheduled events can change the conditions your plan depends on. Explore one before it surprises you.</p>
            </StoryReveal>
            <StoryReveal><MarketLens /></StoryReveal>
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-white/10 bg-[#0A151D] px-5 py-32 sm:px-8 md:py-44 lg:px-12">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-48 h-[670px] w-[700px] rounded-full bg-[#14B8A6]/15 blur-[115px]" />
          <StoryReveal className="relative mx-auto max-w-[1280px]">
            <p className={eyebrow}>Your next chapter</p>
            <h2 className="mt-6 max-w-5xl font-heading text-[clamp(3.1rem,7vw,7.5rem)] font-black leading-[0.99] tracking-[-0.06em] text-white">An ordinary journal won’t build an <span className="text-[#14B8A6]">extraordinary trader.</span></h2>
            <p className={`${body} mt-8 max-w-xl`}>Start building a process you can return to, challenge and make your own.</p>
            <Link href="/signup" className="mt-9 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#14B8A6] px-6 py-3 font-heading text-sm font-extrabold text-[#06161C] transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-[#6DDED2] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Create your account <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
            <a href="#main" className="ml-5 mt-9 inline-flex min-h-12 items-center gap-2 font-heading text-sm font-bold text-[#B7C9D1] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]">Back to the beginning <ArrowDown aria-hidden="true" className="h-4 w-4 rotate-180" /></a>
          </StoryReveal>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
