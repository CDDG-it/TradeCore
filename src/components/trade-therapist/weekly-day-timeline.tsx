"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ArrowUpRight, Check, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTotalR, tradeR, type WeekGroup } from "@/lib/journal/weeks";
import type { DayRecap } from "@/lib/reviews/day-recap";
import type { BestTradeListRow } from "@/lib/supabase/queries";

function Note({ label, tone, items, empty }: { label: string; tone: string; items: string[]; empty: string }) {
  return (
    <div className="grid gap-1 border-t border-border/45 py-3 sm:grid-cols-[10.5rem_minmax(0,1fr)] sm:gap-4">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span className={cn("size-1.5 shrink-0 rounded-full", tone)} />{label}
      </p>
      {items.length ? (
        <div className="space-y-1.5">
          {items.map((item) => <p key={item} className="whitespace-pre-line text-[13px] leading-relaxed text-foreground/85">{item}</p>)}
        </div>
      ) : <p className="text-xs text-muted-foreground/65">{empty}</p>}
    </div>
  );
}

function DayCard({ day, recap, best }: { day: WeekGroup["days"][number]; recap: DayRecap; best?: BestTradeListRow }) {
  const traded = day.trades.length > 0;
  const resultTone = recap.r > 0 ? "text-success" : recap.r < 0 ? "text-destructive" : "text-warning";
  const bestLabel = recap.opportunity === "taken"
    ? traded ? "Yes, your trade was the best one" : "Yes, staying out was the best decision"
    : recap.opportunity === "missed" ? "No, a better trade was available" : "Not assessed in Post Market";
  const bestExplanation = (best?.notes ?? "").trim();
  const marketRecap = (best?.post_market_analysis ?? "").trim();
  const missedNote = recap.opportunity === "missed" ? bestExplanation : "";
  const showMarketRecap = marketRecap && marketRecap !== bestExplanation;

  return (
    <article className="grid gap-4 rounded-[22px] border border-border/65 bg-card p-4 shadow-[0_16px_42px_-36px_rgba(0,0,0,.8)] sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-6 sm:p-5">
      <div className="sm:border-r sm:border-border/50 sm:pr-5">
        <p className="text-[10px] font-bold uppercase tracking-[.17em] text-primary">{format(new Date(day.date + "T12:00:00"), "EEEE")}</p>
        <p className="mt-1 font-heading text-xl font-bold tracking-tight">{format(new Date(day.date + "T12:00:00"), "d MMM")}</p>
        <p className={cn("mt-2 text-sm font-semibold tabular-nums", traded ? resultTone : "text-muted-foreground")}>{traded ? formatTotalR(recap.r) : "No trade"}</p>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-base font-semibold">{traded ? `${day.trades.length} ${day.trades.length === 1 ? "trade" : "trades"} taken` : "No trade taken"}</h2>
          {traded && <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium", recap.execution === "good" ? "bg-success/10 text-success" : recap.execution === "bad" ? "bg-destructive/10 text-destructive" : recap.execution === "mixed" ? "bg-warning/10 text-warning" : "bg-muted/50 text-muted-foreground")}>{recap.execution ? `Execution ${recap.execution}` : "Execution not rated"}</span>}
        </div>

        <div className="mt-3 border-t border-border/45">
          <div className="grid gap-2 py-3 sm:grid-cols-[10.5rem_minmax(0,1fr)] sm:gap-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">What you took</p>
            {traded ? (
              <div className="space-y-1.5">
                {day.trades.map((trade) => {
                  const r = tradeR(trade);
                  return <Link key={trade.id} href={`/journal/${trade.id}`} className="group flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-background/35 px-3 py-2 transition-colors hover:border-primary/35">
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-sm font-semibold">{trade.instrument} · {trade.direction} <ArrowUpRight className="size-3 text-muted-foreground transition-colors group-hover:text-primary" /></span>
                      {(trade.execution_time || trade.confluences?.length > 0) && <span className="mt-0.5 block text-[11px] text-muted-foreground">{[trade.execution_time, trade.confluences?.join(" · ")].filter(Boolean).join(" · ")}</span>}
                    </span>
                    <span className={cn("shrink-0 text-sm font-bold tabular-nums", r > 0 ? "text-success" : r < 0 ? "text-destructive" : "text-warning")}>{formatTotalR(r)}</span>
                  </Link>;
                })}
              </div>
            ) : <p className="text-xs text-muted-foreground">You stayed out of the market.</p>}
          </div>

          <div className="grid gap-1 border-t border-border/45 py-3 sm:grid-cols-[10.5rem_minmax(0,1fr)] sm:gap-4">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"><Trophy className="size-3.5 text-primary" />Best trade?</p>
            <div>
              <p className={cn("flex items-center gap-1.5 text-[13px] font-semibold", recap.opportunity === "taken" ? "text-success" : recap.opportunity === "missed" ? "text-ice" : "text-muted-foreground")}>
                {recap.opportunity === "taken" && <Check className="size-3.5" />}{bestLabel}
              </p>
              {recap.opportunity === "taken" && bestExplanation && <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-foreground/75">{bestExplanation}</p>}
            </div>
          </div>

          {(traded || recap.mistakes.length > 0 || recap.lessons.length > 0 || missedNote) && <>
            <Note label="What went wrong" tone="bg-destructive" items={recap.mistakes} empty="Nothing noted." />
            <Note label="Lesson" tone="bg-success" items={recap.lessons} empty="Nothing noted." />
            <Note label="Winner you missed" tone="bg-ice" items={missedNote ? [missedNote] : []} empty={recap.opportunity === "taken" ? "The best opportunity was taken." : "No missed winner recorded."} />
          </>}
          {showMarketRecap && <Note label="Session recap" tone="bg-primary" items={[marketRecap]} empty="" />}
        </div>
      </div>
    </article>
  );
}

/** A chronological read of the trading week, one complete story per day. */
export function WeeklyDayTimeline({ days, recaps, bestByDay, execRate, goodExec, badExec, totalR }: {
  days: WeekGroup["days"];
  recaps: DayRecap[];
  bestByDay: Record<string, BestTradeListRow>;
  execRate: number | null;
  goodExec: number;
  badExec: number;
  totalR: number;
}) {
  const recapByDate = new Map(recaps.map((recap) => [recap.date, recap]));
  return (
    <section aria-label="Weekly review by day" className="space-y-3">
      <div className="px-1">
        <p className="text-[10px] font-bold uppercase tracking-[.17em] text-primary">Monday to Friday</p>
        <h2 className="mt-1 font-heading text-lg font-semibold">Your trading week, day by day</h2>
      </div>
      {days.map((day) => {
        const recap = recapByDate.get(day.date);
        return recap ? <DayCard key={day.date} day={day} recap={recap} best={bestByDay[day.date]} /> : null;
      })}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3">
        <p className="text-xs font-semibold text-muted-foreground">Week in review</p>
        <div className="flex items-center gap-6 text-right">
          <div><p className={cn("text-base font-bold tabular-nums", execRate == null ? "text-muted-foreground" : execRate >= 70 ? "text-success" : execRate >= 40 ? "text-warning" : "text-destructive")}>{execRate == null ? "—" : `${execRate}%`}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Execution {goodExec + badExec > 0 && `${goodExec}/${goodExec + badExec}`}</p></div>
          <div><p className={cn("text-base font-bold tabular-nums", totalR > 0 ? "text-success" : totalR < 0 ? "text-destructive" : "text-warning")}>{formatTotalR(totalR)}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Week R</p></div>
        </div>
      </div>
    </section>
  );
}
