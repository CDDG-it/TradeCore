"use client";

import Link from "next/link";
import { Pane } from "@/components/gmi/pane";
import { formatR, type EdgeBucket } from "@/lib/journal/edge";
import type { CleanVsBroken, RuleStat } from "@/lib/journal/rule-stats";
import type { Drill } from "@/lib/journal/analytics-filter";
import { EdgeBars, EmptyPanel, RValue } from "./analytics-ui";

interface RuleRow extends EdgeBucket {
  stat: RuleStat;
}

/**
 * What each rule is worth: R per trade when kept minus R per trade when broken.
 * Positive means keeping it pays. A rule never broken (or never kept) has
 * nothing to compare against and shows as an early read.
 */
const asRow = (r: RuleStat): RuleRow => ({
  key: r.label.toLowerCase(),
  label: r.label,
  trades: r.evaluated,
  wins: 0,
  losses: 0,
  winRate: null,
  totalR: r.totalCost ?? 0,
  expectancy: r.cost ?? 0,
  thin: r.thin || r.cost === null,
  stat: r,
});

export function RulePane({
  index, className, rules, clean, drill, onDrill,
}: {
  index: string;
  className?: string;
  rules: RuleStat[];
  clean: CleanVsBroken;
  drill: Drill;
  onDrill: (d: Partial<Drill>) => void;
}) {
  const rows = rules.map(asRow);
  const selected = drill.rule?.key;

  // One click shows the trades where you broke the rule, a second where you kept it, a third clears.
  const cycle = (b: EdgeBucket) => {
    const cur = drill.rule?.key === b.key ? drill.rule : undefined;
    onDrill({ rule: !cur ? { key: b.key, label: b.label, kept: false } : !cur.kept ? { key: b.key, label: b.label, kept: true } : undefined });
  };

  return (
    <Pane index={index} label="Rule reward" className={className} bodyClassName="flex flex-col p-3">
      <p className="mb-2 shrink-0 text-xs text-muted-foreground">
        {clean.gap !== null ? (
          <>
            Clean trades earn <RValue r={clean.gap} /> more
            {clean.rGivenUp !== null && clean.rGivenUp > 0 && <> · {clean.rGivenUp.toFixed(1)}R left on the table</>}.
          </>
        ) : (
          "What keeping each rule is worth per trade."
        )}
      </p>
      <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
        {rows.length === 0 ? (
          <EmptyPanel>
            <span>
              No rules checked in this selection. Set them in{" "}
              <Link href="/psychological-edge" className="font-medium text-primary hover:underline">My Edge</Link> and mark them when you log a trade.
            </span>
          </EmptyPanel>
        ) : (
          <EdgeBars
            buckets={rows}
            collapseThin
            selected={selected}
            onSelect={cycle}
            labelWidth="minmax(0,11rem)"
            tip={(b) => {
              const r = (b as RuleRow).stat;
              return (
                <div className="space-y-0.5">
                  <p className="font-semibold">{r.label}</p>
                  {r.cost !== null ? <p>Keeping it is worth {formatR(r.cost)} per trade</p> : <p>Nothing to compare yet: needs trades where you kept and broke it</p>}
                  <p className="opacity-80">
                    Kept {r.kept}× {r.rKept !== null && `(${formatR(r.rKept)})`} · broken {r.broken}× {r.rBroken !== null && `(${formatR(r.rBroken)})`} · {r.breakRate}% broken
                  </p>
                  <p className="pt-0.5 text-[10px] opacity-70">Click: trades where you broke it · again: kept it · again: clear</p>
                </div>
              );
            }}
          />
        )}
      </div>
    </Pane>
  );
}
