import { notFound } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { sampleDashboardData } from "@/lib/dashboard/sample";

/**
 * Development only: the real dashboard rendered with the sample week, so the
 * desk can be edited and viewed without a Supabase session. The middleware
 * lets `/preview/*` through outside production; this guard makes sure the
 * route is a 404 there even if that ever changes.
 */
export const dynamic = "force-dynamic";

export default function PreviewDashboardPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DashboardClient data={sampleDashboardData(new Date())} />;
}
