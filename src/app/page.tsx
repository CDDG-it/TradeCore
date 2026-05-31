import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/ui/fade-in";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Background video (orange-tinted) ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: 0.55,
            filter: "grayscale(1) brightness(0.75) contrast(1.1)",
          }}
        >
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260302_085640_276ea93b-d7da-4418-a09b-2aa5b490e838.mp4" type="video/mp4" />
        </video>
        {/* Orange colour wash — gives the video the site's amber tone */}
        <div className="absolute inset-0"
          style={{ background: "rgba(249,115,22,0.38)", mixBlendMode: "multiply" }} />
        {/* White vignette — keeps edges clean */}
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 30%, rgba(255,255,255,0.88) 100%)" }} />
        {/* Top + bottom white fades */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.75) 0%, transparent 25%, transparent 75%, rgba(255,255,255,0.75) 100%)" }} />
        {/* Centre readability wash */}
        <div className="absolute inset-0"
          style={{ background: "rgba(255,255,255,0.18)" }} />
      </div>

      {/* ── Header ── */}
      <header
        className="relative z-20 px-6 py-4 sticky top-0"
        style={{
          background: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,0,0,0.07)",
        }}
      >
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <span
            className="font-black tracking-tight text-base leading-none"
            style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif" }}
          >
            <span className="text-gray-900">Trade</span>
            <span style={{ background: "linear-gradient(90deg,#F97316,#FBBF24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>CORE</span>
          </span>
          <Link
            href="/login"
            className="text-sm text-gray-400 hover:text-gray-900 transition-colors"
            style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif", fontWeight: 600 }}
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="mx-auto max-w-xl">
          <FadeIn delay={0.10}>
            <h1
              className="font-heading font-black text-[clamp(3rem,9vw,7rem)] tracking-tight leading-none text-gray-900 mb-6 whitespace-nowrap"
            >
              Trade<span style={{ background: "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>core</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.22}>
            <p className="font-body text-lg font-light text-gray-500 mb-10 leading-relaxed">
              Jouw persoonlijke trading dashboard.
            </p>
          </FadeIn>

          <FadeIn delay={0.30}>
            <Link
              href="/dashboard"
              className="font-body font-semibold inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm text-white transition-all hover:-translate-y-0.5 active:translate-y-0"
              style={{
                background: "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)",
                boxShadow: "0 4px 28px rgba(249,115,22,0.35)",
              }}
            >
              Open dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
