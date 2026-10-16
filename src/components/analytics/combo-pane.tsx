"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Pane, Switch } from "@/components/gmi/pane";
import { formatR, type EdgeBucket } from "@/lib/journal/edge";
import { CONFLUENCE_MIN_SAMPLE, type ConfluencePair } from "@/lib/journal/confluence-stats";
import { sameKeys, type Drill } from "@/lib/journal/analytics-filter";
import { EASE, EdgeBars } from "./analytics-ui";

type View = "pairs" | "stack";
const VIEWS: { key: View; label: string }[] = [
  { key: "pairs", label: "Pairs" },
  { key: "stack", label: "Stack" },
];

/** The one-line answer for the stack: does waiting for more reasons pay? */
function stackLine(stack: EdgeBucket[]): string {
  const solid = stack.filter((b) => !b.thin && b.trades > 0);
  if (solid.length < 2) return "R per trade by how many confluences a trade had.";
  const best = [...solid].sort((a, b) => b.expectancy - a.expectancy)[0];
  return `Best: ${best.label.toLowerCase()}, at ${formatR(best.expectancy)} per trade.`;
}

/** Confluences taken together: pairs as one setup, and how many reasons a trade had. Ranked, best first. */
export function ComboPane({
  index, className, pairs, stack, drill, onDrill,
}: {
  index: string;
  className?: string;
  pairs: ConfluencePair[];
  stack: EdgeBucket[];
  drill: Drill;
  onDrill: (d: Partial<Drill>) => void;
}) {
  const [view, setView] = useState<View>("pairs");
  const ranked = pairs
    .filter((p) => p.trades >= CONFLUENCE_MIN_SAMPLE)
    .sort((a, b) => b.expectancy - a.expectancy)
    .slice(0, 8);
  const selectedPair = ranked.find((p) => sameKeys(drill.confluence, p.names.map((n) => n.toLowerCase())))?.key;
  const rankedStack = [...stack].filter((b) => b.trades > 0).sort((a, b) => b.expectancy - a.expectancy);

  return (
    <Pane
      index={index}
      label="Pairs & stack"
      className={className}
      bodyClassName="flex flex-col p-3"
      right={<Switch options={VIEWS} value={view} onChange={setView} />}
    >
      <p className="mb-2 shrink-0 text-xs text-muted-foreground">
        {view === "pairs"
          ? ranked[0]
            ? `${ranked[0].names.join(" + ")} is your strongest combination.`
            : "Two confluences taken together, scored as one setup."
          : stackLine(stack)}
      </p>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={view}
          className="min-h-0 flex-1 overflow-y-auto pr-0.5"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: EASE }}
        >
          {view === "pairs" ? (
            <EdgeBars
              buckets={ranked}
              labelWidth="minmax(0,13rem)"
              selected={selectedPair}
              onSelect={(b) => {
                const p = ranked.find((x) => x.key === b.key);
                if (!p) return;
                onDrill({ confluence: selectedPair === b.key ? undefined : p.names.map((n) => n.toLowerCase()) });
              }}
              emptyLabel="No pair has 5 trades together yet."
            />
          ) : (
            <EdgeBars buckets={rankedStack} labelWidth="minmax(0,8rem)" collapseThin />
          )}
        </motion.div>
      </AnimatePresence>
    </Pane>
  );
}
