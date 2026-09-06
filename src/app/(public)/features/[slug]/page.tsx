import { existsSync } from "fs";
import path from "path";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { FEATURES, FEATURE_BY_SLUG } from "@/lib/landing/features";
import { LandingFooter } from "@/components/landing/footer";

const NUNITO = "var(--font-nunito), system-ui, sans-serif";

export function generateStaticParams() {
  return FEATURES.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const feature = FEATURE_BY_SLUG[slug];
  // Bare page names: the root layout's title template appends the brand.
  if (!feature) return {};
  return {
    title: feature.name,
    description: feature.tagline,
  };
}

export default async function FeaturePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const feature = FEATURE_BY_SLUG[slug];
  if (!feature) notFound();

  // Index in the list, used for the prev/next footer navigation.
  const idx = FEATURES.findIndex((f) => f.slug === feature.slug);
  const next = FEATURES[(idx + 1) % FEATURES.length];

  // Only render the media block when a real screenshot file is actually present
  // in /public. Features without a capture (e.g. Trade Therapist, Option Flow)
  // stay text-only — no mockups, no broken images. Drop a PNG in and it appears.
  const hasShot = existsSync(
    path.join(process.cwd(), "public", feature.screenshot.replace(/^\//, "")),
  );

  return (
    <div style={{ background: "#0B1120", fontFamily: NUNITO }}>
      {/* Slim header */}
      <header
        className="sticky top-0 z-30 px-6 py-4"
        style={{
          background: "rgba(11,17,32,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link
            href="/"
            className="font-black tracking-tight text-base leading-none hover:opacity-80 transition-opacity"
          >
            <span style={{ color: "#F8FAFC" }}>Trading</span>
            <span style={{ background: "linear-gradient(90deg,#14B8A6,#06B6D4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>MC</span>
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            style={{
              background: "linear-gradient(135deg,#14B8A6 0%,#06B6D4 100%)",
              boxShadow: "0 2px 14px rgba(20,184,166,0.30), 0 1px 2px rgba(0,0,0,0.30)",
            }}
          >
            Make account
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pt-16 pb-10 sm:pt-24">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#CBD5E1]/50 transition-colors duration-200 hover:text-[#14B8A6]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All features
        </Link>

        <div className="mt-7 flex items-center gap-3">
          <span
            className="text-[0.625rem] font-bold uppercase tracking-[0.18em]"
            style={{ color: "#14B8A6" }}
          >
            {feature.section}
          </span>
          <span className="h-px w-6" style={{ background: "rgba(20,184,166,0.35)" }} />
        </div>

        <h1
          className="mt-4 font-black tracking-tight leading-[0.9]"
          style={{ fontSize: "clamp(2.6rem, 7vw, 5rem)", color: "#F8FAFC" }}
        >
          {feature.name}
        </h1>
        <p
          className="mt-5 max-w-2xl leading-relaxed"
          style={{ fontSize: "clamp(1.05rem, 2.2vw, 1.35rem)", color: "rgba(203,213,225,0.75)" }}
        >
          {feature.intro}
        </p>
      </section>

      {/* Screenshot — only when a real capture exists in /public/screenshots. */}
      {hasShot && (
        <section className="mx-auto max-w-5xl px-6">
          <div
            className="relative w-full overflow-hidden rounded-2xl"
            style={{
              aspectRatio: feature.aspect,
              boxShadow:
                "0 0 0 1.5px rgba(20,184,166,0.25), 0 0 34px rgba(6,182,212,0.10), 0 12px 50px rgba(0,0,0,0.45)",
            }}
          >
            <Image
              src={feature.screenshot}
              alt={`${feature.name} page in TradingMC`}
              fill
              sizes="(max-width: 1024px) 100vw, 1024px"
              quality={92}
              className="object-cover object-top"
              priority
            />
          </div>
        </section>
      )}

      {/* Explainer blocks */}
      <section className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
        <div className="space-y-16">
          {feature.blocks.map((block) => (
            <div key={block.heading}>
              <h2
                className="font-black tracking-tight leading-tight"
                style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", color: "#F8FAFC" }}
              >
                {block.heading}
              </h2>
              <p
                className="mt-4 leading-relaxed"
                style={{ fontSize: "1.05rem", color: "rgba(203,213,225,0.72)" }}
              >
                {block.body}
              </p>
              {block.points && (
                <ul className="mt-6 space-y-3.5">
                  {block.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                        style={{ background: "rgba(20,184,166,0.15)" }}
                      >
                        <Check className="h-3 w-3" style={{ color: "#14B8A6" }} strokeWidth={3} />
                      </span>
                      <span
                        className="leading-relaxed"
                        style={{ fontSize: "1rem", color: "rgba(203,213,225,0.70)" }}
                      >
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          className="mt-20 rounded-2xl px-7 py-9 text-center sm:px-10"
          style={{
            background: "rgba(20,184,166,0.07)",
            border: "1px solid rgba(20,184,166,0.20)",
          }}
        >
          <h3
            className="font-black tracking-tight"
            style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", color: "#F8FAFC" }}
          >
            Put {feature.name.toLowerCase()} to work
          </h3>
          <p className="mx-auto mt-3 max-w-md leading-relaxed" style={{ color: "rgba(203,213,225,0.65)" }}>
            Start logging the quiet work that separates funded traders from former ones.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              style={{
                background: "linear-gradient(135deg,#14B8A6 0%,#06B6D4 100%)",
                boxShadow: "0 4px 24px rgba(20,184,166,0.30), 0 1px 3px rgba(0,0,0,0.30)",
              }}
            >
              Make account
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={`/features/${next.slug}`}
              className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold text-[rgba(203,213,225,0.70)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(20,184,166,0.50)] hover:text-[#F8FAFC] active:translate-y-0"
              style={{ borderColor: "rgba(255,255,255,0.12)" }}
            >
              Next: {next.name}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
