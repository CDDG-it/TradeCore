"use client";

import { formatR, round2, type EdgeBucket } from "@/lib/journal/edge";
import type { ConfluencePair, ConfluenceStat } from "@/lib/journal/confluence-stats";
import { cn } from "@/lib/utils";
import { BucketBars, EmptyPanel, GLOSSARY, MetricLabel, Panel, RValue, Section, ThinTag } from "./analytics-ui";

const tradesLabel = (n: number) => `${n} trade${n === 1 ? "" : "s"}`;

function ConfluenceTable({ rows, baseline }: { rows: ConfluenceStat[]; baseline: number }) {
  const cols = "md:grid-cols-[minmax(0,1fr)_4rem_4rem_5.5rem_5.5rem]";
  return (
    <div className="divide-y divide-border/40">
      <div className={cn("hidden gap-4 pb-2 md:grid", cols)}>
        <MetricLabel>Confluence</MetricLabel>
        <MetricLabel className="justify-center">Trades</MetricLabel>
        <MetricLabel className="justify-end" info={GLOSSARY.winRate}>Win %</MetricLabel>
        <MetricLabel className="justify-end" info={GLOSSARY.rPerTrade}>R / trade</MetricLabel>
        <MetricLabel className="justify-end" info={GLOSSARY.vsAvg}>Vs avg</MetricLabel>
      </div>
      {rows.map((c) => {
        const delta = round2(c.expectancy - baseline);
        return (
          <div key={c.name} className={cn("grid grid-cols-3 gap-x-4 gap-y-1.5 py-3 text-sm md:items-center", cols)}>
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
  );
}

function PairList({ pairs }: { pairs: ConfluencePair[] }) {
  if (pairs.length === 0) {
    return (
      <EmptyPanel>
        No pair of confluences has appeared together on 5 or more trades yet. Once it does, the best combinations show up here.
      </EmptyPanel>
    );
  }
  return (
    <ol className="space-y-2">
      {pairs.map((p, i) => (
        <li key={p.key} className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/15 px-3 py-2.5">
          <span className="w-4 shrink-0 text-xs font-bold tabular-nums text-muted-foreground/60">{i + 1}</span>
          <span className="min-w-0 flex-1 text-sm">
            <span className="font-medium">{p.names[0]}</span>
            <span className="mx-1.5 text-muted-foreground/60">+</span>
            <span className="font-medium">{p.names[1]}</span>
            <span className="block text-[11px] text-muted-foreground">
              {tradesLabel(p.trades)}{p.winRate !== null && ` · ${p.winRate}% win rate`}
            </span>
          </span>
          <RValue r={p.expectancy} className="text-sm" />
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
          return `Your best results come with ${top.label.toLowerCase()}: ${formatR(top.expectancy)} per trade.`;
        })()
      : "Does waiting for more reasons to enter actually pay? Each bar is R per trade for trades with that many confluences.";

  return (
    <Section
      title="Confluence breakdown"
      explainer="Which of your own setups and reasons to enter actually make money. Ranked by R per trade, not win rate: a setup that wins less often but with bigger winners beats one that wins often and barely pays. A trade with three confluences counts towards all three."
      takeaway={takeaway}
    >
      <Panel title="Per confluence" hint={`"Vs avg" compares each setup with your average trade (${formatR(baseline.expectancy)}).`}>
        {confluences.length ? (
          <ConfluenceTable rows={confluences} baseline={baseline.expectancy} />
        ) : (
          <EmptyPanel>No confluences logged in this selection. Tag your trades with the reasons you took them to see which ones pay.</EmptyPanel>
        )}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="How many confluences" hint={stackHint}>
          <BucketBars buckets={stack} />
        </Panel>
        <Panel title="Best combinations" hint="Pairs of confluences that appeared on the same trade, scored together.">
          <PairList pairs={pairs} />
        </Panel>
      </div>
    </Section>
  );
}
