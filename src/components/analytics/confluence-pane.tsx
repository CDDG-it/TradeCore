"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Empty, Pane, Switch } from "@/components/gmi/pane";
import { formatR, type EdgeBucket } from "@/lib/journal/edge";
import { CONFLUENCE_MIN_SAMPLE, type ConfluencePair, type ConfluenceStat } from "@/lib/journal/confluence-stats";
import type { Drill } from "@/lib/journal/analytics-filter";
import { cn } from "@/lib/utils";
import { EASE, EdgeBars, EmptyPanel, RValue, segState, tradesLabel } from "./analytics-ui";

type View = "ranked" | "pairs" | "stack";
type Sort = "r" | "win" | "n";

const VIEWS: { key: View; label: string }[] = [
  { key: "ranked", label: "Ranked" },
  { key: "pairs", label: "Pairs" },
  { key: "stack", label: "Stack" },
];
const SORTS: { key: Sort; label: string }[] = [
  { key: "r", label: "Avg R" },
  { key: "win", label: "Win %" },
  { key: "n", label: "Trades" },
];

function Ranked({
  rows, pairs, sort, drill, onDrill,
}: {
  rows: ConfluenceStat[];
  pairs: ConfluencePair[];
  sort: Sort;
  drill: Drill;
  onDrill: (d: Partial<Drill>) => void;
}) {
  const reduce = useReducedMotion();
  const sorted = useMemo(() => {
    const by = { r: (c: ConfluenceStat) => c.expectancy, win: (c: ConfluenceStat) => c.winRate, n: (c: ConfluenceStat) => c.trades }[sort];
    return [...rows].sort((a, b) => (a.thin !== b.thin ? Number(a.thin) - Number(b.thin) : by(b) - by(a)));
  }, [rows, sort]);

  if (rows.length === 0) return <EmptyPanel>No confluences logged on these trades.</EmptyPanel>;

  return (
    <div className="space-y-0.5">
      <div className="grid grid-cols-[minmax(0,1fr)_5.5rem_3.75rem_1.75rem] gap-2.5 px-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span>Confluence</span>
        <span>Win rate</span>
        <span className="text-right">Avg R</span>
        <span className="text-right">n</span>
      </div>
      {sorted.map((c, i) => {
        const key = c.name.toLowerCase();
        const state = segState(drill.confluence, key);
        const partners = pairs
          .filter((p) => p.names.some((n) => n.toLowerCase() === key) && !p.thin)
          .slice(0, 2);
        return (
          <motion.div
            key={key}
            layout={!reduce}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <Tooltip>
              <TooltipTrigger
                onClick={() => onDrill({ confluence: state === "on" ? undefined : key })}
                className={cn(
                  "grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_5.5rem_3.75rem_1.75rem] items-center gap-2.5 rounded-md px-1.5 py-[5px] text-left text-xs transition-[background-color,opacity] duration-200 hover:bg-muted/40 active:scale-[.99] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
                  state === "on" && "bg-primary/10 ring-1 ring-primary/50",
                  state === "off" && "opacity-45"
                )}
              >
                <span className={cn("truncate font-medium", c.thin && "text-muted-foreground")}>{c.name}</span>
                <span className="flex items-center gap-1.5">
                  <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted/30">
                    <motion.span
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ background: c.thin ? "var(--muted-foreground)" : "var(--ice)", opacity: c.thin ? 0.35 : 0.85 }}
                      initial={reduce ? false : { width: 0 }}
                      animate={{ width: `${c.winRate}%` }}
                      transition={{ duration: 0.6, delay: reduce ? 0 : i * 0.03, ease: EASE }}
                    />
                  </span>
                  <span className="w-7 text-right text-[10px] tabular-nums text-muted-foreground">{c.winRate}%</span>
                </span>
                <span className="text-right"><RValue r={c.expectancy} thin={c.thin} /></span>
                <span className="text-right text-[10px] tabular-nums text-muted-foreground/70">{c.trades}</span>
              </TooltipTrigger>
              <TooltipContent className="max-w-[260px] text-left">
                <div className="space-y-0.5">
                  <p className="font-semibold">{c.name}</p>
                  <p>{formatR(c.expectancy)} per trade · {tradesLabel(c.trades)}</p>
                  <p className="opacity-80">{c.wins}W / {c.losses}L · {formatR(c.totalR, 1)} total</p>
                  {partners.length > 0 && (
                    <p className="opacity-80">
                      Best with: {partners.map((p) => `${p.names.find((n) => n.toLowerCase() !== key)} (${formatR(p.expectancy)})`).join(", ")}
                    </p>
                  )}
                  {c.thin && <p className="opacity-80">Thin sample: not a conclusion yet</p>}
                </div>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        );
      })}
    </div>
  );
}

export function ConfluencePane({
  index, className, confluences, pairs, stack, drill, onDrill,
}: {
  index: string;
  className?: string;
  confluences: ConfluenceStat[];
  pairs: ConfluencePair[];
  stack: EdgeBucket[];
  drill: Drill;
  onDrill: (d: Partial<Drill>) => void;
}) {
  const [view, setView] = useState<View>("ranked");
  const [sort, setSort] = useState<Sort>("r");
  // Pairs come in at a lower bar for the hover hints; the list itself only shows real samples.
  const solidPairs = pairs.filter((p) => p.trades >= CONFLUENCE_MIN_SAMPLE).slice(0, 8);
  const top = confluences.find((c) => !c.thin);

  return (
    <Pane
      index={index}
      label="Confluences that pay"
      className={className}
      bodyClassName="flex flex-col p-3"
      right={<Switch options={VIEWS} value={view} onChange={setView} />}
    >
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="min-w-0 truncate">
          {view === "ranked" && (top ? <>Top: <b className="text-foreground">{top.name}</b> <RValue r={top.expectancy} /></> : "Win rate (cyan) and R per trade")}
          {view === "pairs" && "Two confluences together, scored as one setup"}
          {view === "stack" && "Does waiting for more reasons pay?"}
        </span>
        {view === "ranked" && <Switch options={SORTS} value={sort} onChange={setSort} />}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={view}
          className="min-h-0 flex-1 overflow-y-auto pr-0.5"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: EASE }}
        >
          {view === "ranked" && <Ranked rows={confluences} pairs={pairs} sort={sort} drill={drill} onDrill={onDrill} />}
          {view === "pairs" &&
            (solidPairs.length ? (
              <EdgeBars buckets={solidPairs} labelWidth="minmax(0,11rem)" />
            ) : (
              <Empty label="No pairs yet" hint="A pair needs 5 trades together before it counts." />
            ))}
          {view === "stack" && <EdgeBars buckets={stack} labelWidth="7rem" />}
        </motion.div>
      </AnimatePresence>
    </Pane>
  );
}
