import { notFound } from "next/navigation";
import { TradeProfileTab } from "@/components/trade-profile/trade-profile-tab";

/**
 * Development only: My Trade Profile on the in-memory demo traders, outside the
 * signed-in layout (the (app) preview at /preview/trade-profile needs a session
 * for its layout), in the same viewport-high frame the Therapist gives it.
 */
export const dynamic = "force-dynamic";

export default function PreviewMyTradeProfilePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="h-dvh bg-background p-4 sm:p-6">
      <div className="mx-auto flex h-full max-w-[1400px] flex-col gap-3">
        <h1 className="shrink-0 font-heading text-lg font-bold leading-none tracking-tight text-foreground md:text-xl">MC Trade Therapist · My Trade Profile</h1>
        <div className="min-h-0 flex-1">
          <TradeProfileTab demoOnly />
        </div>
      </div>
    </main>
  );
}
