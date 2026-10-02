"use client";

import { useState } from "react";
import { formatR, round2, type EdgeBucket } from "@/lib/journal/edge";
import type { ConfluencePair, ConfluenceStat } from "@/lib/journal/confluence-stats";
import { cn } from "@/lib/utils";
import { BARS_INFO, BucketBars, EmptyPanel, GLOSSARY, MetricLabel, Panel, RValue, Section, ShowMore, ThinTag } from "./analytics-ui";

const VISIBLE_ROWS = 6;

const tradesLabel = (n: number) => `${n} trade${n === 1 ? "" : "s"}`;

function ConfluenceTable({ rows, baseline }: { rows: ConfluenceStat[]; baseline: number }) {
  const [open, setOpen] = useState(false);
  const shown = open ? rows : rows.slice(0, VISIBLE_ROWS);
  const cols = "md:grid-cols-[minmax(0,1fr)_3rem_3.5rem_4.75rem_4.75rem]";
  return (
    <div>
      <div className="divide-y divide-border/40">
        <div className={cn("hidden gap-3 pb-1.5 md:grid", cols)}>
          <MetricLabel>Confluence</MetricLabel>
          <MetricLabel className="justify-center">Trades</MetricLabel>
          <MetricLabel className="justify-end" info={GLOSSARY.winRate}>Win %</MetricLabel>
          <MetricLabel className="justify-end" info={GLOSSARY.rPerTrade}>R / trade</MetricLabel>
          <MetricLabel className="justify-end" info={GLOSSARY.vsAvg}>Vs avg</MetricLabel>
        </div>
        {shown.map((c) => {
          const delta = round2(c.expectancy - baseline);
          return (
            <div key={c.name} className={cn("grid grid-cols-3 gap-x-3 gap-y-1 py-2 text-[13px] md:items-center", cols)}>
              <span className={cn("col-span-3 flex min-w-0 items-center gap-2 font-medium md:col-span-1", c.thin && "text-muted-foreground")}>
                <span className="truncate">{c.name}</span>
                {c.thin && <ThinTag />}
              </span>
              <span className="tabular-nums text-muted-foreground md:text-center">
                <span className="text-[10px] uppercase tracking-wider md:hidden">Trades </span>
                {c.trades}
              </span>
              <span className="tabular-nums text-muted-foreground md:text-right">
                <span className="text-[10px] uppercase tracking-wider md:hidden">Win </span>
                {c.wins + c.losses ? `${c.winRate}%` : "–"}
              </span>
              <span className="text-right">
                <RValue r={c.expectancy} thin={c.thin} />
              </span>
              <span className="hidden text-right md:block">
                <RValue r={delta} thin={c.thin} className="font-semibold" />
              </span>
            </div>
          );
        })}
      </div>
      <ShowMore hidden={rows.length - VISIBLE_ROWS} open={open} onToggle={() => setOpen((o) => !o)} />
    </div>
  );
}

function PairList({ pairs }: { pairs: ConfluencePair[] }) {
  if (pairs.length === 0) {
    return (
      <EmptyPanel>
        No pair of confluences has appeared together on 5+ trades yet.
      </EmptyPanel>
    );
  }
  return (
    <ol className="space-y-1.5">
      {pairs.map((p, i) => (
        <li key={p.key} className="flex items-center gap-2.5 rounded-lg border border-border/40 bg-muted/15 px-2.5 py-1.5">
          <span className="w-4 shrink-0 text-xs font-bold tabular-nums text-muted-foreground/60">{i + 1}</span>
          <span className="min-w-0 flex-1 truncate text-xs">
            <span className="font-medium">{p.names[0]}</span>
            <span className="mx-1.5 text-muted-foreground/60">+</span>
            <span className="font-medium">{p.names[1]}</span>
            <span className="block text-[10px] text-muted-foreground">
              {tradesLabel(p.trades)}{p.winRate !== null && ` · ${p.winRate}% win rate`}
            </span>
          </span>
          <RValue r={p.expectancy} className="text-xs" />
        </li>
      ))}
    </ol>
  );
}

export function ConfluenceSection({
  baseline,
  confluences,
  stack,
  pairs,
}: {
  baseline: EdgeBucket;
  confluences: ConfluenceStat[];
  stack: EdgeBucket[];
  pairs: ConfluencePair[];
}) {
  const solid = confluences.filter((c) => !c.thin);
  const best = solid[0];
  const worst = solid.length > 1 ? solid[solid.length - 1] : null;

  const takeaway = best ? (
    <>
      <b>{best.name}</b> is your best-paying confluence at <RValue r={best.expectancy} /> per trade over{" "}
      {tradesLabel(best.trades)}
      {worst && worst.expectancy < baseline.expectancy && (
        <>
          . <b>{worst.name}</b> pays least at <RValue r={worst.expectancy} />, below your average of{" "}
          <RValue r={baseline.expectancy} />
        </>
      )}
      .
    </>
  ) : null;

  const solidStack = stack.filter((b) => !b.thin && b.trades > 0);
  const stackHint =
    solidStack.length >= 2
      ? (() => {
          const top = [...solidStack].sort((a, b) => b.expectancy - a.expectancy)[0];
          return `Best with ${top.label.toLowerCase()}: ${formatR(top.expectancy)} per trade.`;
        })()
      : undefined;

  return (
    <Section
      title="Confluence breakdown"
      explainer="Which of your own setups and reasons to enter actually make money. Ranked by R per trade, not win rate: a setup that wins less often with bigger winners beats one that wins often and barely pays. A trade with three confluences counts towards all three."
      takeaway={takeaway}
    >
      <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
        <Panel
          title="Per confluence"
          info={`R per trade for every trade tagged with this confluence. "Vs avg" compares it with your average trade (${formatR(baseline.expectancy)}).`}
        >
          {confluences.length ? (
            <ConfluenceTable rows={confluences} baseline={baseline.expectancy} />
          ) : (
            <EmptyPanel>No confluences logged this period. Tag your trades with the reasons you took them.</EmptyPanel>
          )}
        </Panel>

        <div className="grid gap-3">
          <Panel
            title="How many confluences"
            info={`Does waiting for more reasons to enter actually pay? ${BARS_INFO}`}
            hint={stackHint}
          >
            <BucketBars buckets={stack} />
          </Panel>
          <Panel title="Best combinations" info="Pairs of confluences that appeared on the same trade, scored together. Only pairs with 5 or more trades are shown.">
            <PairList pairs={pairs} />
          </Panel>
        </div>
      </div>
    </Section>
  );
}
