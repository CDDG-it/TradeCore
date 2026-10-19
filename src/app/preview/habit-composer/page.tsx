import { notFound } from "next/navigation";
import { PreviewHabitComposer } from "./preview-habit-composer";

/**
 * Development only: the primary navigation (top rail and phone tab bar) and
 * the habit composer, outside the signed-in layout, so they can be worked on
 * without a session. Saving only waits a moment; nothing is stored.
 */
export const dynamic = "force-dynamic";

export default function PreviewHabitComposerPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <PreviewHabitComposer />;
}
