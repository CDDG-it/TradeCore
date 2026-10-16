import { notFound } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { sampleDashboardData } from "@/lib/dashboard/sample";

/**
 * Development only: the dashboard on the sample week in the app shell's frame,
 * viewable without a Supabase session. `/preview/dashboard` sits inside the
 * auth-gated (app) layout, so it cannot render signed out; this one can. The
 * middleware lets `/preview/*` through outside production; this guard makes
 * the route a 404 there anyway.
 */
export const dynamic = "force-dynamic";

export default function PreviewDeskPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="min-h-screen bg-background">
      <div aria-hidden className="h-[52px] border-b border-border/40" />
      <div className="mx-auto w-full max-w-[1700px] px-3 py-4 sm:px-6 sm:py-8 lg:px-10">
        <DashboardClient data={sampleDashboardData(new Date())} />
      </div>
    </div>
  );
}
