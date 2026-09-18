import Link from "next/link";

const groups = [
  { title: "Account", links: [{ label: "Sign in", href: "/login" }, { label: "Create account", href: "/signup" }, { label: "Reset password", href: "/reset-password" }] },
  { title: "Legal", links: [{ label: "Terms of service", href: "/terms" }, { label: "Privacy policy", href: "/privacy" }] },
] as const;

export function LandingFooter() {
  return (
    <footer className="bg-[#0b1120] px-6 pb-7 pt-24 text-white sm:px-10 lg:px-12">
      <div className="mx-auto max-w-[1260px]">
        <div className="grid gap-16 border-b border-white/15 pb-24 lg:grid-cols-[1.5fr_1fr]">
          <div><Link href="/" className="font-display block w-fit text-[clamp(3.5rem,7vw,7rem)] font-semibold leading-none tracking-[-0.07em]">Trading<span className="text-[#65d4c8]">MC</span></Link><p className="mt-6 max-w-md text-base leading-relaxed text-[#aec3c8]">Plan the session. Follow your commitments. Review what happened. Refine the next decision.</p></div>
          <div className="grid grid-cols-2 gap-8 sm:gap-14">{groups.map((group) => <nav key={group.title} aria-label={group.title}><h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8db9be]">{group.title}</h2><ul className="mt-7 space-y-4">{group.links.map((link) => <li key={link.href}><Link href={link.href} className="text-sm font-medium text-[#d4e3e5] transition-colors hover:text-[#7be0d5]">{link.label}</Link></li>)}</ul></nav>)}</div>
        </div>
        <div className="flex flex-col justify-between gap-4 pt-6 text-xs text-[#90acb4] sm:flex-row"><p>© {new Date().getFullYear()} TradingMC</p><p>An ordinary journal won&apos;t build an extraordinary trader.</p></div>
      </div>
    </footer>
  );
}
