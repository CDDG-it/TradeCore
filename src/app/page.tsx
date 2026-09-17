import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/footer";
import { InteractiveShowcase } from "@/components/landing/interactive-showcase";

const steps = [
  ["01", "Prepare", "Write your market read and define what a valid trade looks like."],
  ["02", "Execute", "Record the setup, outcome and quality of each decision."],
  ["03", "Review", "Connect your routine and execution to the patterns in your results."],
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0B1120] text-[#F8FAFC]">
      <a href="#features" className="sr-only rounded-lg bg-[#14B8A6] px-4 py-2 font-semibold text-[#0B1120] focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50">Skip to content</a>
      <LandingNav />
      <main>
        <section id="features" className="relative isolate overflow-hidden px-5 pb-20 pt-10 sm:px-8 md:pb-28 md:pt-14 lg:px-12">
          <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[720px] w-[1000px] max-w-none -translate-x-1/2 rounded-full bg-[#14B8A6]/[0.055] blur-[120px]" />
          <div className="mx-auto max-w-[1360px]">
            <div className="mb-9 grid items-end gap-8 lg:mb-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
              <div>
                <p className="mb-5 flex items-center gap-3 font-body text-xs font-bold uppercase tracking-[0.22em] text-[#14B8A6]"><span className="h-px w-7 bg-[#14B8A6]" aria-hidden="true" />Where self-improvement meets trading</p>
                <h1 className="max-w-[850px] font-heading text-[clamp(3.1rem,6.8vw,7rem)] font-black leading-[0.98] tracking-[-0.055em] text-balance">Trade the plan.<br /><span className="text-[#14B8A6]">Study the result.</span></h1>
              </div>
              <div className="max-w-[430px] lg:pb-2">
                <p className="font-body text-base leading-[1.7] text-[#AFBCCD] sm:text-lg">Your preparation, trades, habits and performance in one workspace. See how every decision shapes the next session.</p>
                <div className="mt-7 flex flex-wrap items-center gap-5">
                  <Link href="/signup" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#14B8A6] px-5 py-3 font-heading text-sm font-extrabold text-[#0B1120] transition-colors hover:bg-[#2ACDBA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1120]">Make account <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link>
                  <a href="#products" className="inline-flex min-h-12 items-center gap-2 font-heading text-sm font-bold text-[#E2EAF2] transition-colors hover:text-[#14B8A6] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]">Explore the platform <ArrowRight aria-hidden="true" className="h-4 w-4" /></a>
                </div>
              </div>
            </div>
            <InteractiveShowcase />
          </div>
        </section>

        <section className="border-y border-white/[0.07] bg-[#10192A] px-5 py-20 sm:px-8 md:py-28 lg:px-12">
          <div className="mx-auto grid max-w-[1360px] gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24">
            <div>
              <p className="mb-5 font-body text-xs font-bold uppercase tracking-[0.22em] text-[#14B8A6]">The daily loop</p>
              <h2 className="max-w-[580px] font-heading text-[clamp(2.4rem,4.5vw,4.7rem)] font-black leading-[1.04] tracking-[-0.045em] text-balance">A better process is built one session at a time.</h2>
            </div>
            <div className="border-t border-white/10">
              {steps.map(([number, title, body]) => (
                <div key={number} className="grid grid-cols-[48px_1fr] gap-4 border-b border-white/10 py-7 sm:grid-cols-[56px_150px_1fr] sm:items-start sm:gap-5">
                  <span className="font-heading text-sm font-bold text-[#14B8A6]">{number}</span>
                  <h3 className="font-heading text-xl font-extrabold">{title}</h3>
                  <p className="col-start-2 font-body text-sm leading-relaxed text-[#9DADC1] sm:col-start-3 sm:text-base">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 md:py-28 lg:px-12">
          <div className="mx-auto flex max-w-[1360px] flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="max-w-3xl font-heading text-[clamp(2.6rem,5vw,5.2rem)] font-black leading-[1.04] tracking-[-0.045em] text-balance">Make the next trade a more informed one.</h2>
            <Link href="/signup" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#14B8A6] px-6 py-3 font-heading text-sm font-extrabold text-[#0B1120] transition-colors hover:bg-[#2ACDBA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1120]">Get started <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
