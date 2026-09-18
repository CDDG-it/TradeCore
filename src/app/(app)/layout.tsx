import type { CSSProperties } from "react";
import { Inter } from "next/font/google";
import { TopNav } from "@/components/layout/top-nav";
import { BottomNav } from "@/components/layout/mobile-nav";
import { WarmReads } from "@/components/layout/warm-reads";
import { TransitionLayout } from "@/components/layout/transition-layout";

/**
 * The whole signed-in app wears the homepage typeface. Inter is the public
 * site's font (see `.marketing-page` in globals.css); loading it here rather
 * than in the root layout keeps it off the auth and public pages. The shell
 * redefines the app's font tokens for its subtree, so nav, headings and body
 * copy alike resolve to Inter without touching any page's markup.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    // `overflow-x-clip` rather than `-hidden`: hidden turns this wrapper into a
    // scroll container, which silently breaks every `position: sticky` inside it
    // (the top nav and the Global Markets header). Clip contains overflow the
    // same way without creating one.
    <div
      className={`${inter.variable} min-h-screen bg-background relative overflow-x-clip`}
      style={{
        "--font-body": "var(--font-inter)",
        "--font-sans": "var(--font-inter)",
        "--font-heading": "var(--font-inter)",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      } as CSSProperties}
    >
      {/* Full-width top navigation: no fixed left sidebar */}
      <TopNav />
      <WarmReads />

      {/* Main content fills the whole width beneath the bar. Tighter gutters
          and vertical padding on phones so content uses the full screen. */}
      <main className="relative z-10">
        {/* `app-shell` reserves room for the fixed phone tab bar (and a page's
            docked subnav strip). See globals.css. */}
        <div className="app-shell mx-auto w-full max-w-[1700px] px-3 py-4 sm:px-6 sm:py-8 lg:px-10">
          <TransitionLayout>{children}</TransitionLayout>
        </div>
      </main>

      {/* Phone-only tab bar; desktop keeps the top nav it already has. */}
      <BottomNav />
    </div>
  );
}
