"use client";

import { useState } from "react";
import Link from "next/link";
import type { CleanVsBroken, RuleStat } from "@/lib/journal/rule-stats";
import { cn } from "@/lib/utils";
import { EmptyPanel, GLOSSARY, MetricLabel, Panel, RValue, Section, ShowMore, ThinTag } from "./analytics-ui";

const tradesLabel = (n: number) => `${n} trade${n === 1 ? "" : "s"}`;
const VISIBLE_ROWS = 6;

/** Cost is a loss when positive, so it is shown as a negative R in red. */
function CostValue({ cost, thin, className }: { cost: number | null; thin: boolean; className?: string }) {
  if (cost === null) return <span className="text-muted-foreground/60">–</span>;
  return <RValue r={-cost} thin={thin} className={className} />;
}

function CleanVsBrokenPanel({ data }: { data: CleanVsBroken }) {
  const sides = [
    { label: "All rules kept", b: data.clean },
    { label: "A rule broken", b: data.broken },
  ];
  return (
    <Panel
      title="Clean vs broken"
      info="R per trade on trades where you kept every rule, against trades where you broke at least one. The difference is what your rulebook is worth per trade. Needs 5+ trades on each side."
    >
      <div className="grid grid-cols-2 gap-2">
        {sides.map(({ label, b }) => (
          <div key={label} className="rounded-xl border border-border/40 bg-muted/15 px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="truncate">{label}</span>
              {b.thin && b.trades > 0 && <ThinTag />}
            </p>
            <p className="mt-1 text-xl font-black leading-none">
              {b.trades ? <RValue r={b.expectancy} thin={b.thin} /> : <span className="text-muted-foreground/50">–</span>}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">per trade · {tradesLabel(b.trades)}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {data.gap !== null ? (
          <>
            Keeping your rules is worth <RValue r={data.gap} /> per trade
            {data.rGivenUp !== null && data.rGivenUp > 0 && (
              <>
                {" "}— about <b className="text-foreground">{data.rGivenUp.toFixed(1)}R</b> left on the table this period
              </>
            )}
            .
          </>
        ) : (
          "Not enough clean and broken trades yet to compare."
        )}
        {data.unassessed > 0 && ` ${tradesLabel(data.unassessed)} without rule checks left out.`}
      </p>
    </Panel>
  );
}

function RuleTable({ rows }: { rows: RuleStat[] }) {
  const [open, setOpen] = useState(false);
  const shown = open ? rows : rows.slice(0, VISIBLE_ROWS);
  const cols = "md:grid-cols-[minmax(0,1fr)_4.5rem_4rem_4rem_4.5rem_4.5rem]";
  return (
    <div>
      <div className="divide-y divide-border/40">
        <div className={cn("hidden gap-3 pb-1.5 md:grid", cols)}>
          <MetricLabel>Rule</MetricLabel>
          <MetricLabel className="justify-center" info={GLOSSARY.breakRate}>Broken</MetricLabel>
          <MetricLabel className="justify-end" info="Your average R per trade on trades where you kept this rule.">Kept</MetricLabel>
          <MetricLabel className="justify-end" info="Your average R per trade on trades where you broke this rule.">Broke</MetricLabel>
          <MetricLabel className="justify-end" info={GLOSSARY.cost}>/ breach</MetricLabel>
          <MetricLabel className="justify-end" info={GLOSSARY.totalCost}>Total</MetricLabel>
        </div>
        {shown.map((r) => (
          <div key={r.label} className={cn("grid grid-cols-3 gap-x-3 gap-y-1 py-2 text-[13px] md:items-center", cols)}>
            <span className={cn("col-span-3 flex min-w-0 items-center gap-2 font-medium md:col-span-1", r.thin && "text-muted-foreground")}>
              <span className="truncate" title={r.label}>{r.label}</span>
              {r.thin && <ThinTag />}
            </span>
            <span className="tabular-nums text-muted-foreground md:text-center">
              {r.broken}/{r.evaluated}
              <span
                className={cn(
                  "ml-1 text-[11px] font-semibold",
                  r.thin ? "" : r.breakRate >= 40 ? "text-destructive" : r.breakRate >= 20 ? "text-warning" : "text-success"
                )}
              >
                {r.breakRate}%
              </span>
            </span>
            <span className="hidden text-right md:block">
              {r.rKept === null ? <span className="text-muted-foreground/60">–</span> : <RValue r={r.rKept} thin={r.thin} className="font-semibold" />}
            </span>
            <span className="hidden text-right md:block">
              {r.rBroken === null ? <span className="text-muted-foreground/60">–</span> : <RValue r={r.rBroken} thin={r.thin} className="font-semibold" />}
            </span>
            <span className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground md:hidden">Breach </span>
              <CostValue cost={r.cost} thin={r.thin} className="font-semibold" />
            </span>
            <span className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground md:hidden">Total </span>
              <CostValue cost={r.totalCost} thin={r.thin} />
            </span>
          </div>
        ))}
      </div>
      <ShowMore hidden={rows.length - VISIBLE_ROWS} open={open} onToggle={() => setOpen((o) => !o)} />
    </div>
  );
}

export function RuleSection({ rules, clean }: { rules: RuleStat[]; clean: CleanVsBroken }) {
  const costliest = rules.find((r) => !r.thin && r.totalCost !== null && r.totalCost > 0);
  const mostBroken = [...rules].filter((r) => !r.thin).sort((a, b) => b.breakRate - a.breakRate)[0];

  const takeaway = costliest ? (
    <>
      <b className="text-foreground">{costliest.label}</b> costs you most: <RValue r={-(costliest.totalCost ?? 0)} digits={1} /> in
      total, <RValue r={-(costliest.cost ?? 0)} /> per breach.
    </>
  ) : mostBroken && mostBroken.broken > 0 ? (
    <>
      You break <b className="text-foreground">{mostBroken.label}</b> most often, on {mostBroken.breakRate}% of trades where it applies.
    </>
  ) : null;

  return (
    <Section
      title="Rule breakdown"
      explainer="What your own rules are worth in R. For every rule, trades where you kept it are compared with trades where you broke it; the difference is what a breach costs. Rules marked not applicable are left out. A positive number on a rule would mean you did better breaking it: worth checking whether the rule fits how you trade."
      takeaway={takeaway}
    >
      <div className="grid gap-3 lg:grid-cols-[1fr_1.7fr]">
        <CleanVsBrokenPanel data={clean} />
        <Panel title="Per rule" info="Sorted by total cost: the rule at the top has taken the most R from you.">
          {rules.length ? (
            <RuleTable rows={rules} />
          ) : (
            <EmptyPanel>
              <span>
                No rules checked this period. Set them in{" "}
                <Link href="/psychological-edge" className="font-medium text-primary hover:underline">My Edge</Link> and mark them
                when you log a trade.
              </span>
            </EmptyPanel>
          )}
        </Panel>
      </div>
    </Section>
  );
}
