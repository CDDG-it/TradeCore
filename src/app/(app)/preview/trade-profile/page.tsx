import { notFound } from "next/navigation";
import { TradeProfileTab } from "@/components/trade-profile/trade-profile-tab";

/**
 * Development only: My Trade Profile on demo traders, held in memory, inside
 * the same viewport-high frame the Therapist gives it, so it can be worked on
 * without a Supabase session. The middleware lets `/preview/*` through outside
 * production; this guard makes the route a 404 there even if that ever changes.
 */
export const dynamic = "force-dynamic";

export default function PreviewTradeProfilePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="flex h-[calc(100dvh-8.5rem)] min-h-[30rem] flex-col gap-3 sm:h-[calc(100dvh-9.5rem)] lg:h-[calc(100dvh-7.25rem)] lg:min-h-[35rem]">
      <h1 className="shrink-0 font-heading text-lg font-bold leading-none tracking-tight text-foreground md:text-xl">MC Trade Therapist · My Trade Profile</h1>
      <div className="min-h-0 flex-1">
        <TradeProfileTab demoOnly />
      </div>
    </div>
  );
}
