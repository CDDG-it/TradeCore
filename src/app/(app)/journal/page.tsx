"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth,
  addMonths, subMonths, getDay, isToday,
} from "date-fns";
import { Plus, ChevronLeft, ChevronRight, LayoutGrid, ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getTrades } from "@/lib/supabase/queries";
import { getScreenshotUrls } from "@/lib/supabase/storage";
import { MonthAnalytics } from "@/components/journal/month-analytics";
import { DayTradesDialog } from "@/components/journal/day-trades-dialog";
import type { TradeJournalEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { tradeR, formatTotalR, instrumentName } from "@/lib/journal/weeks";
import {
  inOrder, resultColor, resultBands, netRColor, alpha,
  WIN_COLOR, LOSS_COLOR, BE_COLOR,
} from "@/lib/journal/colors";

/** The two calendar readings of the same month: the numbers (net R per day) and
 *  the charts (a screenshot per day with its W/L/BE verdict). */
type CalendarView = "results" | "screens";

/** The day's verdict letter and colour, from its net R. A traded day is always
 *  one of the three; an untraded day has none. */
function dayVerdict(dayR: number, hasTrades: boolean) {
  if (!hasTrades) return null;
  if (dayR > 0) return { letter: "W", color: WIN_COLOR };
  if (dayR < 0) return { letter: "L", color: LOSS_COLOR };
  return { letter: "BE", color: BE_COLOR };
}

/** The first chart screenshot across a day's trades, if any was attached. */
function firstShot(trades: TradeJournalEntry[]): string | undefined {
  for (const t of trades) {
    for (const g of t.screenshot_groups ?? []) {
      if (g.urls?.[0]) return g.urls[0];
    }
  }
  return undefined;
}

export default function JournalPage() {
  const router = useRouter();
  const [allTrades, setAllTrades] = useState<TradeJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [dayTradesDate, setDayTradesDate] = useState<string | null>(null); // inspect a day's trades

  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarView, setCalendarView] = useState<CalendarView>("results");

  /* Calendar thumbnails. A screenshot is a storage path, which is not a URL a
     browser can load, so each one is signed before it is rendered. They are
     asked for at thumbnail size: the tile is never larger than a few hundred
     pixels, and the original is often several megabytes. Legacy base64 entries
     pass through untouched. */
  const [shotUrls, setShotUrls] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    getTrades().then(setAllTrades).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const paths = [...new Set(allTrades.flatMap((t) => (t.screenshot_groups ?? []).flatMap((g) => g.urls ?? [])))]
      .filter((u) => u && !u.startsWith("data:") && !u.startsWith("http"));
    if (!paths.length) return;
    let cancelled = false;
    getScreenshotUrls(paths, "thumb")
      .then((signed) => {
        if (cancelled) return;
        setShotUrls(new Map(paths.map((p, i) => [p, signed[i]])));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [allTrades]);

  // Deep link from the dashboard: /journal?day=YYYY-MM-DD jumps straight to that
  // day's log: through to the entry when the day holds one trade, to the day
  // picker when it holds several.
  useEffect(() => {
    if (!allTrades.length) return;
    const day = new URLSearchParams(window.location.search).get("day");
    if (!day) return;
    const dayTrades = allTrades.filter((t) => t.date_time.slice(0, 10) === day);
    if (dayTrades.length === 1) router.replace(`/journal/${dayTrades[0].id}`);
    else if (dayTrades.length > 1) {
      setCalendarMonth(new Date(day + "T12:00:00"));
      setDayTradesDate(day);
    }
  }, [allTrades, router]);

  // Calendar helpers: month view
  const calMonthStart = startOfMonth(calendarMonth);
  const calMonthEnd = endOfMonth(calendarMonth);
  const calDays = eachDayOfInterval({ start: calMonthStart, end: calMonthEnd });
  const startPad = (getDay(calMonthStart) + 6) % 7; // Mon-start

  const tradesByDay = useMemo(() => {
    const map: Record<string, typeof allTrades> = {};
    allTrades.forEach((t) => {
      const key = t.date_time.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    // Earliest trade first, so a day always reads in the order it happened.
    for (const key of Object.keys(map)) map[key] = inOrder(map[key]);
    return map;
  }, [allTrades]);

  // The month laid out as weeks (rows of 7), with leading/trailing pads so every
  // row is full. Each row carries a summary cell on the right, so the calendar
  // reads across into that week's result the way a paper journal does.
  const calWeeks = useMemo(() => {
    const cells: (Date | null)[] = [
      ...Array.from({ length: startPad }, () => null),
      ...calDays,
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarMonth]);

  /** Trades inside the month on screen: powers the analytics panel. */
  const monthTrades = useMemo(
    () => allTrades.filter((t) => {
      const d = new Date(t.date_time.slice(0, 10) + "T12:00:00");
      return d >= calMonthStart && d <= calMonthEnd;
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allTrades, calendarMonth]
  );

  // Calendar navigation: always a month at a time now.
  const prevCalendar = () => setCalendarMonth(subMonths(calendarMonth, 1));
  const nextCalendar = () => setCalendarMonth(addMonths(calendarMonth, 1));
  const calendarTitle = format(calendarMonth, "MMMM yyyy");

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  // Eight tracks: seven days, then the week-summary column on the right.
  const gridTemplate = { gridTemplateColumns: "repeat(7, minmax(0,1fr)) minmax(3.25rem, 0.62fr)" };

  /** Navigation header: month stepper + the Results/Screenshots view toggle. */
  const calendarNav = (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border/40 bg-gradient-to-b from-muted/25 to-transparent">
      <button onClick={prevCalendar} aria-label="Previous month"
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <p className="text-sm font-semibold tracking-tight">{calendarTitle}</p>
      <div className="flex items-center gap-2">
        {/* Two readings of the month: the numbers, or the charts. */}
        <div className="flex rounded-lg bg-muted/40 p-0.5">
          {([
            { key: "results", label: "Results", Icon: LayoutGrid },
            { key: "screens", label: "Screens", Icon: ImageIcon },
          ] as const).map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setCalendarView(key)} title={key === "screens" ? "Screenshots" : "Results"}
              className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all",
                calendarView === key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground")}>
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
        <button onClick={nextCalendar} aria-label="Next month"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  /** One day cell, rendered for whichever view is live. Returns the interactive
   *  wrapper (link to the sole trade, day picker for several, or a static box). */
  function renderDay(day: Date) {
    const key = format(day, "yyyy-MM-dd");
    const dayTrades = inOrder(tradesByDay[key] || []);
    const isCurrentMonth = isSameMonth(day, calendarMonth);
    const has = dayTrades.length > 0;
    const dayR = dayTrades.reduce((s, t) => s + tradeR(t), 0);
    const netColor = netRColor(dayR);
    const today = isToday(day);
    const verdict = dayVerdict(dayR, has);
    const screens = calendarView === "screens";
    const rawShot = screens ? firstShot(dayTrades) : undefined;
    /* A storage path only becomes usable once signed. Until then the day
       renders as an ordinary tile rather than a broken image. */
    const shot = !rawShot
      ? undefined
      : rawShot.startsWith("data:") || rawShot.startsWith("http")
      ? rawShot
      : shotUrls.get(rawShot);

    const tileClass = cn(
      "group/day relative flex flex-col overflow-hidden rounded-xl border text-left transition-all duration-300 ease-out",
      screens ? "min-h-[92px] xl:min-h-[118px]" : "min-h-[74px] px-1.5 pb-1 pt-1.5 xl:min-h-[96px]",
      today ? "border-primary/55" : has ? "border-border/70" : "border-border/25",
      !has && !today && "bg-muted/5",
      has && "cursor-pointer hover:-translate-y-0.5 hover:border-primary/40"
    );

    // ── Results reading: the day's net R, banded per trade. ──────────────────
    const resultsInner = (
      <>
        {has && (
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 flex h-[3px] gap-px">
            {dayTrades.map((t) => {
              const c = resultColor(t);
              return (
                <span key={t.id} className="flex-1 transition-[filter] duration-300 group-hover/day:brightness-125"
                  style={{ background: c, boxShadow: `0 0 8px ${alpha(c, 45)}` }} />
              );
            })}
          </span>
        )}
        {dayTrades.length > 1 && (
          <span aria-hidden className="pointer-events-none absolute inset-0">
            {dayTrades.slice(1).map((t, i) => (
              <span key={t.id} className="absolute inset-y-0 w-px"
                style={{
                  left: `${(((i + 1) / dayTrades.length) * 100).toFixed(3)}%`,
                  background: `linear-gradient(180deg, transparent, ${alpha("var(--foreground)", 12)} 30%, transparent)`,
                }} />
            ))}
          </span>
        )}
        {has && (
          <span aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/day:opacity-100"
            style={{ background: `radial-gradient(120% 90% at 50% 100%, ${alpha(netColor, 18)}, transparent 65%)` }} />
        )}
        <div className="relative flex items-start justify-between gap-1 leading-none">
          <span className={cn("text-xs font-bold tabular-nums",
            today ? "text-primary" : isCurrentMonth ? "text-foreground/75" : "text-muted-foreground/30")}>
            {format(day, "d")}
          </span>
          {dayTrades.length > 1 && (
            <span className="shrink-0 rounded-full border border-border/70 bg-background/60 px-1 text-[9px] font-bold leading-[14px] text-foreground/70">
              {dayTrades.length}
            </span>
          )}
        </div>
        {has && (
          <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center">
            <span className="text-[15px] font-black leading-none tabular-nums transition-transform duration-300 group-hover/day:scale-105 xl:text-lg"
              style={{ color: netColor }}>
              {formatTotalR(dayR)}
            </span>
            {(() => {
              const goodCount = dayTrades.filter((t) => t.execution_quality === "good").length;
              const badCount = dayTrades.filter((t) => t.execution_quality === "bad").length;
              return (goodCount > 0 || badCount > 0) ? (
                <span className="mt-1 flex items-center gap-1 text-[9px] font-bold leading-none tabular-nums">
                  {goodCount > 0 && <span className="text-success/85">✓{goodCount}</span>}
                  {badCount > 0 && <span className="text-destructive/85">✗{badCount}</span>}
                </span>
              ) : null;
            })()}
          </div>
        )}
      </>
    );

    // ── Screenshots reading: the chart you took, stamped with its verdict. ───
    const screensInner = (
      <>
        {/* The chart itself, filling the tile; a scrim keeps the overlay legible. */}
        {shot ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shot} alt="" loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/day:scale-[1.04]" />
            <span aria-hidden className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, rgba(4,8,17,0.35) 0%, transparent 32%, transparent 55%, rgba(4,8,17,0.78) 100%)" }} />
          </>
        ) : (
          has && <span aria-hidden className="absolute inset-0" style={{ background: resultBands(dayTrades, 14) }} />
        )}

        <div className="relative flex h-full flex-col p-1.5">
          <div className="flex items-start justify-between gap-1 leading-none">
            <span className={cn("text-xs font-bold tabular-nums",
              shot ? "text-white drop-shadow" : today ? "text-primary" : isCurrentMonth ? "text-foreground/75" : "text-muted-foreground/30")}>
              {format(day, "d")}
            </span>
            {dayTrades.length > 1 && (
              <span className={cn("shrink-0 rounded-full px-1 text-[9px] font-bold leading-[14px]",
                shot ? "bg-black/45 text-white" : "border border-border/70 bg-background/60 text-foreground/70")}>
                {dayTrades.length}
              </span>
            )}
          </div>

          {/* Verdict stamp: the W / L / BE for the day, bottom-left. */}
          {verdict && (
            <div className="mt-auto flex items-end justify-between gap-1">
              <span className="inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-[11px] font-black leading-none tabular-nums shadow-sm"
                style={{ background: verdict.color, color: "#04121b" }}>
                {verdict.letter}
              </span>
              <span className={cn("text-[11px] font-black tabular-nums",
                shot ? "text-white drop-shadow" : "")}
                style={shot ? undefined : { color: netColor }}>
                {formatTotalR(dayR)}
              </span>
            </div>
          )}
          {!shot && verdict && (
            <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 flex h-[3px] gap-px">
              {dayTrades.map((t) => (
                <span key={t.id} className="flex-1" style={{ background: resultColor(t) }} />
              ))}
            </span>
          )}
        </div>
      </>
    );

    const inner = screens ? screensInner : resultsInner;
    const bg = !screens && has ? { background: resultBands(dayTrades, 12) } : undefined;

    if (dayTrades.length === 1) {
      const only = dayTrades[0];
      return (
        <Link key={key} href={`/journal/${only.id}`} title={`Open ${instrumentName(only.instrument)} log`}
          className={tileClass} style={bg}>
          {inner}
        </Link>
      );
    }
    if (dayTrades.length > 1) {
      return (
        <button key={key} type="button" onClick={() => setDayTradesDate(key)}
          title={`${dayTrades.length} trades: open the day`} className={tileClass} style={bg}>
          {inner}
        </button>
      );
    }
    return <div key={key} className={tileClass}>{inner}</div>;
  }

  /** The week-summary cell that closes each calendar row. */
  function weekSummary(row: (Date | null)[], idx: number) {
    const days = row.filter((d): d is Date => d != null);
    const rowTrades = days.flatMap((d) => tradesByDay[format(d, "yyyy-MM-dd")] || []);
    if (rowTrades.length === 0) {
      return (
        <div key={`sum-${idx}`} className="flex items-center justify-center rounded-xl border border-dashed border-border/25">
          <span className="text-[10px] text-muted-foreground/25">-</span>
        </div>
      );
    }
    const weekR = rowTrades.reduce((s, t) => s + tradeR(t), 0);
    const wins = rowTrades.filter((t) => t.result === "win").length;
    const losses = rowTrades.filter((t) => t.result === "loss").length;
    return (
      <div key={`sum-${idx}`}
        className="flex flex-col items-center justify-center gap-0.5 rounded-xl border border-border/50 px-1 py-1"
        style={{ background: alpha(netRColor(weekR), 8) }}>
        <span className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground/60">Week</span>
        <span className="text-sm font-black leading-none tabular-nums xl:text-base" style={{ color: netRColor(weekR) }}>
          {formatTotalR(weekR)}
        </span>
        <span className="text-[9px] font-semibold tabular-nums text-muted-foreground/70">{wins}W {losses}L</span>
      </div>
    );
  }

  const calendarGrid = (
    <CardContent className="p-2.5 sm:p-3">
      {/* Weekday header, aligned to the same eight tracks as the rows. */}
      <div className="mb-1.5 grid gap-1.5" style={gridTemplate}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            <span className="sm:hidden">{d[0]}</span>
            <span className="hidden sm:inline">{d}</span>
          </div>
        ))}
        <div className="text-center text-[10px] font-semibold uppercase tracking-wider text-primary/70">Σ</div>
      </div>

      <div className="grid gap-1.5" style={gridTemplate}>
        {calWeeks.map((row, i) => (
          <div key={`row-${i}`} className="contents">
            {row.map((day, j) => (day ? renderDay(day) : <div key={`pad-${i}-${j}`} />))}
            {weekSummary(row, i)}
          </div>
        ))}
      </div>

      {/* Legend: shifts with the view. */}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/40 pt-2 text-[10px] text-muted-foreground/70">
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: WIN_COLOR }} />Win</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: LOSS_COLOR }} />Loss</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: BE_COLOR }} />B/E</span>
        {calendarView === "screens" ? (
          <span className="text-muted-foreground/50">Each tile is that day&apos;s chart, stamped W / L / BE · Σ = week result</span>
        ) : (
          <span className="text-muted-foreground/50">A split tile = several trades that day · Σ = week result</span>
        )}
      </div>
    </CardContent>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Trading"
        title="Journal"
        subtitle="Your complete trade history"
        action={
          <Link
            href="/journal/new"
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-px shrink-0"
            style={{
              background: "var(--primary)",
              color: "var(--on-brand)",
              boxShadow: "0 4px 14px color-mix(in oklch, var(--primary) 30%, transparent)",
            }}
          >
            <Plus className="w-4 h-4" /> Log trade
          </Link>
        }
      />
      <PageWrapper>
        {/* Calendar on the left, this month's analytics kept on the right. */}
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_330px] items-stretch">
          <Card className="bg-card border-border/50 overflow-hidden self-start w-full">
            {calendarNav}
            {calendarGrid}
          </Card>
          <MonthAnalytics trades={monthTrades} monthLabel={format(calendarMonth, "MMMM yyyy")} />
        </div>
      </PageWrapper>

      {dayTradesDate && (
        <DayTradesDialog
          date={dayTradesDate}
          trades={tradesByDay[dayTradesDate] ?? []}
          open={dayTradesDate !== null}
          onOpenChange={(v) => { if (!v) setDayTradesDate(null); }}
        />
      )}
    </div>
  );
}
