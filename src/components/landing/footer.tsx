import Link from "next/link";

const groups = [
  { title: "Account", links: [{ label: "Sign in", href: "/login" }, { label: "Create account", href: "/signup" }, { label: "Reset password", href: "/reset-password" }] },
  { title: "Legal", links: [{ label: "Terms of service", href: "/terms" }, { label: "Privacy policy", href: "/privacy" }] },
] as const;

export function LandingFooter() {
  return (
    <footer className="bg-[#f3f7f7] px-6 pb-7 pt-20 text-[#0b1120] sm:px-10 lg:px-12">
      <div className="mx-auto max-w-[1260px]">
        <div className="grid gap-16 border-b border-[#cad9dc] pb-20 lg:grid-cols-[1.5fr_1fr]">
          <div><p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[#46717a]">A better question after every trade</p><Link href="/" className="mt-7 block w-fit text-[clamp(3.5rem,7vw,7rem)] font-semibold leading-none tracking-[-0.08em]">Trading<span className="text-[#0d8d82]">MC</span></Link><p className="mt-6 max-w-sm text-base leading-relaxed text-[#516a72]">Built for traders who want the work between trades to matter.</p></div>
          <div className="grid grid-cols-2 gap-8 sm:gap-14">{groups.map((group) => <nav key={group.title} aria-label={group.title}><h2 className="font-mono text-[11px] uppercase tracking-[0.15em] text-[#49727a]">{group.title}</h2><ul className="mt-7 space-y-4">{group.links.map((link) => <li key={link.href}><Link href={link.href} className="text-sm font-medium text-[#1d3842] transition-colors hover:text-[#087b72]">{link.label}</Link></li>)}</ul></nav>)}</div>
        </div>
        <div className="flex flex-col justify-between gap-4 pt-6 text-xs text-[#5e7880] sm:flex-row"><p>© {new Date().getFullYear()} TradingMC</p><p>Plan the session. Log the trade. Review the decision.</p></div>
      </div>
    </footer>
  );
}
