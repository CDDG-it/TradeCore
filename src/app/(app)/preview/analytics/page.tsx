import { notFound } from "next/navigation";
import { PreviewAnalytics } from "./preview-analytics";

/**
 * Development only: the analytics desk on a deterministic sample journal, so
 * it can be worked on without a Supabase session. The middleware lets
 * `/preview/*` through outside production; this guard makes sure the route is
 * a 404 there even if that ever changes.
 */
export const dynamic = "force-dynamic";

export default function PreviewAnalyticsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <PreviewAnalytics />;
}
