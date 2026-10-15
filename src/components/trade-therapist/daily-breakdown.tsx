"use client";

import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTotalR } from "@/lib/journal/weeks";
import type { DayRecap, WeekRecapSummary } from "@/lib/reviews/day-recap";

const EXECUTION = {
  good: { label: "Execution good", cls: "bg-success/12 text-success" },
  mixed: { label: "Execution mixed", cls: "bg-warning/12 text-warning" },
  bad: { label: "Execution poor", cls: "bg-destructive/12 text-destructive" },
} as const;

const OPPORTUNITY = {
  taken: { label: "Best trade taken", cls: "bg-success/12 text-success" },
  missed: { label: "Missed a winner", cls: "bg-ice/12 text-ice" },
  none: { label: "Not reviewed", cls: "bg-muted/40 text-muted-foreground/70" },
} as const;

function Pill({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none", className)}>
      {children}
    </span>
  );
}

function Notes({ tone, label, items }: { tone: string; label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone }} />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <ul className="space-y-1 pl-3">
        {items.map((text) => (
          <li key={text} className="text-[13px] leading-snug text-foreground/90 whitespace-pre-line">{text}</li>
        ))}
      </ul>
    </div>
  );
}

function summaryLine(s: WeekRecapSummary): string {
  const parts: string[] = [];
  if (s.ratedDays > 0) parts.push(`Execution good on ${s.goodDays}/${s.ratedDays} ${s.ratedDays === 1 ? "day" : "days"}`);
  if (s.missed > 0) parts.push(`${s.missed} missed ${s.missed === 1 ? "winner" : "winners"}`);
  if (s.unreviewed > 0) parts.push(`${s.unreviewed} ${s.unreviewed === 1 ? "day" : "days"} without a Post Market review`);
  return parts.length ? parts.join(" · ") : "Nothing logged for this week yet.";
}

/**
 * Per trading day: what went wrong, what was learned, whether a winning trade
 * was there, and how the day was executed. Read-only: it shows the journal back
 * so the week's reflection below can be written from it.
 */
export function DailyBreakdown({ recaps, summary }: { recaps: DayRecap[]; summary: WeekRecapSummary }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Daily breakdown</p>
        </div>
        <p className="text-[11px] text-muted-foreground">{summaryLine(summary)}</p>
      </div>

      <div className="mt-3 grid gap-2.5 lg:grid-cols-2">
        {recaps.map((d) => {
          const has = d.trades.length > 0;
          const empty = d.mistakes.length === 0 && d.lessons.length === 0 && !d.opportunityNote;
          const tone = d.outcome === "win" ? "text-success" : d.outcome === "loss" ? "text-destructive" : "text-warning";
          return (
            <div key={d.date} className={cn("rounded-xl border p-3", has ? "border-border/50 bg-background/40" : "border-border/30 bg-muted/10")}>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <p className="text-sm font-semibold">{format(new Date(d.date + "T12:00:00"), "EEEE d MMM")}</p>
                {d.outcome && (
                  <span className={cn("text-xs font-black tabular-nums", tone)}>
                    {d.outcome === "win" ? "W" : d.outcome === "loss" ? "L" : "BE"} {formatTotalR(d.r)}
                  </span>
                )}
                <div className="ml-auto flex flex-wrap gap-1">
                  {has && (d.execution ? (
                    <Pill className={EXECUTION[d.execution].cls}>
                      {EXECUTION[d.execution].label}
                      {d.ratedExec > 1 && <span className="ml-1 tabular-nums opacity-80">{d.goodExec}/{d.ratedExec}</span>}
                    </Pill>
                  ) : (
                    <Pill className="bg-muted/40 text-muted-foreground/70">Execution not rated</Pill>
                  ))}
                  {(has || d.opportunity !== "none") && (
                    <Pill className={OPPORTUNITY[d.opportunity].cls}>
                      {!has && d.opportunity === "taken" ? "Stayed out: right call" : OPPORTUNITY[d.opportunity].label}
                    </Pill>
                  )}
                </div>
              </div>

              {!has && d.opportunity === "none" ? (
                <p className="mt-2 text-xs text-muted-foreground/60">No trades.</p>
              ) : (
                <div className="mt-2.5 space-y-2.5">
                  <Notes tone="var(--destructive)" label="What went wrong" items={d.mistakes} />
                  <Notes tone="var(--success)" label="Lesson" items={d.lessons} />
                  {d.opportunityNote && (
                    <div>
                      <div className="mb-1 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-ice" />
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">The winner you missed</p>
                      </div>
                      <p className="line-clamp-3 pl-3 text-[13px] leading-snug text-foreground/90">{d.opportunityNote}</p>
                    </div>
                  )}
                  {has && empty && (
                    <p className="text-xs text-muted-foreground/60">No mistakes or lessons written for this day.</p>
                  )}
                  {has && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {d.trades.map((t) => (
                        <Link
                          key={t.id}
                          href={`/journal/${t.id}`}
                          className="rounded-md border border-border/50 px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                        >
                          {t.instrument} <span className="tabular-nums">{formatTotalR(t.r)}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
