"use client";

/**
 * POSITIONING & FLOW — objective positioning and flow.
 *
 * Reuses the app's live CFTC COT panel (commercial vs non-commercial net
 * positioning, weekly). ETF creation flow isn't available on the current free
 * sources, so it is marked unavailable rather than estimated.
 *
 * Options analytics are deliberately not surfaced here.
 */
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

      <Panel title="ETF flow">
        <Unavailable
          label="Data unavailable"
          hint="Reliable QQQ / SPY / IWM creation & redemption flow isn't available on the current free sources. Add a flow provider to enable this."
        />
      </Panel>
    </div>
  );
}
