import { notFound } from "next/navigation";
import { PreviewEdge } from "./preview-edge";

/**
 * Development only: the Reviews, Commitments and Goals surfaces rendered on
 * sample data, so they can be worked on without a Supabase session. The
 * middleware lets `/preview/*` through outside production; this guard makes
 * sure the route is a 404 there even if that ever changes.
 */
export const dynamic = "force-dynamic";

export default function PreviewEdgePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <PreviewEdge />;
}
