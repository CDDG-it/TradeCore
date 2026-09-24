import Image from "next/image";
import Link from "next/link";

const groups = [
  { title: "Account", links: [{ label: "Sign in", href: "/login" }, { label: "Create account", href: "/signup" }, { label: "Reset password", href: "/reset-password" }] },
  { title: "Legal", links: [{ label: "Terms of service", href: "/terms" }, { label: "Privacy policy", href: "/privacy" }] },
] as const;

export function LandingFooter() {
  return (
    <footer className="relative overflow-hidden bg-[#080e1b] px-6 pb-7 pt-20 text-white sm:px-10 lg:px-12 lg:pt-28">
      <div aria-hidden className="pointer-events-none absolute -right-32 top-0 h-80 w-80 rounded-full bg-[#14b8a6]/10 blur-[100px]" />
      <div className="relative mx-auto max-w-[1260px]">
        <div className="grid gap-14 border-b border-white/10 pb-16 lg:grid-cols-[1.1fr_.9fr] lg:gap-24 lg:pb-20">
          <div>
            <Link href="/" aria-label="TradingMC home" className="inline-block transition-opacity hover:opacity-80"><Image src="/tradingmc-logo.png" alt="TradingMC" width={979} height={500} className="h-9 w-auto sm:h-11" /></Link>
            <p className="mt-7 max-w-md text-base leading-[1.75] text-[#aec3c8]">The workspace for traders who want a process they can trust before, during and after the session.</p>
            <Link href="/signup" className="mt-8 inline-flex min-h-11 items-center rounded-full bg-[#14b8a6] px-6 text-sm font-semibold text-[#081721] shadow-[0_6px_22px_rgba(20,184,166,.22)] transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-[#70d9cf]">Create account</Link>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">{groups.map((group) => <nav key={group.title} aria-label={group.title}><h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7be0d5]">{group.title}</h2><ul className="mt-6 space-y-3.5">{group.links.map((link) => <li key={link.href}><Link href={link.href} className="text-sm font-medium text-[#d4e3e5] transition-colors hover:text-[#aee9e2]">{link.label}</Link></li>)}</ul></nav>)}</div>
        </div>
        <div className="flex flex-col justify-between gap-3 pt-6 text-xs text-[#78939c] sm:flex-row"><p>© {new Date().getFullYear()} TradingMC</p><p>An ordinary journal won&apos;t build an extraordinary trader.</p></div>
      </div>
    </footer>
  );
}
