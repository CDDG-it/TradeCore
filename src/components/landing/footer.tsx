"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const socialLinks = [
  { label: "X", href: "https://x.com/tradingmc" },
  { label: "Instagram", shortLabel: "IG", href: "https://instagram.com/tradingmc" },
  { label: "TikTok", shortLabel: "TT", href: "https://tiktok.com/@tradingmc" },
  { label: "LinkedIn", shortLabel: "in", href: "https://linkedin.com/company/tradingmc" },
] as const;

export function LandingFooter() {
  const root = useRef<HTMLElement>(null);
  const statement = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.from(".footer-line", { opacity: 0.08, y: 32, stagger: 0.09, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: statement.current, start: "top 78%", once: true } });
    gsap.from(".footer-link-panel", { opacity: 0, y: 20, duration: 0.65, ease: "power3.out", scrollTrigger: { trigger: ".footer-directory", start: "top 88%", once: true } });
    ScrollTrigger.matchMedia({
      "(min-width: 1024px) and (min-height: 720px)": () => ScrollTrigger.create({ trigger: statement.current, start: "top top+=96", end: "+=120", pin: statement.current, pinSpacing: true }),
    });
  }, { scope: root });

  return (
    <footer ref={root} className="relative w-full max-w-full overflow-x-hidden overflow-y-clip bg-[#080e1b] text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(20,184,166,.14),transparent_30%),radial-gradient(circle_at_16%_58%,rgba(6,182,212,.08),transparent_34%)]" />
      <div aria-hidden className="marketing-grid pointer-events-none absolute inset-0 opacity-[.09]" />

      <div className="relative mx-auto max-w-[1380px] px-6 sm:px-10 lg:px-12">
        <div ref={statement} className="flex min-h-[72vh] items-center py-28 md:min-h-[78vh] md:py-40">
          <div className="max-w-6xl">
            <p className="footer-line font-display text-[clamp(3rem,8vw,7.5rem)] font-semibold leading-[.91] tracking-[-.065em] text-white">An ordinary journal</p>
            <p className="footer-line font-display text-[clamp(3rem,8vw,7.5rem)] font-semibold leading-[.91] tracking-[-.065em] text-white">won&apos;t build an</p>
            <p className="footer-line flex flex-wrap items-center gap-x-[.18em] font-display text-[clamp(3rem,8vw,7.5rem)] font-semibold leading-[.91] tracking-[-.065em] text-[#65d4c8]">
              <span>extraordinary</span>
              <span>trader.</span>
            </p>
            <div className="footer-line mt-12 flex flex-wrap items-center gap-4">
              <Link href="/signup" className="marketing-cta group inline-flex min-h-12 items-center justify-center rounded-full bg-[#14b8a6] px-7 text-sm font-semibold text-[#081721] shadow-[0_10px_34px_rgba(20,184,166,.2)] hover:bg-[#70d9cf]">Create your account<span aria-hidden className="ml-2 transition-transform duration-200 group-hover:translate-x-1">→</span></Link>
              <Link href="/login" className="marketing-cta inline-flex min-h-12 items-center justify-center rounded-full border border-[#5a7f87] px-6 text-sm font-medium text-[#d9e8e9] hover:border-[#a9ddd8] hover:bg-white/5 hover:text-white">Sign in</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-[1080px] px-6 sm:px-10 lg:px-12">
        <div className="footer-directory flex flex-col gap-10 border-t border-white/10 py-14 sm:py-16 lg:flex-row lg:items-end lg:justify-between">
          <div className="footer-link-panel max-w-md">
            <Link href="/" aria-label="TradingMC home" className="inline-block transition-opacity hover:opacity-75"><Image src="/tradingmc-logo.png" alt="TradingMC" width={979} height={500} className="h-11 w-auto" /></Link>
            <p className="mt-6 max-w-sm text-sm leading-[1.75] text-[#9fb7bc]">The workspace for traders who want a process they can trust before, during and after the session.</p>
          </div>
          <nav className="footer-link-panel" aria-label="Social media">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[.2em] text-[#65d4c8]">Follow TradingMC</p>
            <ul className="flex flex-wrap gap-2.5">
              {socialLinks.map((link) => <li key={link.href}><a href={link.href} target="_blank" rel="noreferrer" aria-label={link.label} className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-white/10 px-3 text-xs font-semibold text-[#d4e3e5] transition-[border-color,background-color,color,transform] duration-300 hover:-translate-y-0.5 hover:border-[#14b8a6]/60 hover:bg-[#14b8a6]/10 hover:text-white">{link.shortLabel ?? link.label}</a></li>)}
            </ul>
          </nav>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-white/10 py-7 text-xs text-[#78939c] sm:flex-row"><p>© {new Date().getFullYear()} TradingMC</p><p>An ordinary journal won&apos;t build an extraordinary trader.</p></div>
      </div>
    </footer>
  );
}
