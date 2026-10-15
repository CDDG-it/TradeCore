"use client";

import { Suspense } from "react";
import { AccessProvider } from "@/components/access/access-provider";
import { MarketsDesk, loading } from "@/components/gmi/markets-desk";
import { PLANS } from "@/lib/plans";

// Point the desk's feeds at the preview data route instead of the signed-in API.
if (typeof window !== "undefined" && !(window as { __gmiPreview?: boolean }).__gmiPreview) {
  (window as { __gmiPreview?: boolean }).__gmiPreview = true;
  const original = window.fetch.bind(window);
  window.fetch = (input, init) => {
    if (typeof input === "string" && (input.startsWith("/api/gmi/") || input.startsWith("/api/cot"))) {
      return original(input.replace(/^\/api\//, "/preview/markets/data/"), init);
    }
    return original(input, init);
  };
}

export function PreviewMarkets() {
  return (
    <AccessProvider value={{ storedPlan: "pro", effectivePlan: "pro", entitlements: PLANS.pro.entitlements, launchOverride: false }}>
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-[1700px] px-3 py-4 sm:px-6 sm:py-8 lg:px-10">
          <Suspense fallback={loading()}><MarketsDesk basePath="/preview/markets" /></Suspense>
        </div>
      </div>
    </AccessProvider>
  );
}
