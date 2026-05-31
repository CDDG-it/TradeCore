import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/ui/fade-in";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── Hero background video ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: 0.42,
            filter: "sepia(0.75) saturate(3.5) hue-rotate(10deg) brightness(0.80)",
          }}
        >
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_145119_f4ec4d9f-3ecd-4116-baa3-26e8cf2df976.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 90% 90% at 50% 50%, rgba(7,4,2,0.18) 0%, rgba(7,4,2,0.68) 100%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(249,115,22,0.30) 0%, transparent 70%)" }} />
        <div className="absolute inset-0" style={{ background: "rgba(180,70,0,0.22)" }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundRepeat: "repeat", backgroundSize: "128px 128px" }} />
      </div>

      {/* ── Header ── */}
      <header className="relative z-20 px-6 py-4 sticky top-0" style={{ background: "rgba(8,5,2,0.75)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <span
            className="font-black tracking-tight text-base leading-none"
            style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif" }}>
            <span className="text-white">Trade</span>
            <span style={{ background: "linear-gradient(90deg,#F97316,#FBBF24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>CORE</span>
          </span>
          <Link href="/login"
            className="text-sm text-white/40 hover:text-white/80 transition-colors"
            style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif", fontWeight: 600 }}>
            Sign in
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="mx-auto max-w-xl">
          <FadeIn delay={0.10}>
            <h1 className="font-heading font-black text-[clamp(3rem,9vw,7rem)] tracking-tight leading-none text-white mb-6 whitespace-nowrap">
              Trade<span style={{ background: "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>core</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.22}>
            <p className="font-body text-lg font-light text-white/50 mb-10 leading-relaxed">
              Jouw persoonlijke trading dashboard.
            </p>
          </FadeIn>

          <FadeIn delay={0.30}>
            <Link href="/dashboard"
              className="font-body font-semibold inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm text-white transition-all hover:-translate-y-0.5 active:translate-y-0"
              style={{
                background: "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)",
                boxShadow: "0 4px 28px rgba(249,115,22,0.40)",
              }}>
              Open dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
