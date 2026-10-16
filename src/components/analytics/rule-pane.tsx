"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CountUp } from "@/components/ui/count-up";
import { Pane } from "@/components/gmi/pane";
import { formatR } from "@/lib/journal/edge";
import { netRColor } from "@/lib/journal/colors";
import type { CleanVsBroken, RuleStat } from "@/lib/journal/rule-stats";
import type { Drill } from "@/lib/journal/analytics-filter";
import { cn } from "@/lib/utils";
import { EASE, EmptyPanel, GLOSSARY, MetricInfo, RValue, tradesLabel } from "./analytics-ui";

function CleanTile({ label, b }: { label: string; b: CleanVsBroken["clean"] }) {
  return (
    <div className="rounded-xl border border-border/40 bg-muted/15 px-2.5 py-2">
      <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-black leading-none tabular-nums" style={{ color: b.trades && !b.thin ? netRColor(b.expectancy) : undefined }}>
        {b.trades ? <CountUp value={b.expectancy} format={(n) => formatR(n)} /> : <span className="text-muted-foreground/50">–</span>}
      </p>
      <p className="mt-1 text-[10px] text-muted-foreground">per trade · {b.trades}</p>
    </div>
  );
}

/** One verdict side of a rule: a pill that drills into the trades where you kept / broke it. */
function VerdictPill({ r, n, on, off, kept, onClick }: { r: number | null; n: number; on: boolean; off: boolean; kept: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={!n}
      onClick={onClick}
      aria-pressed={on}
      title={`${kept ? "Kept" : "Broken"} on ${tradesLabel(n)}: click to see them`}
      className={cn(
        "flex h-6 items-center justify-end rounded-md border px-1.5 text-[11px] transition-[background-color,border-color,opacity,transform] duration-200 active:scale-95 disabled:pointer-events-none disabled:opacity-40",
        on ? "border-primary bg-primary/15" : "border-border/40 hover:border-primary/40 hover:bg-primary/5",
        off && "opacity-45"
      )}
    >
      {r === null ? <span className="text-muted-foreground/60">–</span> : <RValue r={r} />}
    </button>
  );
}

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
  const reduce = useReducedMotion();
  return (
    <Pane index={index} label="Rules that pay" className={className} bodyClassName="flex flex-col p-3">
      <div className="grid shrink-0 grid-cols-2 gap-2">
        <CleanTile label="All rules kept" b={clean.clean} />
        <CleanTile label="A rule broken" b={clean.broken} />
      </div>
      <p className="mt-2 shrink-0 text-[11px] leading-snug text-muted-foreground">
        {clean.gap !== null ? (
          <>Keeping your rules is worth <RValue r={clean.gap} /> a trade{clean.rGivenUp !== null && clean.rGivenUp > 0 && <> · <b className="text-foreground">{clean.rGivenUp.toFixed(1)}R</b> left on the table</>}.</>
        ) : (
          "Not enough clean and broken trades yet to compare."
        )}
      </p>

      <div className="mt-3 grid shrink-0 grid-cols-[minmax(0,1fr)_3.9rem_3.9rem] gap-1.5 px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="inline-flex items-center gap-1">Rule <MetricInfo>{`${GLOSSARY.cost} Click Kept or Broke to see those trades.`}</MetricInfo></span>
        <span className="text-right">Kept</span>
        <span className="text-right">Broke</span>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-0.5">
        {rules.length === 0 ? (
          <EmptyPanel>
            <span>
              No rules checked in this selection. Set them in{" "}
              <Link href="/psychological-edge" className="font-medium text-primary hover:underline">My Edge</Link> and mark them when you log a trade.
            </span>
          </EmptyPanel>
        ) : (
          rules.map((r, i) => {
            const key = r.label.toLowerCase();
            const active = drill.rule?.key === key ? drill.rule : undefined;
            const toggle = (kept: boolean) =>
              onDrill({ rule: active && active.kept === kept ? undefined : { key, label: r.label, kept } });
            return (
              <div
                key={key}
                className={cn(
                  "grid grid-cols-[minmax(0,1fr)_3.9rem_3.9rem] items-center gap-1.5 rounded-md px-1 py-1 transition-opacity",
                  drill.rule && !active && "opacity-45"
                )}
              >
                <Tooltip>
                  <TooltipTrigger className="min-w-0 cursor-help text-left">
                    <span className={cn("block truncate text-xs font-medium", r.thin && "text-muted-foreground")}>{r.label}</span>
                    <span className="mt-1 flex items-center gap-1.5">
                      <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-muted/30">
                        <motion.span
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{ background: r.breakRate >= 40 ? "var(--loss)" : r.breakRate >= 20 ? "var(--be)" : "var(--win)", opacity: r.thin ? 0.35 : 0.85 }}
                          initial={reduce ? false : { width: 0 }}
                          animate={{ width: `${Math.max(r.breakRate, 2)}%` }}
                          transition={{ duration: 0.6, delay: reduce ? 0 : i * 0.04, ease: EASE }}
                        />
                      </span>
                      <span className="text-[10px] tabular-nums text-muted-foreground">{r.breakRate}% broken</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[260px] text-left">
                    <div className="space-y-0.5">
                      <p className="font-semibold">{r.label}</p>
                      <p>Broken {r.broken} of {r.evaluated} times ({r.breakRate}%)</p>
                      {r.cost !== null && <p>One breach costs {formatR(r.cost)}{r.totalCost !== null && ` · ${formatR(-r.totalCost, 1)} in total`}</p>}
                      {r.thin && <p className="opacity-80">Thin sample: not a conclusion yet</p>}
                    </div>
                  </TooltipContent>
                </Tooltip>
                <VerdictPill r={r.rKept} n={r.kept} kept on={active?.kept === true} off={!!active && !active.kept} onClick={() => toggle(true)} />
                <VerdictPill r={r.rBroken} n={r.broken} kept={false} on={active?.kept === false} off={!!active && active.kept} onClick={() => toggle(false)} />
              </div>
            );
          })
        )}
      </div>
    </Pane>
  );
}
