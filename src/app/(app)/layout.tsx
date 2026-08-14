import { TopNav } from "@/components/layout/top-nav";
import { TransitionLayout } from "@/components/layout/transition-layout";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Full-width top navigation — no fixed left sidebar */}
      <TopNav />

      {/* Main content fills the whole width beneath the bar. Tighter gutters
          and vertical padding on phones so content uses the full screen. */}
      <main className="relative z-10">
        <div className="mx-auto w-full max-w-[1700px] px-3 py-4 sm:px-6 sm:py-8 lg:px-10">
          <TransitionLayout>{children}</TransitionLayout>
        </div>
      </main>
    </div>
  );
}
