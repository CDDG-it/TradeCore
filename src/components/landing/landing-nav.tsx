"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { NavigationMenu } from "@base-ui/react/navigation-menu";
import { ChevronDown, Menu, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { PRODUCTS, TRADER_LEVELS, type Product } from "@/lib/landing/nav";

const PRODUCT_ICONS: Record<Product["icon"], string> = {
  dashboard: "/product-icons/dashboard-glass-v2.png",
  edge: "/product-icons/edge-glass-v2.png",
  therapist: "/product-icons/therapist-glass-v2.png",
  markets: "/product-icons/markets-glass-v2.png",
};

function ProductIcon({ icon, className }: { icon: Product["icon"]; className?: string }) {
  return <Image src={PRODUCT_ICONS[icon]} alt="" width={128} height={128} className={className} />;
}

function AccountCta({ onClick, className }: { onClick?: () => void; className?: string }) {
  const reduceMotion = useReducedMotion();
  return <motion.div className={className} whileHover={reduceMotion ? undefined : { y: -1, scale: 1.015 }} whileTap={reduceMotion ? undefined : { scale: .97 }}>
    <Link href="/signup" onClick={onClick} className="marketing-cta group relative flex h-full min-h-9 w-full items-center justify-center overflow-hidden rounded-full bg-[#b5e5f2] px-4 text-sm font-semibold text-[#081721] shadow-[0_6px_22px_rgba(181,229,242,.18),inset_0_1px_0_rgba(255,255,255,.55)]">
      {!reduceMotion && <motion.span aria-hidden className="absolute inset-y-0 w-16 -skew-x-12 bg-white/55 blur-sm" initial={{ x: -100 }} animate={{ x: 240 }} transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 2.6, ease: "easeInOut" }} />}
      <span className="relative">Create account</span>
    </Link>
  </motion.div>;
}

// Matches the signed-in app's top-nav rail items: a pill inside a glass rail.
const triggerClass = "marketing-nav-trigger inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold text-[#d0dfe1] hover:bg-white/[0.06] hover:text-white data-[popup-open]:bg-white/[0.06] data-[popup-open]:text-white";

function ProductsPanel() {
  return (
    <div className="w-[min(92vw,640px)] p-4">
      <p className="marketing-nav-label px-3 pt-2">Four products, one process</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {PRODUCTS.map((product) => (
            <li key={product.href}>
              <NavigationMenu.Link render={<Link href={product.href} />} className="marketing-nav-card group flex h-full gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-[#14b8a6]/50 hover:bg-[#14b8a6]/[0.08]">
                <span className="grid size-[72px] shrink-0 place-items-center overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_35%_30%,rgba(181,229,242,.16),transparent_70%)]"><ProductIcon icon={product.icon} className="size-[68px] object-contain transition-transform duration-700 ease-out group-hover:scale-105" /></span>
                <span className="min-w-0"><span className="block text-sm font-semibold text-white">{product.name}</span><span className="mt-1 block text-xs leading-relaxed text-[#9db6bb]">{product.tagline}</span></span>
              </NavigationMenu.Link>
            </li>
        ))}
      </ul>
    </div>
  );
}

