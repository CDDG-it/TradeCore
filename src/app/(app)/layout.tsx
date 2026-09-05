import { TopNav } from "@/components/layout/top-nav";
import { BottomNav } from "@/components/layout/mobile-nav";
import { WarmReads } from "@/components/layout/warm-reads";
import { TransitionLayout } from "@/components/layout/transition-layout";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    // `overflow-x-clip` rather than `-hidden`: hidden turns this wrapper into a
    // scroll container, which silently breaks every `position: sticky` inside it
    // (the top nav and the Global Markets header). Clip contains overflow the
    // same way without creating one.
    <div className="min-h-screen bg-background relative overflow-x-clip">
      {/* Full-width top navigation — no fixed left sidebar */}
      <TopNav />
      <WarmReads />

      {/* Main content fills the whole width beneath the bar. Tighter gutters
          and vertical padding on phones so content uses the full screen. */}
      <main className="relative z-10">
        {/* `app-shell` reserves room for the fixed phone tab bar (and a page's
            docked subnav strip) — see globals.css. */}
        <div className="app-shell mx-auto w-full max-w-[1700px] px-3 py-4 sm:px-6 sm:py-8 lg:px-10">
          <TransitionLayout>{children}</TransitionLayout>
        </div>
      </main>

      {/* Phone-only tab bar; desktop keeps the top nav it already has. */}
      <BottomNav />
    </div>
  );
}
