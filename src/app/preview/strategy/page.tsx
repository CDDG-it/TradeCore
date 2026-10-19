import { notFound } from "next/navigation";
import { TradingRulesEditor } from "@/components/habits/trading-rules";
import { ConfluencesEditor } from "@/components/habits/confluences-editor";
import { MonteCarloSimulator } from "@/components/strategy/monte-carlo";

/**
 * Development only: the Strategy half of My Edge (rules, confluences and the
 * pass simulation) outside the signed-in layout, so its motion can be worked
 * on without a session. Without one the editors start empty and the
 * simulation runs on its defaults; saving fails, which shows the error state.
 */
export const dynamic = "force-dynamic";

export default function PreviewStrategyPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="min-h-dvh space-y-6 bg-background p-4 sm:p-6">
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-3 sm:gap-6 lg:grid-cols-2">
        <TradingRulesEditor />
        <ConfluencesEditor />
      </div>
      <MonteCarloSimulator />
    </main>
  );
}
