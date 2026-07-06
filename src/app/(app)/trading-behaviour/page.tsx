import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { TradingRulesEditor } from "@/components/habits/trading-rules";
import { ConfluencesEditor } from "@/components/habits/confluences-editor";

export const metadata: Metadata = {
  title: "Trading Behaviour · Tradecore",
};

export default function TradingBehaviourPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        badge="Mindset"
        title="Trading Behaviour"
        subtitle="Manage the rules and confluences that guide how you trade"
      />
      <PageWrapper>
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <TradingRulesEditor />
          <ConfluencesEditor />
        </div>
      </PageWrapper>
    </div>
  );
}
