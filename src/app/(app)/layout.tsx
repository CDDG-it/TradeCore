import { TopNav } from "@/components/layout/top-nav";
import { BottomNav } from "@/components/layout/mobile-nav";
import { WarmReads } from "@/components/layout/warm-reads";
import { TransitionLayout } from "@/components/layout/transition-layout";
import { AccessProvider } from "@/components/access/access-provider";
import { resolveAccess } from "@/lib/access/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const access = await resolveAccess();
  return (
    <div className="relative min-h-screen overflow-x-clip bg-background">
      <AccessProvider value={access}>
      {/* Full-width top navigation: no fixed left sidebar */}
      <TopNav />
      <WarmReads />

      {/* Main content fills the whole width beneath the bar. Tighter gutters
          and vertical padding on phones so content uses the full screen. */}
      <main className="relative z-10">
        {/* `app-shell` reserves room for the fixed phone primary bar.
            Section menus open from each page title and add no content row. */}
        <div className="app-shell mx-auto w-full max-w-[1700px] px-3 py-4 sm:px-6 sm:py-8 lg:px-10">
          <TransitionLayout>{children}</TransitionLayout>
        </div>
      </main>

      {/* Phone-only tab bar; desktop keeps the top nav it already has. */}
      <BottomNav />
      </AccessProvider>
    </div>
  );
}
