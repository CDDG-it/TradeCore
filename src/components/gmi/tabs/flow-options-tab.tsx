"use client";

/**
 * FLOW & OPTIONS — objective positioning and flow, in one tab.
 *
 * Leads with the full Option Flow view (dealer positioning, session structure
 * and COT-driven weekly bias for NQ & GC, delayed CBOE), then the broader CFTC
 * COT browser covering every reported market. ETF creation flow isn't available
 * on the current free sources, so it is marked unavailable rather than
 * estimated.
 *
 * This tab used to be a stub that pointed at a separate Option Flow
 * destination; the two were merged so positioning lives in one place.
 */
import { CotFlow } from "@/components/cot/cot-flow";
import { OptionFlowView } from "@/components/option-flow/option-flow-view";
import { Panel, Unavailable } from "../panel";

export function FlowOptionsTab() {
  return (
    <div className="space-y-6">
      {/* Dealer positioning / zones / greeks / weekly bias for NQ & GC */}
      <OptionFlowView embedded />

      {/* Broader positioning across every CFTC-reported market */}
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
