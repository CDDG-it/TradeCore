"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FuturesTab } from "./futures-tab";
import { MarketsTab } from "./markets-tab";

type MarketsView = "futures" | "macro";

export function CombinedMarketsTab() {
  const [view, setView] = useState<MarketsView>("futures");
  return (
    <div className="flex min-h-full flex-col gap-2 lg:h-full lg:min-h-0">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/50 bg-card/45 p-1.5 pl-3">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p key={view} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }} className="hidden text-[11px] font-semibold uppercase tracking-[.14em] text-foreground/55 md:block">
            {view === "futures" ? "contracts, price action and cross-asset behaviour" : "yields, rates, liquidity, FX and volatility"}
          </motion.p>
        </AnimatePresence>
        <div className="flex items-center gap-1 rounded-xl bg-background/35 p-1" role="group" aria-label="Markets view">
          {([["futures", "Futures"], ["macro", "Macro & rates"]] as const).map(([key, label]) => (
            <motion.button key={key} type="button" aria-pressed={view === key} onClick={() => setView(key)} whileTap={{ scale: 0.95 }}
              className={`relative rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors duration-200 ${view === key ? "text-primary-foreground" : "text-foreground/60 hover:text-foreground"}`}>
              {view === key && <motion.span layoutId="markets-view" className="absolute inset-0 rounded-lg bg-primary shadow-sm" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
              <span className="relative">{label}</span>
            </motion.button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={view} initial={{ opacity: 0, x: view === "futures" ? -12 : 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: view === "futures" ? 12 : -12 }} transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }} className="h-full">
            {view === "futures" ? <FuturesTab /> : <MarketsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
