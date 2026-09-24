"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X, Settings, User as UserIcon, LogOut, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { PRIMARY_NAV } from "@/lib/nav";
import { CREATE, NAV_ICON_ASSETS, isActive } from "@/components/layout/mobile-nav";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

/**
 * The signed-in top bar. One glass rail in the centre with the four
 * destinations, the active one under a pill that slides between them; a
 * create pill and the profile chip on the right, both opening Base UI menus
 * out of their trigger. The bar lifts (deeper ground, a shadow) once the page
 * has scrolled, so it reads as sitting above the content rather than
 * painted on it.
 *
 * Motion budget: tab switches happen many times a day, so the only movement
 * is the pill sliding (a short spring, instant under reduced motion) and the
 * press itself. Menus enter from their trigger in 180ms and leave the same
 * way.
 */
const MENU_MOTION = "duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]";
const MENU_SURFACE = "rounded-2xl border border-border/60 p-1.5 shadow-[0_24px_60px_rgba(0,0,0,.45)] backdrop-blur-md";

/** A "Soon" pill for features that are announced but not yet live. */
function SoonBadge() {
  return (
    <span className="rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary/80">
      Soon
    </span>
  );
}

function RailItem({ href, label, active, soon, instant }: { href: string; label: string; active: boolean; soon?: boolean; instant: boolean }) {
  const iconSrc = NAV_ICON_ASSETS[href];
  if (soon) {
    return (
      <span aria-disabled title="Coming soon" className="relative flex h-9 cursor-default items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] font-semibold text-sidebar-foreground/35">
        {label}
        <SoonBadge />
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "press relative flex h-9 items-center gap-2 whitespace-nowrap rounded-full px-4 text-[13px] font-semibold",
        active ? "text-foreground" : "text-sidebar-foreground/60 hover:bg-white/[0.04] hover:text-sidebar-foreground"
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-active-pill"
          aria-hidden
          className="absolute inset-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
          transition={instant ? { duration: 0 } : { type: "spring", stiffness: 480, damping: 38 }}
        >
          {/* The turquoise underline rides inside the pill, so one spring moves both. */}
          <span
            className="absolute inset-x-4 bottom-0 h-[2px] rounded-full"
            style={{ background: "var(--primary)", boxShadow: "0 0 10px color-mix(in oklch, var(--primary) 70%, transparent)" }}
          />
        </motion.span>
      )}
      <span className={cn(
        "relative z-10 h-[22px] w-[22px] transition-[filter,opacity,transform] duration-150",
        active ? "scale-105 opacity-100" : "opacity-55 grayscale-[35%]"
      )}>
        <Image src={iconSrc} alt="" fill sizes="22px" className="object-contain" />
      </span>
      <span className="relative z-10">{label}</span>
    </Link>
  );
}

/** True once the page has moved: the bar deepens and casts a shadow. */
function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const read = () => setScrolled(window.scrollY > 8);
    read();
    window.addEventListener("scroll", read, { passive: true });
    return () => window.removeEventListener("scroll", read);
  }, []);
  return scrolled;
}

