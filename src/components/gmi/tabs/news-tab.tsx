"use client";

/**
 * 01 NEWS: only what is new and matters.
 *
 * Official U.S. releases, filtered twice before they reach the screen: by age
 * (a 24h / 72h / 7-day window, never an archive) and by weight (scheduled
 * prints, Fed policy and the Chair first; housekeeping and explainers never).
 * The screen holds still: one lead, a short list that fits, and beside it what
 * is coming next and where the key readings stand. No feed to scroll through.
 */
import { useMemo, useState, useSyncExternalStore } from "react";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, ChevronDown, RefreshCw } from "lucide-react";
import { useGmi } from "@/lib/gmi/client";
import { importantNews, NEWS_TOPICS, NEWS_WINDOWS, publicationLabel, upcomingReleases, type NewsWindow, type RankedArticle } from "@/lib/gmi/news-view";
import type { CalendarEntry, CalendarMonth } from "@/lib/gmi/calendar";
import { fedEventsByDate } from "@/lib/gmi/fed-events";
import type { NewsArticle, NewsTopic } from "@/lib/gmi/types";
import { cn } from "@/lib/utils";
import { Pane, Empty, Label, Switch, a } from "../pane";
import { releaseValue } from "../news-context";

const EASE = [0.23, 1, 0.32, 1] as const;
const TOPIC_COLOR: Record<NewsTopic, string> = { "Monetary Policy": "var(--primary)", Inflation: "var(--ice)", Employment: "var(--success)", Energy: "var(--warning)" };
const TOPIC_SHORT: Record<NewsTopic, string> = { "Monetary Policy": "Fed", Inflation: "Inflation", Employment: "Jobs", Energy: "Energy" };
const LIST_LIMIT = 6;
const READINGS = ["CPIAUCSL", "CPILFESL", "PCEPI", "UNRATE", "PAYEMS", "GDPC1"];

const subscribeClock = (notify: () => void) => { const timer = setInterval(notify, 60_000); return () => clearInterval(timer); };
const clockSnapshot = () => Math.floor(Date.now() / 60_000) * 60_000;
const serverClock = () => null;

function ago(iso: string, now: number): string {
  const minutes = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return hours < 48 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
}

