import Link from "next/link";
import { Lock } from "lucide-react";

/**
 * MC Trade Therapist — temporarily locked. The deterministic pattern engine,
 * Pre-Trade Mirror and Post-Trade 5R are built (see src/components/trade-therapist/*)
 * but held back behind a "Soon" state until the surface is ready to ship.
 * Flip nav.ts `soon` off and restore the tabbed page to re-enable.
 */
export default function TradeTherapistPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border/60 bg-card p-10 text-center">
        {/* Soft turquoise glow, purely decorative */}
        <div
          className="pointer-events-none absolute inset-x-0 -top-24 h-48"
          style={{ background: "radial-gradient(60% 100% at 50% 100%, rgba(20,184,166,0.16), transparent 70%)" }}
        />

        <div className="relative flex flex-col items-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/25"
            style={{ background: "rgba(20,184,166,0.10)" }}
          >
            <Lock className="h-6 w-6 text-primary" />
          </div>

          <p className="mt-6 font-body text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            MC Mindset Formula
          </p>
          <h1 className="mt-2 font-heading text-3xl font-black tracking-tight text-foreground">
            MC Trade Therapist
          </h1>

          <p className="mt-3 text-2xl font-black tracking-tight text-primary">Soon…</p>

          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Your data-driven behavioural coach is on its way — the Pre-Trade Mirror
            and Post-Trade 5R reflections that turn your own history into an edge.
            We&apos;re putting the finishing touches on it.
          </p>

          <Link
            href="/psychological-edge"
            className="mt-8 inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-px"
            style={{ background: "#14B8A6", boxShadow: "0 4px 14px rgba(20,184,166,0.30)" }}
          >
            Back to MC Mind Edge
          </Link>
        </div>
      </div>
    </div>
  );
}
