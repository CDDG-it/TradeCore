import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { LandingNav } from "@/components/landing/landing-nav";
import { ProductExplorer } from "@/components/landing/product-explorer";
import { LandingFooter } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0B1120] text-[#F8FAFC]">
      <a
        href="#features"
        className="sr-only rounded-lg bg-[#14B8A6] px-4 py-2 font-semibold text-[#0B1120] focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to content
      </a>

      <LandingNav />

      <main>
        <section className="relative isolate overflow-hidden border-b border-white/[0.06]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_65%_at_78%_44%,rgba(20,184,166,0.08),transparent_70%)]"
          />
          <div className="relative mx-auto grid min-h-[calc(100dvh-77px)] max-w-[1400px] items-center gap-10 px-6 py-12 md:px-10 md:py-16 lg:grid-cols-2 lg:gap-12 lg:px-16">
            <div className="max-w-[610px]">
              <p className="mb-6 font-body text-sm font-medium text-[#14B8A6]">
                Where self-improvement meets trading
              </p>
              <h1 className="font-heading text-[clamp(2.8rem,4.6vw,4.8rem)] font-black leading-[1.04] tracking-[-0.045em] text-balance">
                Trade with a plan. <span className="block text-[#14B8A6]">Improve with proof.</span>
              </h1>
              <p className="mt-7 max-w-[48ch] font-body text-[1.05rem] leading-[1.65] text-[#A9B7C9] md:text-lg">
                Journal every trade, measure your process, and find the patterns behind your decisions.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-5">
                <Link
                  href="/dashboard"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#14B8A6] px-6 py-3 font-heading text-sm font-extrabold text-[#0B1120] transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-[#20CCB8] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8FAFC] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1120] motion-reduce:transform-none"
                >
                  Open dashboard
                  <ArrowUpRight aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
                </Link>
                <a
                  href="#features"
                  className="inline-flex min-h-12 items-center gap-2 font-heading text-sm font-bold text-[#DCE6EF] transition-colors duration-200 hover:text-[#14B8A6] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]"
                >
                  See the platform
                  <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
                </a>
              </div>
            </div>

            <div className="relative min-w-0">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] border border-white/10 bg-[#111D2F] shadow-[0_28px_80px_rgba(4,10,22,0.42)] sm:aspect-[3/2] lg:aspect-[4/5] xl:aspect-[5/4]">
                <Image
                  src="/landing-journal.png"
                  alt="Open trading journal and pen on a dark desk"
                  fill
                  priority
                  sizes="(max-width: 1023px) 100vw, 50vw"
                  className="object-cover object-center"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B1120]/45 via-transparent to-transparent"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/[0.06] bg-[#0E1727] px-6 py-20 md:px-10 md:py-28 lg:px-16">
          <div className="mx-auto grid max-w-[1400px] items-center gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
            <div className="max-w-md">
              <h2 className="font-heading text-[clamp(2.1rem,3.6vw,3.7rem)] font-black leading-[1.08] tracking-tight text-balance">
                See the work that shapes your results.
              </h2>
              <p className="mt-6 font-body text-base leading-relaxed text-[#A9B7C9]">
                Your journal keeps trades, execution and reflection together, so the next session starts with more than a P&amp;L number.
              </p>
            </div>
            <figure className="min-w-0">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] border border-white/10 bg-[#131B2E] shadow-[0_24px_64px_rgba(4,10,22,0.28)] sm:aspect-[16/9]">
                <Image
                  src="/screenshots/journal.png"
                  alt="TradingMC journal showing a week of logged trades and a weekly review"
                  fill
                  sizes="(max-width: 1023px) 100vw, 60vw"
                  className="object-cover object-left-top"
                />
              </div>
              <figcaption className="mt-3 font-body text-xs text-[#7F91A8]">
                Illustrative journal view
              </figcaption>
            </figure>
          </div>
        </section>

        <ProductExplorer />

        <section className="border-t border-white/[0.06] px-6 py-20 md:px-10 md:py-28 lg:px-16">
          <div className="mx-auto flex max-w-[1400px] flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <h2 className="font-heading text-[clamp(2.1rem,4vw,4rem)] font-black leading-[1.08] tracking-tight text-balance">
                Give every session a reason to improve.
              </h2>
              <p className="mt-5 max-w-[48ch] font-body text-base leading-relaxed text-[#A9B7C9]">
                Put your trades, rules and reviews in one place. See what changes when you follow the process.
              </p>
            </div>
            <Link
              href="/signup"
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#14B8A6] px-6 py-3 font-heading text-sm font-bold text-[#14B8A6] transition-[background-color,color,transform] duration-200 hover:-translate-y-0.5 hover:bg-[#14B8A6] hover:text-[#0B1120] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8FAFC] motion-reduce:transform-none"
            >
              Make account
              <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
