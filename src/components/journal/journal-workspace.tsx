"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
import { useScreenshots } from "@/lib/supabase/use-screenshots";
import { MonthAnalytics } from "@/components/journal/month-analytics";
import { DayTradesDialog } from "@/components/journal/day-trades-dialog";
import { HOVER_PREVIEW_DELAY_MS, ScreenshotHoverPreview, type HoverPreviewTarget } from "@/components/journal/screenshot-hover-preview";
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

/* The calendar remembers how it was last read, so choosing Screens once
   keeps it on Screens across pages and visits. Per browser, best effort. */
const VIEW_KEY = "tmc:journal-calendar-view";
function storedView(): CalendarView {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(VIEW_KEY) === "screens" ? "screens" : "results";
  } catch {
    return "results";
  }
}

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

export function JournalWorkspace({ preview = false, sampleTrades = [], sampleMonth }: { preview?: boolean; sampleTrades?: TradeJournalEntry[]; sampleMonth?: Date }) {
  const router = useRouter();
  const [allTrades, setAllTrades] = useState<TradeJournalEntry[]>(preview ? sampleTrades : []);
  const [loading, setLoading] = useState(!preview);

  const [dayTradesDate, setDayTradesDate] = useState<string | null>(null); // inspect a day's trades

  const [calendarMonth, setCalendarMonth] = useState(sampleMonth ?? new Date());
  // Read on the client only: the first render is the loading state either way,
  // so the server's default and the stored choice never disagree on screen.
  const [calendarView, setCalendarViewState] = useState<CalendarView>(() => (preview ? "results" : storedView()));
  function setCalendarView(view: CalendarView) {
    setCalendarViewState(view);
    if (preview) return;
    try { window.localStorage.setItem(VIEW_KEY, view); } catch { /* storage blocked: the choice lasts this visit */ }
  }

  /* Rest the pointer on a chart tile and it opens large, mid-screen. `arming`
     is the tile whose timer is running (it shows a filling bar), `hovered`
     the open preview. Mouse only: a touch tap still just opens the day. */
  const [arming, setArming] = useState<string | null>(null);
  const [hovered, setHovered] = useState<HoverPreviewTarget | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endHover = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
    setArming(null);
    setHovered(null);
  }, []);
  useEffect(() => () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); }, []);
  function startHover(key: string, preview: HoverPreviewTarget) {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    endHover();
    setArming(key);
    hoverTimer.current = setTimeout(() => {
      hoverTimer.current = null;
      setArming(null);
      setHovered(preview);
    }, HOVER_PREVIEW_DELAY_MS);
  }

  useEffect(() => {
    if (preview) return;
    getTrades().then(setAllTrades).finally(() => setLoading(false));
  }, [preview]);

  // Deep link from the dashboard: /journal?day=YYYY-MM-DD jumps straight to that
  // day's log: through to the entry when the day holds one trade, to the day
  // picker when it holds several.
  useEffect(() => {
    if (preview) return;
    if (!allTrades.length) return;
    const day = new URLSearchParams(window.location.search).get("day");
    if (!day) return;
    const dayTrades = allTrades.filter((t) => t.date_time.slice(0, 10) === day);
    if (dayTrades.length === 1) router.replace(`/journal/${dayTrades[0].id}`);
    else if (dayTrades.length > 1) {
      setCalendarMonth(new Date(day + "T12:00:00"));
      setDayTradesDate(day);
    }
  }, [allTrades, router, preview]);

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

  /* Calendar thumbnails. A screenshot is a storage path, which is not a URL a
     browser can load, so it is signed before it is rendered, at thumbnail size:
     a tile is never larger than a few hundred pixels and an original is often
     several megabytes. Only the chart a tile shows (the day's first) is signed,
     through the shared hook, so one missing file no longer blanks every tile. */
  const dayShots = useMemo(() => Object.values(tradesByDay).map(firstShot).filter((url): url is string => !!url), [tradesByDay]);
  const { display: shotUrl, failed: shotFailed, onLoadError: onShotError } = useScreenshots(null, dayShots, "thumb");

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
  const calendarKey = `${format(calendarMonth, "yyyy-MM")}-${calendarView}`;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  // Eight tracks: seven days, then the week-summary column on the right.
  const gridTemplate = { gridTemplateColumns: "repeat(7, minmax(0,1fr)) minmax(3.25rem, 0.62fr)" };

  /** Navigation header: month stepper + the Results/Screenshots view toggle. */
  const calendarNav = (
    <div className="flex items-center justify-between gap-3 border-b border-border/40 bg-gradient-to-b from-primary/[0.055] to-transparent px-4 py-3">
      <button onClick={prevCalendar} aria-label="Previous month"
        className="press journal-nav-button flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <p className="text-sm font-semibold tracking-tight tabular-nums">{calendarTitle}</p>
      <div className="flex items-center gap-2">
        {/* Two readings of the month: the numbers, or the charts. */}
        <div className="flex rounded-lg border border-border/50 bg-background/45 p-0.5">
          {([
            { key: "results", label: "Results", Icon: LayoutGrid },
            { key: "screens", label: "Screens", Icon: ImageIcon },
          ] as const).map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setCalendarView(key)} title={key === "screens" ? "Screenshots" : "Results"} aria-pressed={calendarView === key}
              className={cn("press inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-[background-color,color,box-shadow] duration-150",
                calendarView === key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground")}>
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
        <button onClick={nextCalendar} aria-label="Next month"
          className="press journal-nav-button flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
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
    const shot = rawShot && !shotFailed(rawShot) ? shotUrl(rawShot) ?? undefined : undefined;

    const tileClass = cn(
      "journal-day group/day relative flex flex-col overflow-hidden rounded-xl border text-left",
      screens ? "min-h-[92px] xl:min-h-[118px]" : "min-h-[74px] px-1.5 pb-1 pt-1.5 xl:min-h-[96px]",
      today ? "border-primary/55" : has ? "border-border/70" : "border-border/25",
      !has && !today && "bg-muted/5",
      has && "journal-day-interactive cursor-pointer"
    );

    // ── Results reading: the day's net R, banded per trade. ──────────────────
    const resultsInner = (
      <>
        {has && (
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 flex h-[3px] gap-px">
            {dayTrades.map((t) => {
              const c = resultColor(t);
              return (
                <span key={t.id} className="flex-1 transition-[filter] duration-150 group-hover/day:brightness-125"
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
          <span aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-150 group-hover/day:opacity-100"
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
            <span className="text-[15px] font-black leading-none tabular-nums xl:text-lg"
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
            <img src={shot} alt="" loading="lazy" onError={() => rawShot && onShotError(rawShot)}
              className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-150 group-hover/day:brightness-110" />
            <span aria-hidden className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, rgba(4,8,17,0.35) 0%, transparent 32%, transparent 55%, rgba(4,8,17,0.78) 100%)" }} />
          </>
        ) : (
          has && <span aria-hidden className="absolute inset-0" style={{ background: resultBands(dayTrades, 14) }} />
        )}
        {/* Fills while the pointer rests here; when full, the chart opens large. */}
        {arming === key && <span aria-hidden className="journal-hover-arm pointer-events-none absolute inset-x-0 bottom-0 z-10 h-0.5 bg-primary motion-reduce:hidden" />}

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
    const hover = screens && shot && rawShot ? {
      onMouseEnter: () => startHover(key, {
        path: rawShot,
        thumb: shot,
        title: `${format(day, "EEEE d MMMM")} · ${[...new Set(dayTrades.map((t) => instrumentName(t.instrument)))].join(", ")}`,
        detail: `${verdict ? `${verdict.letter} · ` : ""}${formatTotalR(dayR)}`,
        detailColor: netColor,
      }),
      onMouseLeave: endHover,
      onMouseDown: endHover,
    } : {};

    if (dayTrades.length === 1 && !preview) {
      const only = dayTrades[0];
      return (
        <Link key={key} href={`/journal/${only.id}`} title={shot ? undefined : `Open ${instrumentName(only.instrument)} log`}
          aria-label={`Open ${instrumentName(only.instrument)} log`} className={tileClass} style={bg} {...hover}>
          {inner}
        </Link>
      );
    }
    if (dayTrades.length > 0) {
      return (
        <button key={key} type="button" onClick={() => setDayTradesDate(key)}
          title={shot ? undefined : `${dayTrades.length} trade${dayTrades.length === 1 ? "" : "s"}: open the day`}
          aria-label={`${dayTrades.length} trade${dayTrades.length === 1 ? "" : "s"}: open the day`} className={tileClass} style={bg} {...hover}>
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
        className="journal-week-summary flex flex-col items-center justify-center gap-0.5 rounded-xl border border-border/50 px-1 py-1"
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
    <CardContent key={calendarKey} className="journal-calendar-enter p-2.5 sm:p-3">
      <div className="overflow-x-auto">
      <div className="min-w-[560px] sm:min-w-0">
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
      </div>
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
            href={preview ? "/preview/trade" : "/journal/new"}
            className="press inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold"
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
          <Card className="journal-calendar-card w-full self-start overflow-hidden border-border/50 bg-card">
            {calendarNav}
            {calendarGrid}
          </Card>
          <div key={format(calendarMonth, "yyyy-MM")} className="journal-analytics-enter min-w-0">
            <MonthAnalytics trades={monthTrades} monthLabel={format(calendarMonth, "MMMM yyyy")} preview={preview} />
          </div>
        </div>
      </PageWrapper>

      {dayTradesDate && (
        <DayTradesDialog
          date={dayTradesDate}
          trades={tradesByDay[dayTradesDate] ?? []}
          open={dayTradesDate !== null}
          onOpenChange={(v) => { if (!v) setDayTradesDate(null); }}
          preview={preview}
        />
      )}

      <ScreenshotHoverPreview target={calendarView === "screens" ? hovered : null} onClose={endHover} />
    </div>
  );
}