export function NewsTab() {
  const { env, loading, refresh } = useGmi<NewsArticle[]>("/api/gmi/news", 5 * 60_000);
  const now = useSyncExternalStore(subscribeClock, clockSnapshot, serverClock);
  const timeZone = now === null ? "UTC" : Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [windowKey, setWindowKey] = useState<NewsWindow>("72h");
  const [topic, setTopic] = useState<string>("All");
  const [open, setOpen] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const hours = NEWS_WINDOWS.find((w) => w.key === windowKey)?.hours ?? 72;

  const articles = useMemo(() => env?.data ?? [], [env]);
  const all = useMemo(() => (now == null ? [] : importantNews(articles, now, hours)), [articles, now, hours]);
  const ranked = topic === "All" ? all : all.filter((r) => r.article.topic === topic);
  const counts = useMemo(() => {
    const map = new Map<string, number>([["All", all.length]]);
    for (const r of all) if (r.article.topic) map.set(r.article.topic, (map.get(r.article.topic) ?? 0) + 1);
    return map;
  }, [all]);
  const lead = ranked[0];
  const rest = ranked.slice(1, 1 + LIST_LIMIT);
  const hidden = Math.max(0, ranked.length - 1 - LIST_LIMIT);
  const pending = now == null || (!env && loading);
  const checked = env?.sources?.map((source) => source.checkedAt).filter((date): date is string => Boolean(date)).sort().at(-1);

  async function reload() {
    setRefreshing(true);
    try { await refresh(); } finally { setRefreshing(false); }
  }

  return (
    <div className="grid grid-cols-1 gap-2 lg:h-full lg:min-h-0 lg:grid-cols-12">
      <div className="flex min-h-0 flex-col gap-2 lg:col-span-8">
        {/* Controls: topic, window, freshness. */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, ease: EASE }}
          className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/[.07] bg-card/50 p-1.5">
          <div className="flex flex-wrap gap-0.5" role="group" aria-label="Topic">
            {NEWS_TOPICS.map((t) => {
              const on = topic === t;
              const n = counts.get(t) ?? 0;
              return (
                <motion.button key={t} type="button" aria-pressed={on} onClick={() => { setTopic(t); setOpen(null); }} whileTap={{ scale: 0.95 }}
                  className={cn("relative rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors duration-200", on ? "text-foreground" : "text-foreground/60 hover:text-foreground")}>
                  {on && <motion.span layoutId="news-topic" className="absolute inset-0 rounded-lg border border-primary/40 bg-primary/12" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
                  <span className="relative flex items-center gap-1.5">
                    {t !== "All" && <span className="h-1.5 w-1.5 rounded-full" style={{ background: TOPIC_COLOR[t as NewsTopic] }} />}
                    {t === "All" ? "All" : TOPIC_SHORT[t as NewsTopic]}
                    <span className={cn("tabular-nums", n ? "text-foreground/60" : "text-foreground/30")}>{pending ? "-" : n}</span>
                  </span>
                </motion.button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 pr-1">
            <Switch options={NEWS_WINDOWS.map((w) => ({ key: w.key, label: w.label }))} value={windowKey} onChange={(k) => { setWindowKey(k); setOpen(null); }} />
            <motion.button type="button" onClick={() => void reload()} disabled={refreshing || pending} whileTap={{ scale: 0.9 }} aria-label="Check sources now"
              title={checked && now ? `Checked ${ago(checked, now)}` : "Check sources"}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 text-foreground/70 transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-40">
              <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            </motion.button>
          </div>
        </motion.div>

        {env?.status === "stale" && <p className="shrink-0 px-1 text-[11px] text-warning">Some sources are delayed. Showing what was last published.</p>}

        {pending ? (
          <div className="grid min-h-0 flex-1 gap-2" aria-hidden>
            <div className="h-44 animate-pulse rounded-[22px] bg-card/40" />
            <div className="grid flex-1 gap-2 sm:grid-cols-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-card/30" />)}</div>
          </div>
        ) : env?.status === "unavailable" ? (
          <Pane className="flex-1"><Empty label="Sources unavailable" hint="The official feeds could not be reached. Try again in a moment." /></Pane>
        ) : !lead ? (
          <Pane className="flex-1">
            <Empty label={`Nothing market-moving in the last ${NEWS_WINDOWS.find((w) => w.key === windowKey)?.label}`} hint={windowKey !== "7d" ? "Widen the window to see the week's releases." : "Quiet week for official releases. The calendar shows what is due next."} />
          </Pane>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={`${topic}-${windowKey}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex min-h-0 flex-1 flex-col gap-2">
              <LeadStory item={lead} now={now!} timeZone={timeZone} />
              {rest.length > 0 && (
                <div className="grid min-h-0 flex-1 auto-rows-min content-start gap-2 overflow-y-auto sm:grid-cols-2 lg:overflow-hidden">
                  {rest.map((item, i) => (
                    <StoryCard key={item.article.id} item={item} index={i} now={now!} timeZone={timeZone} open={open === item.article.id} onToggle={() => setOpen((cur) => (cur === item.article.id ? null : item.article.id))} />
                  ))}
                </div>
              )}
              {hidden > 0 && <p className="shrink-0 px-1 text-[11px] text-muted-foreground">{hidden} more important release{hidden === 1 ? "" : "s"} in this window. Narrow by topic to see them.</p>}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <div className="flex min-h-0 flex-col gap-2 lg:col-span-4">
        <ComingUp now={now} />
        <KeyReadings />
      </div>
    </div>
  );
}

function ImportanceTag({ item }: { item: RankedArticle }) {
  return (
    <span className="flex items-center gap-1.5">
      {item.fresh && (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
          <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" /><span className="relative h-1.5 w-1.5 rounded-full bg-primary" /></span>New
        </span>
      )}
      {item.importance === "high" && <span className="rounded-full bg-destructive/12 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-destructive">High impact</span>}
    </span>
  );
}

function LeadStory({ item, now, timeZone }: { item: RankedArticle; now: number; timeZone: string }) {
  const { article } = item;
  const color = article.topic ? TOPIC_COLOR[article.topic] : "var(--primary)";
  return (
    <motion.article key={article.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE }} whileHover={{ y: -2 }}
      className="group relative shrink-0 overflow-hidden rounded-[22px] border border-white/[.08] bg-card/70 p-5 transition-colors duration-300 hover:border-white/[.14]">
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-60 w-60 rounded-full blur-3xl transition-opacity duration-500 group-hover:opacity-100" style={{ background: a(color, 22), opacity: 0.7 }} />
      <div aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ background: color }} />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <Label className="text-[10px]" >Lead release</Label>
          <span className="text-[11px] font-semibold" style={{ color }}>{article.topic}</span>
          <ImportanceTag item={item} />
        </div>
        <h3 className="mt-2 font-heading text-lg font-bold leading-snug tracking-tight sm:text-xl">
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary">{article.title}<span className="sr-only"> (opens original release in a new tab)</span></a>
        </h3>
        {article.snippet && article.snippet !== article.title && <p className="mt-2 line-clamp-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{article.snippet}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground/80">{article.source}</span>
          <time dateTime={article.publishedAt} title={publicationLabel(article, timeZone)}>{article.publishedPrecision === "date" ? publicationLabel(article, timeZone) : ago(article.publishedAt, now)}</time>
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="group/link ml-auto inline-flex items-center gap-1 font-semibold text-primary">
            Open release <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
          </a>
        </div>
      </div>
    </motion.article>
  );
}

function StoryCard({ item, index, now, timeZone, open, onToggle }: { item: RankedArticle; index: number; now: number; timeZone: string; open: boolean; onToggle: () => void }) {
  const { article } = item;
  const color = article.topic ? TOPIC_COLOR[article.topic] : "var(--primary)";
  const hasExcerpt = Boolean(article.snippet && article.snippet !== article.title);
  return (
    <motion.article layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, delay: 0.05 + index * 0.04, ease: EASE, layout: { duration: 0.25, ease: EASE } }}
      className={cn("relative overflow-hidden rounded-2xl border bg-card/55 transition-colors duration-200", open ? "border-primary/35" : "border-white/[.07] hover:border-white/[.13]")}>
      <div aria-hidden className="absolute inset-y-0 left-0 w-[2px]" style={{ background: color }} />
      <button type="button" onClick={onToggle} aria-expanded={open} className="block w-full px-4 py-3 text-left">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2 text-[10px] font-semibold uppercase tracking-wider">
            <span style={{ color }}>{article.topic ? TOPIC_SHORT[article.topic] : article.source}</span>
            <span className="truncate text-foreground/50 normal-case tracking-normal">{article.source} · {article.publishedPrecision === "date" ? publicationLabel(article, timeZone) : ago(article.publishedAt, now)}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            <ImportanceTag item={item} />
            <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown className="h-3.5 w-3.5 text-foreground/50" /></motion.span>
          </span>
        </div>
        <h4 className={cn("mt-1.5 text-[13px] font-semibold leading-snug", !open && "line-clamp-2")}>{article.title}</h4>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: EASE }} className="overflow-hidden">
            <div className="px-4 pb-3">
              {hasExcerpt && <p className="line-clamp-5 text-xs leading-relaxed text-muted-foreground">{article.snippet}</p>}
              <a href={article.url} target="_blank" rel="noopener noreferrer" className="group/link mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                Open release <ArrowUpRight className="h-3 w-3 transition-transform duration-200 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

/** The week ahead, high-impact only: what the next headline will be. */
function ComingUp({ now }: { now: number | null }) {
  const today = useMemo(() => (now == null ? null : new Date(now)), [now]);
  const month = today ? format(today, "yyyy-MM") : null;
  const nextMonth = today ? format(addDays(today, 7), "yyyy-MM") : null;
  const { env: current } = useGmi<CalendarMonth>(month ? `/api/gmi/calendar?month=${month}` : null, 30 * 60_000);
  const { env: next } = useGmi<CalendarMonth>(nextMonth && nextMonth !== month ? `/api/gmi/calendar?month=${nextMonth}` : null, 30 * 60_000);
  const from = today ? format(today, "yyyy-MM-dd") : "";
  const until = today ? format(addDays(today, 8), "yyyy-MM-dd") : "";

  const items = useMemo(() => {
    if (!today) return [];
    const releases = upcomingReleases([...(current?.data?.events ?? []), ...(next?.data?.events ?? [])], from, until)
      .filter((e) => e.importance === "high" && !e.released)
      .map((e) => ({ id: e.id, date: e.date, title: e.label, sub: e.releaseName, fed: false }));
    const fed = [...fedEventsByDate(from, until).values()].flat()
      .map((e) => ({ id: `${e.kind}-${e.date}`, date: e.date, title: e.kind === "fomc-decision" ? "FOMC rate decision" : "FOMC minutes", sub: e.detail, fed: true }));
    return [...fed, ...releases].sort((x, y) => x.date.localeCompare(y.date) || Number(y.fed) - Number(x.fed)).slice(0, 6);
  }, [today, current, next, from, until]);

  return (
    <Pane index="02" label="Next up · high impact" right={<a href="/news-city?tab=calendar" className="text-[11px] font-semibold text-primary hover:underline">Calendar</a>} className="min-h-[220px] lg:flex-1" bodyClassName="p-2">
      {!current ? <Empty label="Loading schedule" /> : items.length === 0 ? <Empty label="Nothing high-impact this week" hint="FRED schedule and Fed calendar, next 7 days." /> : (
        <ol className="space-y-1">
          {items.map((item, i) => {
            const days = today ? differenceInCalendarDays(parseISO(item.date), today) : 0;
            const color = item.fed ? "var(--ice)" : "var(--destructive)";
            return (
              <motion.li key={item.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.22, delay: 0.08 + i * 0.04, ease: EASE }}
                className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-background/40">
                <span className="flex w-10 shrink-0 flex-col items-center rounded-lg border border-border/50 py-1">
                  <span className="text-[13px] font-bold leading-none tabular-nums">{format(parseISO(item.date), "d")}</span>
                  <span className="mt-0.5 text-[9px] font-semibold uppercase text-muted-foreground">{format(parseISO(item.date), "EEE")}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} /><span className="truncate text-[12px] font-semibold">{item.title}</span></span>
                  <span className="block truncate text-[10px] text-muted-foreground">{item.sub}</span>
                </span>
                <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold", days <= 0 ? "bg-primary/15 text-primary" : "text-muted-foreground")}>
                  {days <= 0 ? "Today" : days === 1 ? "Tomorrow" : `in ${days}d`}
                </span>
              </motion.li>
            );
          })}
        </ol>
      )}
    </Pane>
  );
}

/** The six readings the releases are about, as tiles with their last year drawn in. */
function KeyReadings() {
  const { env } = useGmi<CalendarEntry[]>("/api/gmi/calendar", 30 * 60_000);
  const readings = READINGS.flatMap((id) => (env?.data ?? []).filter((entry) => entry.id === id));
  return (
    <Pane index="03" label="Key readings" right={<Label className="text-foreground/50">FRED</Label>} className="shrink-0" bodyClassName="p-2">
      {!env ? <Empty label="Loading readings" /> : readings.length === 0 ? <Empty label="Readings unavailable" /> : (
        <div className="grid grid-cols-2 gap-1.5 xl:grid-cols-3">
          {readings.map((entry, i) => {
            const delta = entry.actual != null && entry.previous != null ? entry.actual - entry.previous : null;
            const tone = delta == null || delta === 0 ? "var(--muted-foreground)" : delta > 0 ? "var(--success)" : "var(--destructive)";
            return (
              <motion.div key={entry.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.22, delay: 0.1 + i * 0.04, ease: EASE }} whileHover={{ y: -2 }}
                title={entry.referenceDate ? `${entry.label}, ${format(parseISO(entry.referenceDate), "MMM yyyy")}` : entry.label}
                className="relative overflow-hidden rounded-xl border border-border/50 bg-background/30 px-2.5 pb-1 pt-2">
                <p className="truncate text-[10px] font-semibold text-muted-foreground">{entry.label}</p>
                <p className="mt-0.5 font-heading text-base font-bold tabular-nums">{entry.actual == null ? "-" : releaseValue(entry.actual, entry.unit)}</p>
                <p className="text-[10px] tabular-nums" style={{ color: tone }}>{delta == null ? "No prior" : `${delta > 0 ? "+" : ""}${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(delta)} vs prior`}</p>
                <Spark values={entry.history.map((h) => h.value)} color={tone} delay={0.2 + i * 0.05} />
              </motion.div>
            );
          })}
        </div>
      )}
    </Pane>
  );
}

function Spark({ values, color, delay }: { values: number[]; color: string; delay: number }) {
  const points = values.slice(-12);
  if (points.length < 2) return <div className="h-6" />;
  const min = Math.min(...points), max = Math.max(...points), range = max - min || 1;
  const d = points.map((v, i) => `${i ? "L" : "M"}${((i / (points.length - 1)) * 100).toFixed(1)} ${(22 - ((v - min) / range) * 18).toFixed(1)}`).join(" ");
  return (
    <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="mt-1 h-6 w-full" aria-hidden>
      <motion.path d={d} fill="none" stroke={color} strokeWidth={1.4} vectorEffect="non-scaling-stroke" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay, ease: EASE }} />
    </svg>
  );
}
