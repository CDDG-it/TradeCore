import Link from "next/link";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/footer";
import { LaptopDashboard, MarketContextVisual, ProcessStack, TradeComparison } from "@/components/landing/marketing-visuals";

const problems = [
  { number: "01", title: "A result can mislead.", detail: "A green trade can contain the same mistake as a red one." },
  { number: "02", title: "The reason fades.", detail: "By the end of the week, the moment behind an entry is easy to rewrite." },
  { number: "03", title: "Patterns hide in plain sight.", detail: "The same compromise can keep returning, one trade at a time." },
  { number: "04", title: "The next session arrives.", detail: "A journal entry is only useful if it changes what you do next." },
] as const;

function SectionLabel({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return <p className={`mb-6 flex items-center gap-3 font-mono text-[11px] font-medium uppercase tracking-[0.16em] ${light ? "text-[#3d6871]" : "text-[#7dcac4]"}`}><span className={`h-px w-8 ${light ? "bg-[#3d6871]" : "bg-[#7dcac4]"}`} />{children}</p>;
}

export default function HomePage() {
  return (
    <div className="marketing-page min-h-screen overflow-x-clip bg-[#0b1120] text-white">
      <a href="#main" className="sr-only bg-[#14b8a6] px-4 py-2 font-semibold text-[#0b1120] focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50">Skip to content</a>
      <LandingNav />
      <main id="main">
        <section className="marketing-hero relative overflow-hidden px-6 pb-28 pt-20 sm:px-10 sm:pt-28 lg:px-12 lg:pb-36 lg:pt-36">
          <div aria-hidden="true" className="marketing-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative mx-auto grid max-w-[1380px] items-center gap-16 lg:grid-cols-[0.86fr_1.14fr] lg:gap-8">
            <div className="relative z-10 max-w-[620px]">
              <SectionLabel>Beyond the journal</SectionLabel>
              <h1 className="max-w-[700px] text-balance text-[clamp(3.6rem,6.1vw,7.6rem)] font-semibold leading-[0.98] tracking-[-0.075em]">The trade ends. <span className="text-[#6ad5c9]">The work begins.</span></h1>
              <p className="mt-8 max-w-[520px] text-base leading-[1.75] text-[#b5c9ce] sm:text-lg">An ordinary journal records the result. TradingMC helps you examine the decision, recognise the pattern and prepare for the next session.</p>
              <div className="mt-10 flex flex-wrap items-center gap-6">
                <Link href="/signup" className="inline-flex min-h-12 items-center justify-center rounded-[4px] bg-[#14b8a6] px-7 py-3 text-sm font-semibold text-[#081721] transition-colors hover:bg-[#70d9cf]">Build your process</Link>
                <a href="#the-problem" className="border-b border-[#82b3b6] pb-1 text-sm font-medium text-[#d9e8e9] transition-colors hover:border-white hover:text-white">See the difference</a>
              </div>
              <p className="mt-10 border-l border-[#3b777b] pl-4 text-[12px] leading-relaxed text-[#8ca9b1]">A private desk for the work behind every trade.</p>
            </div>
            <div className="relative z-10 lg:translate-x-7"><LaptopDashboard /></div>
          </div>
          <div className="relative mx-auto mt-24 flex max-w-[1380px] justify-between border-t border-white/10 pt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#78939b]"><span>TradingMC / Make the decision visible</span><span>Scroll to explore</span></div>
        </section>

        <section id="the-problem" className="bg-[#f7f9f9] px-6 py-28 text-[#0b1120] sm:px-10 md:py-40 lg:px-12">
          <div className="mx-auto max-w-[1260px]">
            <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
              <SectionLabel light>The problem</SectionLabel>
              <div><h2 className="max-w-[810px] text-balance text-[clamp(3rem,5vw,6rem)] font-semibold leading-[1.02] tracking-[-0.07em]">You can track every trade and still miss the point.</h2><p className="mt-8 max-w-[620px] text-lg leading-[1.7] text-[#4f6670]">The numbers tell you what happened. Discipline is built by understanding why it happened and what you will do when the same moment returns.</p></div>
            </div>
            <div className="mt-24 grid border-t border-[#bfd0d5] md:grid-cols-2">
              {problems.map((item) => <article key={item.number} className="grid grid-cols-[58px_1fr] gap-4 border-b border-[#bfd0d5] py-7 md:gap-8 md:px-8 md:first:pl-0 md:[&:nth-child(2n)]:border-l md:[&:nth-child(2n)]:border-[#bfd0d5]"><span className="font-mono text-sm text-[#0e8880]">{item.number}</span><div><h3 className="text-xl font-semibold tracking-[-0.04em] sm:text-2xl">{item.title}</h3><p className="mt-2 max-w-sm text-sm leading-[1.7] text-[#526a74]">{item.detail}</p></div></article>)}
            </div>
          </div>
        </section>

        <section id="the-method" className="relative overflow-hidden bg-[#0b1726] px-6 py-28 sm:px-10 md:py-36 lg:px-12">
          <div aria-hidden="true" className="absolute right-[-20%] top-[-20%] h-[700px] w-[700px] rounded-full bg-[#14b8a6]/[0.07] blur-[120px]" />
          <div className="relative mx-auto grid max-w-[1260px] items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <div><SectionLabel>A different way to review</SectionLabel><h2 className="max-w-[560px] text-balance text-[clamp(3rem,5vw,5.8rem)] font-semibold leading-[1.02] tracking-[-0.07em]">From what happened to what changes next.</h2><p className="mt-8 max-w-[520px] text-lg leading-[1.7] text-[#afc1ca]">Your trades are the starting point. TradingMC connects the record to your behaviour, reflections and personal rules so the next session has a clearer direction.</p><div className="mt-10 border-t border-white/15 pt-5 text-sm text-[#7ecbc4]">One connected process, built around your own trading.</div></div>
            <ProcessStack />
          </div>
        </section>

        <section className="bg-white px-6 py-28 text-[#0b1120] sm:px-10 md:py-40 lg:px-12">
          <div className="mx-auto max-w-[1260px]">
            <div className="mb-16 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20"><div><SectionLabel light>The same result</SectionLabel><h2 className="text-balance text-[clamp(3rem,5vw,5.8rem)] font-semibold leading-[1.02] tracking-[-0.07em]">Profit does not prove the process.</h2></div><p className="max-w-[540px] self-end text-lg leading-[1.7] text-[#536b74]">Two identical profits can call for opposite reviews. One may confirm a repeatable setup. The other may reveal a rule you bent and got away with.</p></div>
            <TradeComparison />
            <p className="mt-5 text-right font-mono text-[10px] uppercase tracking-[0.12em] text-[#6e848d]">Illustrative trade · no account data</p>
          </div>
        </section>

        <section id="the-moments" className="bg-[#eaf3f3] px-6 py-28 text-[#0b1120] sm:px-10 md:py-40 lg:px-12">
          <div className="mx-auto grid max-w-[1260px] gap-16 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-24">
            <div><SectionLabel light>Between sessions</SectionLabel><h2 className="max-w-[610px] text-balance text-[clamp(3rem,5vw,5.8rem)] font-semibold leading-[1.02] tracking-[-0.07em]">A useful review leaves you with a rule.</h2><p className="mt-8 max-w-[540px] text-lg leading-[1.7] text-[#4d6871]">The question is whether you can recognise the conditions behind a mistake and decide what to do when they return.</p></div>
            <div className="relative border border-[#bfd5d5] bg-[#f9fcfc] p-7 shadow-[18px_18px_0_#d2e5e4] sm:p-10"><p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#497781]">From a weekly reflection</p><div className="mt-10 border-l-2 border-[#14b8a6] pl-6"><p className="text-2xl font-medium leading-snug tracking-[-0.04em] sm:text-3xl">“I entered early after the first loss because I wanted the day back.”</p></div><div className="mt-10 border-t border-[#d2e1e3] pt-6"><p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#497781]">A guideline for the next session</p><p className="mt-3 text-lg font-semibold leading-relaxed text-[#0e635e]">After a loss, I wait for my level and confirmation before taking another trade.</p></div></div>
          </div>
        </section>

        <section className="bg-[#f9fbfb] px-6 py-28 text-[#0b1120] sm:px-10 md:py-40 lg:px-12">
          <div className="mx-auto grid max-w-[1260px] items-center gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24"><div><SectionLabel light>Context matters</SectionLabel><h2 className="max-w-[590px] text-balance text-[clamp(3rem,5vw,5.8rem)] font-semibold leading-[1.02] tracking-[-0.07em]">Bring the market into the plan.</h2><p className="mt-8 max-w-[520px] text-lg leading-[1.7] text-[#536b74]">The day around your trade matters too. Keep important events in view before the session asks you to react.</p></div><MarketContextVisual /></div>
        </section>

        <section className="relative overflow-hidden bg-[#0b1120] px-6 py-32 sm:px-10 md:py-44 lg:px-12"><div aria-hidden="true" className="marketing-grid pointer-events-none absolute inset-0 opacity-20" /><div className="relative mx-auto max-w-[1260px]"><SectionLabel>Make the next trade count</SectionLabel><h2 className="max-w-[1050px] text-balance text-[clamp(3.8rem,7vw,8rem)] font-semibold leading-[0.98] tracking-[-0.075em]">An ordinary journal won’t build an <span className="text-[#65d4c8]">extraordinary trader.</span></h2><div className="mt-12 flex flex-wrap items-center gap-8"><Link href="/signup" className="inline-flex min-h-12 items-center justify-center rounded-[4px] bg-[#14b8a6] px-7 py-3 text-sm font-semibold text-[#081721] transition-colors hover:bg-[#70d9cf]">Create your account</Link><p className="max-w-sm text-sm leading-relaxed text-[#9fb8be]">Start with the trades you already make. Build a process you can keep refining.</p></div></div></section>
      </main>
      <LandingFooter />
    </div>
  );
}
