"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { PRODUCTS, TRADER_LEVELS } from "@/lib/landing/nav";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/* The directory mirrors the top navigation, and takes Products and For
   traders straight from the same source, so the two can never drift apart. */
const accountLinks = [
  { label: "Pricing", href: "/pricing" },
  { label: "Sign in", href: "/login" },
  { label: "Create account", href: "/signup" },
];

const legalLinks = [
  { label: "Terms of service", href: "/terms" },
  { label: "Privacy policy", href: "/privacy" },
];

/* No accounts to point at yet, so these are marks, not links. Give them an
   href once the profiles exist and they become anchors again. */
const socials = ["X", "IG", "TT", "in"];

const columnClass = "footer-link-panel min-w-0";
const headingClass = "mb-3 text-[10px] font-semibold uppercase tracking-[.2em] text-[#65d4c8]";
const linkClass =
  "block py-1 text-sm text-[#9fb7bc] transition-colors duration-200 hover:text-white";

export function LandingFooter() {
  const root = useRef<HTMLElement>(null);
  const statement = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.from(".footer-line", {
      opacity: 0.08,
      y: 32,
      stagger: 0.09,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: { trigger: statement.current, start: "top 78%", once: true },
    });
    gsap.from(".footer-link-panel", {
      opacity: 0,
      y: 20,
      stagger: 0.06,
      duration: 0.6,
      ease: "power3.out",
      scrollTrigger: { trigger: ".footer-directory", start: "top 92%", once: true },
    });
  }, { scope: root });

  return (
    /* One screen tall: the statement takes whatever space is left above the
       directory, so the whole footer arrives as a single view. It grows past a
       viewport only when the directory itself needs more room, which is what
       happens on a phone. */
    <footer
      ref={root}
      className="relative flex min-h-screen w-full max-w-full flex-col overflow-x-hidden overflow-y-clip bg-[#080e1b] text-white"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(20,184,166,.14),transparent_30%),radial-gradient(circle_at_16%_58%,rgba(6,182,212,.08),transparent_34%)]"
      />
      <div aria-hidden className="marketing-grid pointer-events-none absolute inset-0 opacity-[.09]" />

      <div className="relative mx-auto flex w-full max-w-[1380px] flex-1 items-center px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
        <div ref={statement} className="max-w-6xl">
          <p className="footer-line font-display text-[clamp(2.25rem,6vw,5.5rem)] font-semibold leading-[.94] tracking-[-.06em] text-white">
            An ordinary journal
          </p>
          <p className="footer-line font-display text-[clamp(2.25rem,6vw,5.5rem)] font-semibold leading-[.94] tracking-[-.06em] text-white">
            won&apos;t build an
          </p>
          <p className="footer-line font-display text-[clamp(2.25rem,6vw,5.5rem)] font-semibold leading-[.94] tracking-[-.06em] text-[#65d4c8]">
            extraordinary trader.
          </p>
          <div className="footer-line mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/signup"
              className="marketing-cta group inline-flex min-h-12 items-center justify-center rounded-full bg-[#14b8a6] px-7 text-sm font-semibold text-[#081721] shadow-[0_10px_34px_rgba(20,184,166,.2)] hover:bg-[#70d9cf]"
            >
              Create your account
              <span aria-hidden className="ml-2 transition-transform duration-200 group-hover:translate-x-1">
                →
              </span>
            </Link>
            <Link
              href="/login"
              className="marketing-cta inline-flex min-h-12 items-center justify-center rounded-full border border-[#5a7f87] px-6 text-sm font-medium text-[#d9e8e9] hover:border-[#a9ddd8] hover:bg-white/5 hover:text-white"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[1380px] px-6 sm:px-10 lg:px-12">
        <div className="footer-directory grid gap-8 border-t border-white/10 py-9 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_.8fr_.8fr] lg:gap-8">
          <div className={cn(columnClass, "max-w-sm")}>
            <Link href="/" aria-label="TradingMC home" className="inline-block transition-opacity hover:opacity-75">
              <Image src="/tradingmc-logo.png" alt="TradingMC" width={979} height={500} className="h-10 w-auto" />
            </Link>
            <p className="mt-5 text-sm leading-[1.75] text-[#9fb7bc]">
              The workspace for traders who want a process they can trust before, during and after the session.
            </p>
            <p className={cn(headingClass, "mt-7")}>Follow TradingMC</p>
            <ul className="flex flex-wrap gap-2.5">
              {socials.map((mark) => (
                <li key={mark}>
                  <span
                    aria-hidden
                    className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-white/10 px-3 text-xs font-semibold text-[#d4e3e5]"
                  >
                    {mark}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <nav className={columnClass} aria-label="Products">
            <p className={headingClass}>Products</p>
            <ul>
              {PRODUCTS.map((product) => (
                <li key={product.href}>
                  <Link href={product.href} className={linkClass}>
                    {product.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className={columnClass} aria-label="For traders">
            <p className={headingClass}>For traders</p>
            <ul>
              {TRADER_LEVELS.map((level) => (
                <li key={level.href}>
                  <Link href={level.href} className={linkClass}>
                    {level.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className={columnClass} aria-label="Account">
            <p className={headingClass}>Account</p>
            <ul>
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className={columnClass} aria-label="Legal">
            <p className={headingClass}>Legal</p>
            <ul>
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-white/10 py-5 text-xs text-[#78939c] sm:flex-row">
          <p>© {new Date().getFullYear()} TradingMC</p>
          <p>An ordinary journal won&apos;t build an extraordinary trader.</p>
        </div>
      </div>
    </footer>
  );
}
