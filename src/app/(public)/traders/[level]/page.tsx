import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/footer";
import { MarketingReveal } from "@/components/landing/marketing-motion";
import { TRADER_LEVELS } from "@/lib/landing/nav";
import { TRADER_LEVEL_BY_SLUG, TRADER_LEVEL_PAGES } from "@/lib/landing/traders";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

export function generateStaticParams() {
  return TRADER_LEVEL_PAGES.map((level) => ({ level: level.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ level: string }> }): Promise<Metadata> {
  const { level } = await params;
  const page = TRADER_LEVEL_BY_SLUG[level];
  if (!page) return {};
  return { title: `For ${page.label.toLowerCase()}`, description: page.headline };
}

export default async function TraderLevelPage({ params }: { params: Promise<{ level: string }> }) {
  const { level } = await params;
  const page = TRADER_LEVEL_BY_SLUG[level];
  if (!page) notFound();
  const others = TRADER_LEVELS.filter((item) => item.slug !== page.slug);

  return (
    <div className={`${inter.variable} marketing-page min-h-screen overflow-x-clip bg-[#0b1120] text-white`}>
      <LandingNav />
      <main id="main">
        <section className="marketing-hero relative overflow-hidden px-6 pb-20 pt-20 sm:px-10 sm:pt-28 lg:px-12 lg:pb-28">
          <div aria-hidden="true" className="marketing-grid pointer-events-none absolute inset-0 opacity-35" />
          <div className="relative mx-auto grid max-w-[1260px] gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-20">
            <MarketingReveal>
              <p className="marketing-eyebrow" style={{ color: "#7be0d5" }}>For traders<span className="text-white">{page.label}</span></p>
              <h1 className="font-display mt-6 max-w-[820px] text-balance text-[clamp(2.6rem,9vw,3.6rem)] font-semibold leading-[0.98] tracking-[-0.06em] sm:text-[clamp(3.4rem,5.6vw,6rem)]">{page.headline}</h1>
              <p className="mt-8 max-w-[600px] text-base leading-[1.75] text-[#b8ccd0] sm:text-lg">{page.standfirst}</p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link href="/signup" className="marketing-cta inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#14b8a6] px-7 py-3 text-sm font-semibold text-[#081721] hover:bg-[#70d9cf]">Start building your process</Link>
                <Link href="/pricing" className="marketing-cta inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#5a7f87] px-6 py-3 text-sm font-medium text-[#d9e8e9] hover:border-[#a9ddd8] hover:bg-white/5 hover:text-white">Pricing</Link>
              </div>
            </MarketingReveal>
            <MarketingReveal delay={0.15} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-7 sm:p-8">
              <p className="text-xs font-semibold tracking-[0.14em] text-[#8aa5ab]">WHAT THIS STAGE NEEDS</p>
              <ul className="mt-5 space-y-4">
                {page.needs.map((need) => (
                  <li key={need} className="border-l border-[#14b8a6]/50 pl-4 text-sm leading-relaxed text-[#d6e4e6] sm:text-base">{need}</li>
                ))}
              </ul>
            </MarketingReveal>
          </div>
        </section>

        <div aria-hidden="true" className="marketing-gradient-bridge marketing-gradient-bridge--light" />
        <div className="marketing-light-flow text-[#0b1120]">
          <section className="marketing-section marketing-section--mist px-6 py-20 sm:px-10 md:py-28 lg:px-12 lg:py-36">
            <div className="mx-auto max-w-[1260px]">
              <MarketingReveal className="mb-12 max-w-3xl"><p className="marketing-eyebrow text-[#0d817c]">What you get</p><h2 className="font-display mt-5 text-balance text-[clamp(2.2rem,5vw,4.4rem)] font-semibold leading-[1.02] tracking-[-.055em]">Four products, in the order they matter here.</h2><p className="mt-5 max-w-2xl text-base leading-relaxed text-[#4d6871]">Every product is the same TradingMC. What changes by stage is what you lean on first.</p></MarketingReveal>
              <div className="grid grid-flow-dense gap-5 lg:grid-cols-2 lg:gap-6">
                {page.products.map((product, index) => {
                  return (
                    <MarketingReveal key={product.name} delay={index * 0.08} className="flex flex-col rounded-[28px] border border-[#c2dcda] bg-white/70 p-7 shadow-[0_24px_60px_rgba(27,88,92,.08)] sm:p-9">
                      <div className="flex items-center gap-4">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[#14b8a6] shadow-[0_0_0_6px_rgba(20,184,166,.12)]" aria-hidden="true" />
                        <p className="font-display text-xl font-semibold tracking-[-0.035em] text-[#102b37] sm:text-2xl">{product.name}</p>
                      </div>
                      <p className="mt-5 text-base leading-[1.65] text-[#4d6871]">{product.body}</p>
                      <ul className="mt-6 space-y-3 border-t border-[#c2dcda] pt-6">
                        {product.points.map((point) => (
                          <li key={point} className="flex gap-3 text-sm leading-relaxed text-[#2f4b53]"><span aria-hidden="true" className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#14b8a6]" />{point}</li>
                        ))}
                      </ul>
                      <Link href={product.href} className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#167c79] hover:text-[#0d817c]">See it on the homepage<span aria-hidden="true">→</span></Link>
                    </MarketingReveal>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="marketing-section marketing-section--white px-6 py-20 sm:px-10 md:py-28 lg:px-12">
            <div className="mx-auto max-w-[1260px]">
              <MarketingReveal className="mb-10"><p className="marketing-eyebrow text-[#0d817c]">Other stages</p><h2 className="font-display mt-4 text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-none tracking-[-.05em]">Not where you are?</h2></MarketingReveal>
              <ul className="grid gap-4 sm:grid-cols-3">
                {others.map((item, index) => (
                  <li key={item.slug}>
                    <MarketingReveal delay={index * 0.08} className="h-full">
                      <Link href={item.href} className="marketing-cta flex h-full flex-col rounded-[24px] border border-[#c2dcda] bg-white/60 p-6 hover:border-[#14b8a6]/60">
                        <span className="font-display text-lg font-semibold tracking-[-0.03em] text-[#102b37]">{item.label}</span>
                        <span className="mt-2 text-sm leading-relaxed text-[#4d6871]">{item.body}</span>
                      </Link>
                    </MarketingReveal>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
        <div aria-hidden="true" className="marketing-gradient-bridge marketing-gradient-bridge--dark" />

        <section className="relative overflow-hidden bg-[#0b1120] px-6 py-28 sm:px-10 md:py-40 lg:px-12">
          <div aria-hidden="true" className="marketing-grid pointer-events-none absolute inset-0 opacity-20" />
          <div className="relative mx-auto max-w-[1260px]">
            <MarketingReveal>
              <h2 className="font-display max-w-[980px] text-balance text-[clamp(2.4rem,8vw,3.4rem)] font-semibold leading-[1] tracking-[-0.06em] sm:text-[clamp(3.2rem,5.6vw,6.4rem)]">{page.close}</h2>
            </MarketingReveal>
            <MarketingReveal delay={0.15} distance={16} className="mt-12 flex flex-wrap items-center gap-6">
              <Link href="/signup" className="marketing-cta inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#14b8a6] px-7 py-3 text-sm font-semibold text-[#081721] hover:bg-[#70d9cf]">Create your account</Link>
              <Link href="/" className="marketing-cta inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#5a7f87] px-6 py-3 text-sm font-medium text-[#d9e8e9] hover:border-[#a9ddd8] hover:bg-white/5 hover:text-white">Back to the homepage</Link>
            </MarketingReveal>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
