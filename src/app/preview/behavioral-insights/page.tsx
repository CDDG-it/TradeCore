import { notFound } from "next/navigation";
import { PreviewBehavioralInsights } from "./preview-behavioral-insights";

export const dynamic = "force-dynamic";

export default function PreviewBehavioralInsightsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <PreviewBehavioralInsights />;
}
