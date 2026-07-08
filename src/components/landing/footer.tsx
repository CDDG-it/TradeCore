"use client";

import Link from "next/link";
import { ArrowRight, ArrowUp } from "lucide-react";
import { APP_TABS } from "@/lib/nav";

const NUNITO = "var(--font-nunito), system-ui, sans-serif";

const COLUMNS = [
  {
    heading: "Platform",
    // Always the current app tabs, written exactly as they are in the
    // sidebar — sourced from APP_TABS so this list can't drift out of sync.
    links: APP_TABS.map((tab) => ({ label: tab.label, href: tab.href })),
  },
  {
    heading: "Account",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Create account", href: "/signup" },
      { label: "Reset password", href: "/reset-password" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms of service", href: "/terms" },
      { label: "Privacy policy", href: "/privacy" },
    ],
  },
] as const;

export function LandingFooter() {
  return (
    <footer
      style={{ background: "rgba(249,246,242,1)", borderTop: "1px solid rgba(0,0,0,0.07)" }}
    >
      <div className="mx-auto max-w-6xl px-6 sm:px-10">

        {/* Top: brand + link columns */}
        <div className="grid grid-cols-1 gap-12 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">

          {/* Brand block */}
          <div className="max-w-xs">
            <Link
              href="/"
              className="font-black text-lg tracking-tight leading-none transition-opacity hover:opacity-70"
              style={{ fontFamily: NUNITO }}
            >
              <span style={{ color: "rgba(15,12,8,0.88)" }}>Trading</span>
              <span style={{
                background: "linear-gradient(90deg,#14B8A6,#0D9488)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>MC</span>
            </Link>
            <p
              className="mt-3 text-sm leading-relaxed"
              style={{ fontFamily: NUNITO, color: "rgba(60,48,36,0.55)" }}
            >
              Where self-improvement meets trading. Built for futures traders
              who take their preparation as seriously as their entries.
            </p>
            <Link
              href="/dashboard"
              className="group mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#14B8A6] transition-colors hover:text-[#0D9488]"
              style={{ fontFamily: NUNITO }}
            >
              Start your journal
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <p
                className="text-[0.625rem] font-bold uppercase tracking-[0.18em]"
                style={{ fontFamily: NUNITO, color: "rgba(60,48,36,0.40)" }}
              >
                {col.heading}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[rgba(60,48,36,0.55)] transition-colors duration-200 hover:text-[rgba(15,12,8,0.88)]"
                      style={{ fontFamily: NUNITO }}
                    >
                      {/* Accent dash that slides in on hover */}
                      <span
                        className="h-px w-0 transition-all duration-200 group-hover:w-3"
                        style={{ background: "#14B8A6" }}
                      />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col items-center justify-between gap-4 py-6 sm:flex-row"
          style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
        >
          <p className="text-xs" style={{ fontFamily: NUNITO, color: "rgba(60,48,36,0.40)" }}>
            © {new Date().getFullYear()} TradingMC. All rights reserved.
          </p>
          <p className="text-xs" style={{ fontFamily: NUNITO, color: "rgba(60,48,36,0.40)" }}>
            Plan the session. Log the trade. Review the week.
          </p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold text-[rgba(60,48,36,0.55)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(20,184,166,0.45)] hover:text-[#14B8A6]"
            style={{ fontFamily: NUNITO, borderColor: "rgba(16,11,6,0.12)" }}
          >
            Back to top
            <ArrowUp className="h-3 w-3" />
          </button>
        </div>
      </div>
    </footer>
  );
}
