"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, startOfWeek } from "date-fns";
import { ArrowRight, Check, Moon, Sunrise, CalendarCheck } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { getBestTradesOfDay, getPreMarketExercise, getWeeklyTradeReviews, type BestTradeListRow } from "@/lib/supabase/queries";
import { isDayReviewed, postMarketDates } from "@/lib/post-market/day-overview";
import { formatTotalR, isReviewOpen, reviewOpensOn, tradeR } from "@/lib/journal/weeks";
import { netRColor } from "@/lib/journal/colors";
import { cn } from "@/lib/utils";
import type { PreMarketExercise, TradeJournalEntry, WeeklyTradeReview } from "@/lib/types";

type Status = { label: string; tone: "done" | "todo" | "waiting" };

/**
 * The Therapist's front door: where the day stands, in the order a trading day
 * runs — prepare before the open, review after the close, write the week up on
 * Friday. Nothing starts until the trader picks it, so opening the Therapist
 * never lands in the middle of a question.
 */
export function TherapistToday({
  trades,
  onPreMarket,
  onPostMarket,
}: {
  trades: TradeJournalEntry[];
  onPreMarket: () => void;
  /** Opens the Post Market desk on `date`; `start` resumes or begins the guided review. */
  onPostMarket: (date: string, start: boolean) => void;
}) {
  const reduceMotion = useReducedMotion();
  const today = format(new Date(), "yyyy-MM-dd");
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const [preMarket, setPreMarket] = useState<PreMarketExercise | null | undefined>(undefined);
  const [reviews, setReviews] = useState<Record<string, BestTradeListRow> | null>(null);
  const [week, setWeek] = useState<WeeklyTradeReview | null | undefined>(undefined);

  useEffect(() => {
    getPreMarketExercise(today).then(setPreMarket).catch(() => setPreMarket(null));
    getBestTradesOfDay().then((rows) => setReviews(Object.fromEntries(rows.map((row) => [row.date.slice(0, 10), row])))).catch(() => setReviews({}));
    getWeeklyTradeReviews().then((rows) => setWeek(rows.find((row) => row.week_start === weekStart) ?? null)).catch(() => setWeek(null));
  }, [today, weekStart]);

  const tradesByDay = useMemo(() => {
    const map: Record<string, TradeJournalEntry[]> = {};
    for (const trade of trades) (map[trade.date_time.slice(0, 10)] ??= []).push(trade);
    return map;
  }, [trades]);

  const todayTrades = tradesByDay[today] ?? [];
  const todayR = todayTrades.reduce((total, trade) => total + tradeR(trade), 0);
  const todayRow = reviews?.[today];
  const todayReviewed = isDayReviewed(todayRow);
  const todayInProgress = !todayReviewed && Boolean(todayRow?.review_step && todayRow.review_step !== "complete");
  const backlog = reviews
    ? postMarketDates(trades, Object.values(reviews), today)
        .filter((date) => date !== today && (tradesByDay[date]?.length ?? 0) > 0 && !isDayReviewed(reviews[date]))
        .slice(0, 3)
    : [];

  const preDone = Boolean(preMarket?.completed_at);
  const weekOpen = isReviewOpen(weekStart);
  const weekDone = Boolean(week && (week.lessons || week.mistakes || week.prevention_plan));
  const loading = preMarket === undefined || reviews === null || week === undefined;

  // The one card that matters now: prepare first, review once you have traded,
  // write the week up once it has closed.
  const focus: "pre" | "post" | "week" | null =
    !preDone && todayTrades.length === 0 ? "pre"
      : !todayReviewed && (todayTrades.length > 0 || backlog.length > 0) ? "post"
      : weekOpen && !weekDone ? "week"
      : null;

  const preStatus: Status = preDone ? { label: "Done", tone: "done" } : { label: "Not started", tone: "todo" };
  const postStatus: Status = todayReviewed ? { label: "Reviewed", tone: "done" }
    : todayInProgress ? { label: "In progress", tone: "todo" }
    : { label: "Not reviewed", tone: todayTrades.length ? "todo" : "waiting" };
  const weekStatus: Status = weekDone ? { label: "Complete", tone: "done" }
    : weekOpen ? { label: "Ready to write", tone: "todo" }
    : { label: `Opens ${format(reviewOpensOn(weekStart), "EEEE")}`, tone: "waiting" };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl space-y-5 pb-4">
        <div className="px-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-primary">Today</p>
          <h2 className="mt-1 font-heading text-xl font-bold tracking-tight sm:text-2xl">{format(new Date(), "EEEE d MMMM")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? "Loading your day..." : focus === "pre" ? "Start with your pre-market exercise before the open."
              : focus === "post" ? "Your trading is in. Review the session while it is fresh."
              : focus === "week" ? "The week is closed. Write your weekly review."
              : "You are up to date."}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Card
            index={0} reduceMotion={reduceMotion} active={focus === "pre"}
            icon={<Sunrise className="h-4 w-4" />} eyebrow="Before the open" title="Pre-market exercise"
            status={loading ? null : preStatus}
            body={preDone ? (preMarket?.focus ? `Focus: ${preMarket.focus}` : "Today's focus and commitment are set.") : "Review your recent wins and losses and set one commitment for today."}
            action={<CardButton primary={focus === "pre"} onClick={onPreMarket}>{preDone ? "View exercise" : "Start exercise"}</CardButton>}
          />

          <Card
            index={1} reduceMotion={reduceMotion} active={focus === "post"}
            icon={<Moon className="h-4 w-4" />} eyebrow="After the close" title="Post Market review"
            status={loading ? null : postStatus}
            body={
              <>
                <span className="block">
                  {todayTrades.length
                    ? <>{todayTrades.length} trade{todayTrades.length === 1 ? "" : "s"} today · <span className="font-semibold tabular-nums" style={{ color: netRColor(todayR) }}>{formatTotalR(todayR)}</span></>
                    : "No trades logged today."}
                </span>
                {backlog.length > 0 && (
                  <span className="mt-3 block">
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">Still to review</span>
                    <span className="mt-1.5 flex flex-wrap gap-1.5">
                      {backlog.map((date) => {
                        const r = (tradesByDay[date] ?? []).reduce((total, trade) => total + tradeR(trade), 0);
                        return (
                          <button key={date} type="button" onClick={() => onPostMarket(date, true)}
                            className="rounded-md border border-border/60 px-2 py-1 text-[11px] transition-colors hover:border-primary/40 hover:text-primary">
                            {format(new Date(`${date}T12:00:00`), "EEE d MMM")} <span className="tabular-nums" style={{ color: netRColor(r) }}>{formatTotalR(r)}</span>
                          </button>
                        );
                      })}
                    </span>
                  </span>
                )}
              </>
            }
            action={
              <div className="flex flex-wrap items-center gap-3">
                <CardButton primary={focus === "post"} onClick={() => onPostMarket(today, !todayReviewed)}>
                  {todayReviewed ? "View day" : todayInProgress ? "Continue review" : "Start review"}
                </CardButton>
                {!todayReviewed && (
                  <button type="button" onClick={() => onPostMarket(today, false)} className="text-[11px] font-semibold text-muted-foreground transition-colors hover:text-primary">
                    Day overview
                  </button>
                )}
              </div>
            }
          />

          <Card
            index={2} reduceMotion={reduceMotion} active={focus === "week"}
            icon={<CalendarCheck className="h-4 w-4" />} eyebrow="End of the week" title="Weekly review"
            status={loading ? null : weekStatus}
            body={weekDone ? "This week's reflection is written." : weekOpen ? "Go through each day and sum up what to fix and what to keep." : "Unlocks once the week's last session is behind you."}
            action={
              <Link href={`/trade-therapist/review/${weekStart}`}
                className={cn("inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors",
                  focus === "week" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border/60 text-foreground hover:border-primary/40 hover:text-primary")}>
                {weekDone ? "Open review" : weekOpen ? "Write review" : "Preview week"} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
        </div>
      </div>
    </div>
  );
}

function Card({ index, reduceMotion, active, icon, eyebrow, title, status, body, action }: {
  index: number;
  reduceMotion: boolean | null;
  active: boolean;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  status: Status | null;
  body: React.ReactNode;
  action: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, transform: reduceMotion ? "none" : "translateY(6px)" }}
      animate={{ opacity: 1, transform: "translateY(0px)" }}
      transition={{ duration: 0.22, delay: reduceMotion ? 0 : index * 0.05, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "flex min-h-56 flex-col rounded-2xl border bg-card/65 p-5 transition-colors",
        active ? "border-primary/45 shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary)_18%,transparent),0_24px_60px_-40px_rgba(0,0,0,.55)]" : "border-border/60"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", active ? "bg-primary/15 text-primary" : "bg-muted/40 text-muted-foreground")}>{icon}</span>
        {status && (
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none",
            status.tone === "done" ? "bg-success/12 text-success" : status.tone === "todo" ? "bg-primary/12 text-primary" : "bg-muted/40 text-muted-foreground")}>
            {status.tone === "done" && <Check className="h-3 w-3" />}
            {status.label}
          </span>
        )}
      </div>
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">{eyebrow}</p>
      <h3 className="mt-1 font-heading text-base font-bold tracking-tight">{title}</h3>
      <div className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground">{body}</div>
      <div className="mt-5">{action}</div>
    </motion.section>
  );
}

function CardButton({ primary, onClick, children }: { primary: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={cn("inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors",
        primary ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border/60 text-foreground hover:border-primary/40 hover:text-primary")}>
      {children} <ArrowRight className="h-3.5 w-3.5" />
    </button>
  );
}
