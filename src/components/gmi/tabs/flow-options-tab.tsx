"use client";

/**
 * FLOW & OPTIONS — objective positioning and flow. Reuses the app's live CFTC
 * COT panel (commercial vs non-commercial net positioning, weekly). ETF creation
 * flow and a realtime options/GEX feed aren't available on the current free
 * sources, so those are marked unavailable rather than estimated. The dedicated
 * Option Flow page holds the delayed CBOE option analytics.
 */
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CotFlow } from "@/components/cot/cot-flow";
import { Panel, Unavailable } from "../panel";

export function FlowOptionsTab() {
  return (
    <div className="space-y-4">
      <Panel title="Positioning — CFTC COT (weekly)">
        <p className="mb-3 text-[11px] text-muted-foreground">
          Commercial vs. non-commercial net positioning and its weekly change, straight from the CFTC. Positioning is
          weekly (Tuesday data, Friday release) — never realtime.
        </p>
        <CotFlow />
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Options">
          <Unavailable
            label="Delayed options on the Option Flow tab"
            hint="Live call/put volume, put-call ratio, OI and IV are served on the Option Flow tab (delayed CBOE). Gamma exposure needs a paid provider."
          />
          {/* Straight to the sibling subtab — going via /option-flow would just
              redirect back into this same page. */}
          <Link
            href="/news-city?tab=option-flow"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
          >
            Open Option Flow <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Panel>

        <Panel title="ETF flow">
          <Unavailable
            label="Data unavailable"
            hint="Reliable QQQ / SPY / IWM creation & redemption flow isn't available on the current free sources. Add a flow provider to enable this."
          />
        </Panel>
      </div>
    </div>
  );
}
