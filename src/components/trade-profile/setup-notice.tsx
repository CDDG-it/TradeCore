"use client";

import { Database } from "lucide-react";
import { AccentPanel } from "@/components/ui/accent-panel";
import { copy } from "@/lib/trade-profile/content/copy";

/** Shown until sql/trade_profile.sql has been run: calm and specific about the one step left. */
export function SetupNotice() {
  return (
    <AccentPanel accent="cyan" eyebrow={copy.setup.eyebrow} title={copy.setup.title} subtitle={copy.setup.body}>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <code className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/40 px-2.5 py-1.5 text-xs">
          <Database className="size-3.5 text-ice" /> sql/trade_profile.sql
        </code>
      </div>
    </AccentPanel>
  );
}
