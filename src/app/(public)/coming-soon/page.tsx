import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Newspaper, Magnet, Waves, Users } from "lucide-react";
import { LandingFooter } from "@/components/landing/footer";

const NUNITO = "var(--font-nunito), system-ui, sans-serif";

export const metadata: Metadata = {
  title: "Coming soon — TradingMC",
  description: "What is next for TradingMC.",
};

const UPCOMING = [
  {
    icon: Magnet,
    name: "Gamma Exposure Levels",
    status: "Planned",
    desc: "See where dealer gamma pins price. Map the key GEX levels that act as magnets and walls intraday, so you know which strikes the market wants to defend.",
  },
  {
    icon: Waves,
    name: "CVD",
    status: "Planned",
    desc: "Read the order flow behind the candles. Cumulative Volume Delta shows whether buyers or sellers are actually in control, and where aggression is drying up.",
  },
  {
    icon: Users,
    name: "COT Data",
    status: "Planned",
    desc: "Track how the big players are positioned. Commitment of Traders data turns the weekly report into a clean read on what commercials and large speculators are doing.",
  },
  {
    icon: Newspaper,
    name: "News Scanner",
    status: "Planned",
    desc: "A focused feed of the releases and events that move your instruments, so high impact news never catches you mid trade.",
  },
] as const;

export default function ComingSoonPage() {
  return (
    <div style={{ background: "oklch(0.98 0.003 45)", fontFamily: NUNITO }}>
      {/* Slim header */}
      <header
        className="sticky top-0 z-30 px-6 py-4"
        style={{
          background: "rgba(249,246,242,0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,0,0,0.07)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link
            href="/"
            className="font-black tracking-tight text-base leading-none hover:opacity-80 transition-opacity"
          >
            <span style={{ color: "rgba(15,12,8,0.88)" }}>Trading</span>
            <span style={{ background: "linear-gradient(90deg,#F97316,#d97706)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>MC</span>
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            style={{
              background: "linear-gradient(135deg,#F97316 0%,#d97706 100%)",
              boxShadow: "0 2px 14px rgba(249,115,22,0.30), 0 1px 2px rgba(0,0,0,0.10)",
            }}
          >
            Make account
          </Link>
        </div>
      </header>

      {/* Intro */}
      <section className="mx-auto max-w-5xl px-6 pt-16 pb-10 sm:pt-24">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[rgba(60,48,36,0.45)] transition-colors duration-200 hover:text-[#F97316]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back home
        </Link>

        <div className="mt-7 flex items-center gap-3">
          <span
            className="text-[0.625rem] font-bold uppercase tracking-[0.18em]"
            style={{ color: "rgba(249,115,22,0.90)" }}
          >
            On the roadmap
          </span>
          <span className="h-px w-6" style={{ background: "rgba(249,115,22,0.30)" }} />
        </div>

        <h1
          className="mt-4 font-black tracking-tight leading-[0.9]"
          style={{ fontSize: "clamp(2.6rem, 7vw, 5rem)", color: "rgba(15,12,8,0.90)" }}
        >
          Coming soon
        </h1>
        <p
          className="mt-5 max-w-2xl leading-relaxed"
          style={{ fontSize: "clamp(1.05rem, 2.2vw, 1.35rem)", color: "rgba(60,48,36,0.60)" }}
        >
          The five tools you can use today are only the start. Here is what we are building next, all aimed at the same thing: turning the work around your trading into an edge you can measure.
        </p>
      </section>

      {/* Roadmap grid */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {UPCOMING.map((item) => (
            <div
              key={item.name}
              className="rounded-2xl p-6"
              style={{
                background: "rgba(255,253,250,0.9)",
                border: "1px solid rgba(0,0,0,0.07)",
                boxShadow: "0 1px 3px rgba(16,11,6,0.04)",
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: "rgba(249,115,22,0.10)" }}
                >
                  <item.icon className="h-5 w-5" style={{ color: "#F97316" }} strokeWidth={1.9} />
                </span>
                <span
                  className="rounded-full px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-[0.12em]"
                  style={{ background: "rgba(249,115,22,0.10)", color: "#d97706" }}
                >
                  {item.status}
                </span>
              </div>
              <h2
                className="mt-4 text-lg font-black tracking-tight"
                style={{ color: "rgba(15,12,8,0.86)" }}
              >
                {item.name}
              </h2>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(60,48,36,0.55)" }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm" style={{ color: "rgba(60,48,36,0.45)" }}>
          Make an account now and you grow into every one of these as it ships.
        </p>
      </section>

      <LandingFooter />
    </div>
  );
}