function LevelsPanel() {
  return (
    <div className="w-[min(92vw,460px)] p-4">
      <p className="marketing-nav-label px-3 pt-2">By trader level</p>
      <ul className="mt-2 space-y-1">
        {TRADER_LEVELS.map((level) => (
          <li key={level.label}>
            <NavigationMenu.Link render={<Link href={level.href} />} className="marketing-nav-card flex rounded-xl p-3 hover:bg-white/5">
              <span className="min-w-0"><span className="block text-sm font-semibold text-white">{level.label}</span><span className="mt-0.5 block text-xs leading-relaxed text-[#9db6bb]">{level.body}</span></span>
            </NavigationMenu.Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DesktopMenu() {
  return (
    <NavigationMenu.Root className="hidden lg:block" delay={80} closeDelay={120}>
      <NavigationMenu.List className="flex items-center gap-0.5 rounded-full border border-white/[0.08] bg-white/[0.03] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={triggerClass}>Products<NavigationMenu.Icon className="marketing-nav-chevron"><ChevronDown className="h-3.5 w-3.5" /></NavigationMenu.Icon></NavigationMenu.Trigger>
          <NavigationMenu.Content className="marketing-nav-content"><ProductsPanel /></NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={triggerClass}>For traders<NavigationMenu.Icon className="marketing-nav-chevron"><ChevronDown className="h-3.5 w-3.5" /></NavigationMenu.Icon></NavigationMenu.Trigger>
          <NavigationMenu.Content className="marketing-nav-content"><LevelsPanel /></NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Link render={<Link href="/pricing" />} className={triggerClass}>Pricing</NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <NavigationMenu.Portal>
        <NavigationMenu.Positioner className="marketing-nav-positioner z-40" sideOffset={18} collisionPadding={16}>
          <NavigationMenu.Popup className="marketing-nav-popup rounded-[24px] border border-white/10 bg-[#0d1c29] text-white shadow-[0_30px_80px_rgba(0,0,0,.55)]">
            <NavigationMenu.Viewport className="marketing-nav-viewport" />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <div id="marketing-mobile-menu" data-open={open || undefined} aria-hidden={!open} className="marketing-mobile-menu fixed inset-x-0 bottom-0 top-[72px] z-40 overflow-y-auto bg-[#0b1120] px-6 pb-10 pt-6 lg:hidden" {...(!open ? { inert: true } : {})}>
      <nav aria-label="Site" className="mx-auto max-w-[560px] space-y-8">
        <div>
          <p className="marketing-nav-label">Products</p>
          <ul className="mt-3 divide-y divide-white/10 border-y border-white/10">
            {PRODUCTS.map((product) => (
              <li key={product.href}><Link href={product.href} onClick={onClose} className="flex items-center gap-3 py-3.5"><span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/[.03]"><ProductIcon icon={product.icon} className="size-[52px] object-contain" /></span><span><span className="block text-[15px] font-medium text-white">{product.name}</span><span className="mt-0.5 block text-xs leading-relaxed text-[#8aa5ab]">{product.tagline}</span></span></Link></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="marketing-nav-label">For traders</p>
          <ul className="mt-3 divide-y divide-white/10 border-y border-white/10">
            {TRADER_LEVELS.map((level) => (
              <li key={level.label}><Link href={level.href} onClick={onClose} className="block py-3.5"><span className="block text-[15px] font-medium text-white">{level.label}</span><span className="mt-0.5 block text-xs leading-relaxed text-[#8aa5ab]">{level.body}</span></Link></li>
            ))}
          </ul>
        </div>
        <Link href="/pricing" onClick={onClose} className="block border-b border-white/10 pb-4 text-[15px] font-medium text-white">Pricing</Link>
        <div className="flex gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <Link href="/login" onClick={onClose} className="marketing-cta inline-flex min-h-11 flex-1 items-center justify-center rounded-full text-sm font-medium text-[#d0dfe1] hover:bg-white/[0.06]">Sign in</Link>
          <AccountCta onClick={onClose} className="min-h-11 flex-1" />
        </div>
      </nav>
    </div>
  );
}

export function LandingNav() {
  const [open, setOpen] = useState(false);

  // Every link in the panel closes it on click; growing past the phone breakpoint closes it too.
  useEffect(() => {
    if (!open) return;
    const query = window.matchMedia("(min-width: 1024px)");
    const close = () => setOpen(false);
    query.addEventListener("change", close);
    document.body.style.overflow = "hidden";
    return () => { query.removeEventListener("change", close); document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b1120]/95 px-6 backdrop-blur-xl sm:px-10 lg:px-12">
        <div className="mx-auto grid h-[72px] max-w-[1380px] grid-cols-[1fr_auto] items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
          <Link href="/" aria-label="TradingMC home" className="shrink-0 justify-self-start transition-opacity hover:opacity-75">
            <Image src="/tradingmc-logo.png" alt="TradingMC" width={979} height={500} priority className="h-7 w-auto sm:h-8" />
          </Link>
          <DesktopMenu />
          <div className="flex items-center justify-self-end gap-2 sm:gap-3">
            <nav aria-label="Account" className="hidden items-center gap-0.5 rounded-full border border-white/[0.08] bg-white/[0.03] p-1 text-[13px] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:flex">
              <Link href="/login" className="marketing-cta inline-flex h-9 items-center rounded-full px-4 text-[#d0dfe1] hover:bg-white/[0.06] hover:text-white">Sign in</Link>
              <AccountCta className="h-9" />
            </nav>
            <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="marketing-mobile-menu" className="marketing-cta grid h-10 w-10 place-items-center rounded-xl border border-white/15 text-white hover:bg-white/5 lg:hidden">
              <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>
      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}
