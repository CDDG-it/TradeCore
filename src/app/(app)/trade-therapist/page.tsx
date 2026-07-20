"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { PreTradeMirror } from "@/components/trade-therapist/pre-trade-mirror";
import { PostTrade5R } from "@/components/trade-therapist/post-trade-5r";

/**
 * MC Trade Therapist — a deterministic, data-driven behavioural coach. Every
 * message traces back to concrete numbers in the trader's own history; the
 * pattern engine is rule-based and explainable (src/lib/psych-edge/patterns.ts),
 * never an LLM. Two surfaces: the Pre-Trade Mirror (before a session) and the
 * Post-Trade 5R (after each closed trade).
 */
type TherapistTab = "mirror" | "post-trade";
const TABS: { key: TherapistTab; label: string; hint: string }[] = [
  { key: "mirror", label: "Pre-Trade Mirror", hint: "Before you trade" },
  { key: "post-trade", label: "Post-Trade 5R", hint: "After each trade" },
];

export default function TradeTherapistPage() {
  const [tab, setTab] = useState<TherapistTab>("mirror");

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (TABS.some((x) => x.key === t)) setTab(t as TherapistTab);
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
            MC Mindset Formula
          </p>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-foreground tracking-tight leading-[0.95]">
            MC Trade Therapist
          </h1>
        </div>

        <div className="flex w-full sm:w-fit rounded-lg border border-border/60 overflow-hidden">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex-1 sm:flex-none px-4 sm:px-5 py-2 text-sm font-semibold transition-colors",
                tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <PageWrapper>
        {tab === "mirror" ? <PreTradeMirror /> : <PostTrade5R />}
      </PageWrapper>
    </div>
  );
}
