import { notFound } from "next/navigation";
import { PreviewEdge } from "@/app/(app)/preview/edge/preview-edge";

/**
 * Development only: the MC Mindscore page on sample data, outside the signed-in
 * layout, so its motion and interactions can be worked on without a session.
 * The (app) preview at /preview/edge needs a signed-in user for its layout.
 */
export const dynamic = "force-dynamic";

export default function PreviewMindscorePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <main className="min-h-dvh bg-background p-4 sm:p-6"><PreviewEdge initialTab="mindscore" /></main>;
}
