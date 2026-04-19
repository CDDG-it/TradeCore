"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  LineChart,
  BarChart2,
  Wallet,
  Newspaper,
  Settings,
  User,
  LogOut,
  Compass,
  Brain,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/logo";

const navGroups = [
  {
    label: null,
    items: [
      { href: "/command", label: "Command Center", icon: Compass, highlight: true },
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Trading",
    items: [
      { href: "/journal", label: "Journal", icon: BookOpen },
      { href: "/analysis", label: "Analysis", icon: LineChart },
      { href: "/analytics", label: "Analytics", icon: BarChart2 },
      { href: "/accounts", label: "Accounts", icon: Wallet },
    ],
  },
  {
    label: "Mindset",
    items: [
      { href: "/self-improvement", label: "Self-Improvement", icon: Flame },
      { href: "/coaching", label: "Coaching", icon: Brain },
    ],
  },
  {
    label: "Other",
    items: [
      { href: "/news", label: "News", icon: Newspaper },
    ],
  },
];

const bottomItems = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/profile", label: "Profile", icon: User },
];

function NavItem({
  href,
  label,
  icon: Icon,
  isActive,
  highlight,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  highlight?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "font-body flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 relative group/nav",
        isActive
          ? "liquid-glass text-white"
          : "text-white/40 hover:text-white/80 hover:bg-white/[0.04]"
      )}
    >
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-4 rounded-r-full"
          style={{ background: "oklch(0.72 0.22 45)" }}
        />
      )}
      <Icon
        className="w-[15px] h-[15px] shrink-0 transition-colors"
        style={
          isActive
            ? { color: "#F97316" }
            : highlight
            ? { color: "rgba(249,115,22,0.55)" }
            : undefined
        }
      />
      <span className={isActive ? "text-white/90" : ""}>{label}</span>
      {highlight && !isActive && (
        <span
          className="ml-auto text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded-full"
          style={{ background: "rgba(249,115,22,0.14)", color: "#F97316" }}
        >
          DAILY
        </span>
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const initials =
    user?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "DT";

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-60 flex flex-col z-40"
      style={{
        background: "oklch(0.055 0.002 28)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Logo */}
      <div
        className="h-14 flex items-center px-5 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <Logo variant="dark" size={26} />
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {navGroups.map((group) => (
          <div key={group.label ?? "primary"}>
            {group.label && (
              <p className="font-body text-[9px] font-semibold uppercase tracking-[0.14em] px-3 mb-2 text-white/25">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                const highlight = "highlight" in item ? item.highlight : false;
                return (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    isActive={isActive}
                    highlight={highlight}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom nav + user */}
      <div
        className="px-3 pb-3 space-y-0.5 pt-3 shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        {bottomItems.map(({ href, label, icon }) => {
          const isActive = pathname === href;
          return (
            <NavItem key={href} href={href} label={label} icon={icon} isActive={isActive} />
          );
        })}

        <div className="pt-2 mt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl group hover:bg-white/[0.03] transition-colors">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "rgba(249,115,22,0.15)" }}
            >
              <span className="font-body text-[11px] font-bold" style={{ color: "#F97316" }}>
                {initials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-xs font-medium text-white/75 truncate">
                {user?.full_name || "Demo Trader"}
              </p>
              <p className="font-body text-[11px] text-white/30 truncate">
                {user?.email || "demo@tradecore.app"}
              </p>
            </div>
            <button
              onClick={signOut}
              className="transition-all opacity-0 group-hover:opacity-60 hover:!opacity-100 text-white/50"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
