"use client";

import { useState } from "react";
import { FuturesTab } from "./futures-tab";
import { MarketsTab } from "./markets-tab";

type MarketsView = "futures" | "macro";

export function CombinedMarketsTab() {
  const [view, setView] = useState<MarketsView>("futures");
  return (
    <div className="flex min-h-full flex-col gap-2 lg:h-full lg:min-h-0">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/50 bg-card/45 p-1.5 pl-3">
        <p className="hidden text-[11px] font-semibold uppercase tracking-[.14em] text-foreground/55 md:block">{view === "futures" ? "contracts, price action and cross-asset behaviour" : "yields, rates, liquidity, FX and volatility"}</p>
        <div className="flex items-center gap-1 rounded-xl bg-background/35 p-1" role="group" aria-label="Markets view">
          <button type="button" aria-pressed={view === "futures"} onClick={() => setView("futures")} className={`press rounded-lg px-3 py-1.5 text-[11px] font-semibold ${view === "futures" ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/60 hover:text-foreground"}`}>Futures</button>
          <button type="button" aria-pressed={view === "macro"} onClick={() => setView("macro")} className={`press rounded-lg px-3 py-1.5 text-[11px] font-semibold ${view === "macro" ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/60 hover:text-foreground"}`}>Macro &amp; rates</button>
        </div>
      </div>
      <div className="min-h-0 flex-1">{view === "futures" ? <FuturesTab /> : <MarketsTab />}</div>
    </div>
  );
}
