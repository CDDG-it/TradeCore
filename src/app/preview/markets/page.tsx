import { notFound } from "next/navigation";
import { PreviewMarkets } from "./preview-markets";

/**
 * Development only: the real Global Markets desk on live public market data,
 * viewable without a Supabase session. The middleware lets `/preview/*`
 * through outside production; this guard makes the route a 404 there anyway.
 */
export const dynamic = "force-dynamic";

export default function PreviewMarketsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <PreviewMarkets />;
}
