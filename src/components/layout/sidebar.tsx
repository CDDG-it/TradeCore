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
  CheckSquare,
  Compass,
  Brain,
  BookMarked,
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
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative",
        isActive
          ? "bg-sidebar-accent text-sidebar-foreground"
          : "text-sidebar-foreground/65 hover:text-sidebar-foreground/90 hover:bg-sidebar-accent/60"
      )}
    >
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
          style={{ background: "oklch(0.74 0.13 82)" }}
        />
      )}
      <Icon
        className={cn("w-4 h-4 shrink-0 transition-colors")}
        style={
          isActive
            ? { color: "oklch(0.74 0.13 82)" }
            : highlight
            ? { color: "oklch(0.72 0.14 220 / 0.70)" }
            : undefined
        }
      />
      <span style={isActive ? { color: "oklch(0.93 0.008 252)" } : undefined}>
        {label}
      </span>
      {highlight && !isActive && (
        <span
          className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{
            background: "oklch(0.72 0.14 220 / 0.15)",
            color: "oklch(0.72 0.14 220)",
          }}
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
        background: "var(--sidebar)",
        borderRight: "1px solid oklch(1 0 0 / 5%)",
      }}
    >
      {/* Logo */}
      <div
        className="h-14 flex items-center px-5 shrink-0"
        style={{ borderBottom: "1px solid oklch(1 0 0 / 5%)" }}
      >
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <Logo variant="dark" size={26} />
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
        {navGroups.map((group) => (
          <div key={group.label ?? "primary"}>
            {group.label && (
              <p
                className="text-[9px] font-bold uppercase tracking-widest px-3 mb-1.5"
                style={{ color: "oklch(0.88 0.008 252 / 40%)" }}
              >
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                const highlight = "highlight" in item ? item.highlight : false;
                return (
                  <div key={item.href} className="relative">
                    <NavItem
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      isActive={isActive}
                      highlight={highlight}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom nav + user */}
      <div
        className="px-3 pb-3 space-y-0.5 pt-3 shrink-0"
        style={{ borderTop: "1px solid oklch(1 0 0 / 5%)" }}
      >
        {bottomItems.map(({ href, label, icon }) => {
          const isActive = pathname === href;
          return (
            <div key={href} className="relative">
              <NavItem href={href} label={label} icon={icon} isActive={isActive} />
            </div>
          );
        })}

        <div
          className="pt-2 mt-1"
          style={{ borderTop: "1px solid oklch(1 0 0 / 5%)" }}
        >
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg group">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "oklch(0.74 0.13 82 / 18%)" }}
            >
              <span
                className="text-xs font-bold"
                style={{ color: "oklch(0.74 0.13 82)" }}
              >
                {initials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">
                {user?.full_name || "Demo Trader"}
              </p>
              <p
                className="text-xs truncate"
                style={{ color: "oklch(0.88 0.008 252 / 35%)" }}
              >
                {user?.email || "demo@tradecore.app"}
              </p>
            </div>
            <button
              onClick={signOut}
              className="transition-colors opacity-0 group-hover:opacity-100"
              style={{ color: "oklch(0.88 0.008 252 / 35%)" }}
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
