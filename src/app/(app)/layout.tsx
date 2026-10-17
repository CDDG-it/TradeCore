import { TopNav } from "@/components/layout/top-nav";
import { BottomNav } from "@/components/layout/mobile-nav";
import { WarmReads } from "@/components/layout/warm-reads";
import { TransitionLayout } from "@/components/layout/transition-layout";
import { AccessProvider } from "@/components/access/access-provider";
import { resolveAccess } from "@/lib/access/server";
import { AppWelcome } from "@/components/dashboard/dashboard-welcome";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const access = await resolveAccess(user);
  const fullName = typeof user.user_metadata?.full_name === "string"
    ? user.user_metadata.full_name
    : user.email?.split("@")[0] ?? "";
  const firstName = fullName.trim().split(/\s+/)[0] || null;
  return (
    <div
      className="relative min-h-screen overflow-x-clip bg-background"
    >
      <AccessProvider value={access}>
      {/* Full-width top navigation: no fixed left sidebar */}
      <TopNav />
      <WarmReads />
      <AppWelcome firstName={firstName} />

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
