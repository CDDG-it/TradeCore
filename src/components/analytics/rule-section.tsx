"use client";

import Link from "next/link";
import type { CleanVsBroken, RuleStat } from "@/lib/journal/rule-stats";
import { cn } from "@/lib/utils";
import { EmptyPanel, GLOSSARY, MetricInfo, MetricLabel, Panel, RValue, Section, ThinTag } from "./analytics-ui";

const tradesLabel = (n: number) => `${n} trade${n === 1 ? "" : "s"}`;

/** Cost is a loss when positive, so it is shown as a negative R in red. */
function CostValue({ cost, thin, className }: { cost: number | null; thin: boolean; className?: string }) {
  if (cost === null) return <span className="text-muted-foreground/60">–</span>;
  return <RValue r={-cost} thin={thin} className={className} />;
}

function CleanVsBrokenCard({ data }: { data: CleanVsBroken }) {
  const sides = [
    { label: "All rules kept", b: data.clean },
    { label: "At least one rule broken", b: data.broken },
  ];
  return (
    <div className="grid gap-4 rounded-2xl border border-border/50 bg-card p-4 sm:p-5 md:grid-cols-[1fr_1fr_1.2fr] md:items-center">
      {sides.map(({ label, b }) => (
        <div key={label} className="rounded-xl border border-border/40 bg-muted/15 px-4 py-3">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
            {b.thin && b.trades > 0 && <ThinTag />}
          </p>
          <p className="mt-1.5 text-2xl font-black leading-none">
            {b.trades ? <RValue r={b.expectancy} thin={b.thin} /> : <span className="text-muted-foreground/50">–</span>}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">per trade · {tradesLabel(b.trades)}</p>
        </div>
      ))}
      <div className="px-1">
        {data.gap !== null ? (
          <>
            <p className="text-sm leading-relaxed text-foreground/90">
              Keeping your rules is worth <RValue r={data.gap} /> per trade.
            </p>
            {data.rGivenUp !== null && data.rGivenUp > 0 && (
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                Had your {tradesLabel(data.broken.trades)} with a broken rule earned like your clean ones, you would be about{" "}
                <b className="text-foreground">{data.rGivenUp.toFixed(1)}R</b> further.
              </p>
            )}
          </>
        ) : (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Needs at least 5 clean trades and 5 with a broken rule before the comparison means something.
          </p>
        )}
        {data.unassessed > 0 && (
          <p className="mt-2 text-[11px] text-muted-foreground/70">
            {tradesLabel(data.unassessed)} without any rule checked {data.unassessed === 1 ? "is" : "are"} left out.
          </p>
        )}
      </div>
    </div>
  );
}

function RuleTable({ rows }: { rows: RuleStat[] }) {
  const cols = "md:grid-cols-[minmax(0,1fr)_5rem_5rem_5rem_6rem_6rem]";
  return (
    <div className="divide-y divide-border/40">
      <div className={cn("hidden gap-4 pb-2 md:grid", cols)}>
        <MetricLabel>Rule</MetricLabel>
        <MetricLabel className="justify-center" info={GLOSSARY.breakRate}>Broken</MetricLabel>
        <MetricLabel className="justify-end" info="Your average R per trade on trades where you kept this rule.">Kept</MetricLabel>
        <MetricLabel className="justify-end" info="Your average R per trade on trades where you broke this rule.">Broken R</MetricLabel>
        <MetricLabel className="justify-end" info={GLOSSARY.cost}>Per breach</MetricLabel>
        <MetricLabel className="justify-end" info={GLOSSARY.totalCost}>Total cost</MetricLabel>
      </div>
      {rows.map((r) => (
        <div key={r.label} className={cn("grid grid-cols-2 gap-x-4 gap-y-1.5 py-3 text-sm md:items-center", cols)}>
          <span className={cn("col-span-2 flex min-w-0 items-center gap-2 font-medium md:col-span-1", r.thin && "text-muted-foreground")}>
            <span className="truncate" title={r.label}>{r.label}</span>
            {r.thin && <ThinTag />}
          </span>
          <span className="tabular-nums text-muted-foreground md:text-center">
            <span className="text-[10px] uppercase tracking-wider md:hidden">Broken </span>
            {r.broken}/{r.evaluated}
            <span
              className={cn(
                "ml-1.5 text-xs font-semibold",
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
          <span className="text-right md:text-right">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground md:hidden">Per breach </span>
            <CostValue cost={r.cost} thin={r.thin} className="font-semibold" />
          </span>
          <span className="col-span-2 text-right md:col-span-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground md:hidden">Total cost </span>
            <CostValue cost={r.totalCost} thin={r.thin} />
          </span>
        </div>
      ))}
    </div>
  );
}

export function RuleSection({ rules, clean }: { rules: RuleStat[]; clean: CleanVsBroken }) {
  const costliest = rules.find((r) => !r.thin && r.totalCost !== null && r.totalCost > 0);
  const mostBroken = [...rules].filter((r) => !r.thin).sort((a, b) => b.breakRate - a.breakRate)[0];

  const takeaway = costliest ? (
    <>
      <b>{costliest.label}</b> has cost you the most: <RValue r={-(costliest.totalCost ?? 0)} digits={1} /> in total, about{" "}
      <RValue r={-(costliest.cost ?? 0)} /> every time you broke it ({costliest.broken} of {costliest.evaluated} trades). That is the
      rule to protect first.
    </>
  ) : mostBroken && mostBroken.broken > 0 ? (
    <>
      You break <b>{mostBroken.label}</b> most often, on {mostBroken.breakRate}% of the trades where it applies.
    </>
  ) : null;

  return (
    <Section
      title="Rule breakdown"
      explainer="What your own rules are worth in R. For every rule we compare the trades where you kept it with the trades where you broke it. The difference is what a breach costs you. Rules marked not applicable on a trade are left out."
      takeaway={takeaway}
    >
      <CleanVsBrokenCard data={clean} />

      <Panel
        title="Per rule"
        hint="Sorted by total cost: the rule at the top is the one that has taken the most R from you."
      >
        {rules.length ? (
          <RuleTable rows={rules} />
        ) : (
          <EmptyPanel>
            <span>
              No rules checked on trades in this selection. Set your rules in{" "}
              <Link href="/psychological-edge" className="font-medium text-primary hover:underline">My Edge</Link> and mark them kept or broken when you log a trade.
            </span>
          </EmptyPanel>
        )}
      </Panel>
      <p className="flex items-center gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
        <MetricInfo>{GLOSSARY.cost}</MetricInfo>
        A positive R next to a rule would mean you did better breaking it: worth a second look at whether the rule fits how you trade.
      </p>
    </Section>
  );
}
