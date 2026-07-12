import type { Metadata } from "next";
import { Brain } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";

export const metadata: Metadata = {
  title: "Psychological Edge · Tradecore",
};

export default function PsychologicalEdgePage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        badge="MC Mindset Formula"
        title="Psychological Edge"
        subtitle="Sharpen the mental side of your trading"
      />
      <PageWrapper>
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: "var(--card)", border: "1px solid var(--border)", borderStyle: "dashed" }}
        >
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: "oklch(0.70 0.12 183 / 0.12)" }}
          >
            <Brain className="h-6 w-6" style={{ color: "oklch(0.70 0.12 183)" }} />
          </div>
          <p className="text-sm font-semibold text-foreground">Coming soon</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This is where your psychological edge will live.
          </p>
        </div>
      </PageWrapper>
    </div>
  );
}
