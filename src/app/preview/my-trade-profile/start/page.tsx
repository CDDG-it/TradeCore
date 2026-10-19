import { notFound } from "next/navigation";
import { PreviewStartProgram } from "./preview-start-program";

/**
 * Development only: My Trade Profile's Today as a trader without a goal sees
 * it (every demo trader has one, so the main preview never shows this state).
 */
export const dynamic = "force-dynamic";

export default function PreviewStartProgramPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <PreviewStartProgram />;
}
