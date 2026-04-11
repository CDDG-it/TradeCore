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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/logo";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/analysis", label: "Analysis", icon: LineChart },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/habits", label: "Habits", icon: CheckSquare },
  { href: "/news", label: "News", icon: Newspaper },
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
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
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
          : "text-sidebar-foreground/40 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
      )}
    >
      {/* Active indicator bar */}
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
          style={{ background: "oklch(0.74 0.13 82)" }}
        />
      )}
      <Icon
        className={cn(
          "w-4 h-4 shrink-0 transition-colors",
          isActive ? "text-sidebar-primary" : ""
        )}
      />
      <span className={isActive ? "text-sidebar-foreground" : ""}>{label}</span>
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
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <div key={href} className="relative">
              <NavItem href={href} label={label} icon={icon} isActive={isActive} />
            </div>
          );
        })}
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

        {/* User row */}
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
                {user?.email || "demo@tradinghub.app"}
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
