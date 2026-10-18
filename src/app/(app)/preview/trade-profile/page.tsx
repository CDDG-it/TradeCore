import { notFound } from "next/navigation";
import { TradeProfileApp } from "@/components/trade-profile/app";
import { TradeProfileProvider } from "@/components/trade-profile/store";

/**
 * Development only: My Trade Profile on demo traders, held in memory, so the
 * page can be worked on without a Supabase session. The middleware lets
 * `/preview/*` through outside production; this guard makes the route a 404
 * there even if that ever changes.
 */
export const dynamic = "force-dynamic";

export default function PreviewTradeProfilePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <TradeProfileProvider demoOnly>
      <TradeProfileApp />
    </TradeProfileProvider>
  );
}
