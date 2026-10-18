import { notFound } from "next/navigation";
import { PreviewWeeklyReview } from "./preview-weekly-review";

export const dynamic = "force-dynamic";

export default function PreviewWeeklyReviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <PreviewWeeklyReview />;
}
