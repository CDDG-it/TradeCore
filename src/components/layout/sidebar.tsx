"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  LineChart,
  BarChart2,
  Wallet,
  Settings,
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";


const navGroups = [
  {
    label: null,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, highlight: true },
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
          ? "bg-sidebar-accent text-sidebar-foreground"
          : "text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 hover:scale-[1.03] hover:shadow-sm"
      )}
    >
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-4 rounded-r-full"
          style={{ background: "#F97316" }}
        />
      )}
      <Icon
        className={cn("w-[15px] h-[15px] shrink-0 transition-colors", !isActive && "group-hover/nav:text-[#F97316]")}
        style={
          isActive
            ? { color: "#F97316" }
            : highlight
            ? { color: "rgba(249,115,22,0.55)" }
            : undefined
        }
      />
      <span className={cn(isActive ? "text-sidebar-foreground" : "", !isActive && "group-hover/nav:text-[#F97316]")}>{label}</span>
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

  const displayName: string = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Trader";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-60 flex flex-col z-40 bg-sidebar border-r border-sidebar-border"
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-5 shrink-0 border-b border-sidebar-border">
        <Link href="/"
          className="font-black text-base tracking-tight leading-none hover:opacity-80 transition-opacity"
          style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif" }}>
          <span className="text-sidebar-foreground">Trade</span>
          <span style={{ background: "linear-gradient(90deg,#F97316,#FBBF24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>CORE</span>
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {navGroups.map((group) => (
          <div key={group.label ?? "primary"}>
            {group.label && (
              <p className="font-body text-[9px] font-semibold uppercase tracking-[0.14em] px-3 mb-2 text-sidebar-foreground/30">
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
      <div className="px-3 pb-3 space-y-0.5 pt-3 shrink-0 border-t border-sidebar-border">
        {bottomItems.map(({ href, label, icon }) => {
          const isActive = pathname === href;
          return (
            <NavItem key={href} href={href} label={label} icon={icon} isActive={isActive} />
          );
        })}

        <div className="pt-2 mt-1 border-t border-sidebar-border">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl group hover:bg-sidebar-accent/60 transition-colors">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "rgba(249,115,22,0.15)" }}
            >
              <span className="font-body text-[11px] font-bold" style={{ color: "#F97316" }}>
                {initials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-xs font-medium text-sidebar-foreground/75 truncate">
                {displayName}
              </p>
              <p className="font-body text-[11px] text-sidebar-foreground/35 truncate">
                {user?.email || ""}
              </p>
            </div>
            <button
              onClick={signOut}
              className="transition-all opacity-0 group-hover:opacity-60 hover:!opacity-100 text-sidebar-foreground/50"
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
