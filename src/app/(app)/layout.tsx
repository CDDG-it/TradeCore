import type { CSSProperties } from "react";
import { Inter } from "next/font/google";
import { TopNav } from "@/components/layout/top-nav";
import { BottomNav } from "@/components/layout/mobile-nav";
import { WarmReads } from "@/components/layout/warm-reads";
import { TransitionLayout } from "@/components/layout/transition-layout";
import { AppViewport } from "@/components/layout/app-viewport";
import { AccessProvider } from "@/components/access/access-provider";
import { resolveAccess } from "@/lib/access/server";

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

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const access = await resolveAccess();
  return (
    <div
      className={`${inter.variable} relative flex h-dvh min-h-0 flex-col overflow-hidden bg-background`}
      style={{
        // globals.css declares the font tokens with `@theme inline`, which bakes
        // their *values* straight into the utilities: `font-heading` compiles to
        // `font-family: var(--font-nunito)`, not `var(--font-heading)`. So the
        // base family vars are what has to be repointed for `font-heading` /
        // `font-sans` headings to follow; the token overrides cover the handful
        // of rules that read `var(--font-body)` / `var(--font-heading)` directly.
        "--font-barlow": "var(--font-inter)",
        "--font-nunito": "var(--font-inter)",
        "--font-body": "var(--font-inter)",
        "--font-sans": "var(--font-inter)",
        "--font-heading": "var(--font-inter)",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      } as CSSProperties}
    >
      <AccessProvider value={access}>
      {/* Full-width top navigation: no fixed left sidebar */}
      <TopNav />
      <WarmReads />

      {/* Main content fills the whole width beneath the bar. Tighter gutters
          and vertical padding on phones so content uses the full screen. */}
      <main className="relative z-10 min-h-0 flex-1 overflow-hidden">
        {/* `app-shell` reserves room for the fixed phone primary bar.
            Section menus open from each page title and add no content row. */}
        <div className="app-shell mx-auto h-full w-full max-w-[1700px] px-3 py-4 sm:px-6 sm:py-8 lg:px-10">
          <AppViewport><TransitionLayout>{children}</TransitionLayout></AppViewport>
        </div>
      </main>

      {/* Phone-only tab bar; desktop keeps the top nav it already has. */}
      <BottomNav />
      </AccessProvider>
    </div>
  );
}