export function TopNav() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const scrolled = useScrolled();

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Trader";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      <header
        data-scrolled={scrolled || undefined}
        className="app-topbar sticky top-0 z-40"
        // The blur stays inline: the build strips `backdrop-filter` from the stylesheet.
        style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
      >
        {/* Three balanced regions so the rail sits screen-centred: the left
            (logo) and right (actions) slots share equal flex width. */}
        <div className="flex h-[60px] items-center gap-3 px-4 lg:px-6">
          <div className="flex min-w-0 flex-1 items-center">
            {/* The brand mark, doubling as the home link, so the app and the
                marketing site read as one brand. */}
            <Link
              href="/"
              aria-label="TradingMC home"
              className="press shrink-0 hover:opacity-80"
            >
              <Image src="/tradingmc-logo.png" alt="TradingMC" width={979} height={500} priority className="h-7 w-auto" />
            </Link>
          </div>

          <nav aria-label="Primary" className="hidden min-w-0 max-w-full items-center gap-0.5 rounded-full border border-white/[0.08] bg-white/[0.03] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] lg:flex">
            {PRIMARY_NAV.map((tab) => (
              <RailItem key={tab.href} href={tab.href} label={tab.label} active={isActive(pathname, tab.href)} soon={tab.soon} instant={!!reduce} />
            ))}
          </nav>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
            <div className="hidden shrink-0 items-center gap-2 lg:flex">
              <CreateMenu />
              <ProfileMenu displayName={displayName} email={user?.email ?? ""} initials={initials} onSignOut={signOut} />
            </div>
            {/* Phone: the profile lives top-right, the way every app does it:
                navigation itself has moved to the bottom tab bar. */}
            <button type="button" onClick={() => setOpen(true)} aria-label="Open profile menu" className="press inline-flex items-center justify-center rounded-full lg:hidden">
              <AvatarChip initials={initials} size={34} />
            </button>
          </div>
        </div>
      </header>

      {/* Phone profile sheet: identity and account actions only; the primary
          destinations are in the bottom tab bar. */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="sheet"
            className="fixed inset-0 z-50 lg:hidden"
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className="absolute inset-0" style={{ background: "rgba(2,6,17,0.6)" }} />
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, transform: reduce ? "none" : "scale(0.96)" }}
              animate={{ opacity: 1, transform: "scale(1)" }}
              exit={{ opacity: 0, transform: reduce ? "none" : "scale(0.96)" }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              style={{ transformOrigin: "top right", background: "color-mix(in oklch, var(--card) 96%, transparent)" }}
              className="absolute right-3 top-3 w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl border border-border p-3 shadow-2xl"
            >
              <div className="flex items-center gap-3 px-1 pb-3">
                <AvatarChip initials={initials} size={42} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-tight">{displayName}</p>
                  <p className="truncate text-xs leading-tight text-muted-foreground">{user?.email}</p>
                </div>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="press inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              <div className="space-y-1 pt-2">
                <Link href="/profile" onClick={() => setOpen(false)} className="press flex items-center gap-2.5 rounded-xl p-3 text-sm font-medium text-foreground/85">
                  <UserIcon className="h-4 w-4 text-muted-foreground" /> Profile
                </Link>
                <Link href="/settings" onClick={() => setOpen(false)} className="press flex items-center gap-2.5 rounded-xl p-3 text-sm font-medium text-foreground/85">
                  <Settings className="h-4 w-4 text-muted-foreground" /> Settings
                </Link>
                <button onClick={signOut} className="press flex w-full items-center gap-2.5 rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Avatar chip: initials on a turquoise→cyan gradient ring, over the nav bg. */
function AvatarChip({ initials, size }: { initials: string; size: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full p-[1.5px]"
      style={{ width: size, height: size, background: "linear-gradient(135deg, var(--primary) 0%, var(--ice) 100%)" }}
    >
      <span className="flex h-full w-full items-center justify-center rounded-full" style={{ background: "var(--sidebar)" }}>
        <span className="font-bold text-sidebar-foreground" style={{ fontSize: size * 0.36 }}>{initials}</span>
      </span>
    </span>
  );
}

/** The two things a trader starts from anywhere: log a trade, plan a session. */
function CreateMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Create"
        className="press group/create inline-flex h-9 items-center gap-1.5 rounded-full pl-2.5 pr-3.5 text-[13px] font-semibold text-white"
        style={{
          background: "linear-gradient(135deg, var(--primary) 0%, var(--ice) 100%)",
          boxShadow: "0 6px 18px color-mix(in oklch, var(--primary) 30%, transparent), inset 0 1px 0 rgba(255,255,255,0.25)",
        }}
      >
        <Plus className="size-4 transition-transform duration-150 ease-out group-data-[popup-open]/create:rotate-45" strokeWidth={2.6} />
        New
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" sideOffset={10} className={cn("w-64", MENU_SURFACE, MENU_MOTION)}>
        {CREATE.map((item) => (
          <DropdownMenuItem key={item.href} render={<Link href={item.href} />} className="flex items-center gap-3 rounded-xl px-2.5 py-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
              <item.icon className="size-[18px]" strokeWidth={2.1} />
            </span>
            <span className="min-w-0">
              <span className="block text-[14px] font-semibold leading-tight text-foreground">{item.label}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{item.hint}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Profile chip and its menu: Profile, Settings, Sign out. */
function ProfileMenu({ displayName, email, initials, onSignOut }: { displayName: string; email: string; initials: string; onSignOut: () => void }) {
  const links = [
    { label: "Profile", href: "/profile", icon: UserIcon },
    { label: "Settings", href: "/settings", icon: Settings },
  ];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="press group/profile flex h-9 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] pl-1 pr-2.5 hover:border-white/15 hover:bg-white/[0.06] data-[popup-open]:border-white/15 data-[popup-open]:bg-white/[0.06]">
        <AvatarChip initials={initials} size={28} />
        <span className="max-w-[120px] truncate text-[13px] font-semibold text-sidebar-foreground/85">{displayName}</span>
        <ChevronDown className="size-3.5 text-sidebar-foreground/40 transition-transform duration-150 ease-out group-data-[popup-open]/profile:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" sideOffset={10} className={cn("w-64", MENU_SURFACE, MENU_MOTION)}>
        <div className="flex items-center gap-3 px-2 py-2">
          <AvatarChip initials={initials} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">{displayName}</p>
            <p className="truncate text-xs leading-tight text-muted-foreground">{email}</p>
          </div>
        </div>
        <DropdownMenuSeparator className="my-1.5 bg-gradient-to-r from-transparent via-border to-transparent" />
        {links.map(({ label, href, icon: Icon }) => (
          <DropdownMenuItem key={href} render={<Link href={href} />} className="group flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm font-medium text-foreground/85">
            <Icon className="size-4 text-muted-foreground" />
            <span>{label}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="my-1.5 bg-gradient-to-r from-transparent via-border to-transparent" />
        <DropdownMenuItem variant="destructive" onClick={onSignOut} className="flex items-center gap-2.5 rounded-xl bg-destructive/10 px-2.5 py-2.5 text-sm font-medium">
          <LogOut className="size-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
