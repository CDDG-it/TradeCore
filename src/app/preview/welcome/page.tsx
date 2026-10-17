import { notFound } from "next/navigation";
import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome";

/** Development-only pinned view of the dashboard welcome intro for design review. */
export const dynamic = "force-dynamic";

export default function PreviewWelcomePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="min-h-screen bg-background">
      <DashboardWelcome firstName="Collin" />
    </main>
  );
}
