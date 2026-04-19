import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">

      {/* ── Decorative editorial grid lines (desktop) ── */}
      <div className="pointer-events-none fixed inset-0 z-0 hidden lg:block" aria-hidden>
        <div className="absolute inset-y-0 w-px" style={{ left: "25%", background: "rgba(255,255,255,0.022)" }} />
        <div className="absolute inset-y-0 w-px" style={{ left: "50%", background: "rgba(255,255,255,0.030)" }} />
        <div className="absolute inset-y-0 w-px" style={{ left: "75%", background: "rgba(255,255,255,0.022)" }} />
      </div>

      {/* ── Ambient hero glow ── */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[280px] z-0" aria-hidden
        style={{ background: "radial-gradient(ellipse at top, rgba(249,115,22,0.055) 0%, transparent 70%)" }} />

      {/* Desktop sidebar */}
      <div className="hidden lg:block relative z-40">
        <Sidebar />
      </div>

      {/* Mobile header */}
      <MobileHeader />

      {/* Main content */}
      <main className="lg:pl-60 pt-14 lg:pt-0 min-h-screen relative z-10">
        <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto lg:mx-0">
          {children}
        </div>
      </main>
    </div>
  );
}
