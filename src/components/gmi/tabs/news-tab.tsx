"use client";

import { useState, useSyncExternalStore } from "react";
import { useGmi } from "@/lib/gmi/client";
import { filterNews, NEWS_TOPICS, publicationLabel, type NewsFilters } from "@/lib/gmi/news-view";
import type { NewsArticle } from "@/lib/gmi/types";
import { NewsContext } from "../news-context";

const DEFAULT_FILTERS: NewsFilters = { query: "", topic: "All", agency: "All", days: 30 };
const subscribeClock = (notify: () => void) => { const timer = setInterval(notify, 60_000); return () => clearInterval(timer); };
const clockSnapshot = () => Math.floor(Date.now() / 60_000) * 60_000;
const serverClock = () => null;
const control = "min-h-11 rounded-lg border border-border/70 bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary";

export function NewsTab() {
  const { env, loading, refresh } = useGmi<NewsArticle[]>("/api/gmi/news", 5 * 60_000);
  const now = useSyncExternalStore(subscribeClock, clockSnapshot, serverClock);
  const timeZone = now === null ? "UTC" : Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [limit, setLimit] = useState(25);
  const [refreshing, setRefreshing] = useState(false);
  const changeFilters = (patch: Partial<NewsFilters>) => { setFilters((current) => ({ ...current, ...patch })); setLimit(25); };
  const articles = env?.data ?? [];
  const filtered = now == null ? [] : filterNews(articles, filters, now);
  const rangeArticles = now == null ? [] : filterNews(articles, { ...DEFAULT_FILTERS, days: filters.days }, now);
  const failedSources = env?.sources?.filter((source) => source.status !== "ok") ?? [];
  const checked = env?.sources?.map((source) => source.checkedAt).filter((date): date is string => Boolean(date)).sort().at(-1);
  const pending = now == null || (!env && loading);

  return <div className="grid grid-flow-dense grid-cols-1 items-start gap-7 lg:grid-cols-12 lg:gap-8">
    <section className="min-w-0 lg:col-span-8" aria-labelledby="release-heading">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div><h2 id="release-heading" className="text-xl font-semibold tracking-tight">Latest releases</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">Published by the Federal Reserve, BLS and EIA. Times in {timeZone}.</p>
        </div>
        <button type="button" disabled={refreshing || pending} onClick={async () => { setRefreshing(true); try { await refresh(); } finally { setRefreshing(false); } }}
          className="min-h-10 shrink-0 rounded-lg border border-border/70 px-3 text-xs font-medium transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-50">{refreshing ? "Checking" : "Refresh"}</button>
      </div>
      <div className="rounded-xl border border-border/60 bg-card/30 p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <label className="col-span-2 sm:col-span-1"><span className="sr-only">Search releases</span>
            <input type="search" value={filters.query} onChange={(event) => changeFilters({ query: event.target.value })} placeholder="Search releases" className={`${control} w-full text-base sm:text-sm`} />
          </label>
          <label><span className="sr-only">Agency</span><select value={filters.agency} onChange={(event) => changeFilters({ agency: event.target.value })} className={`${control} w-full`}>
            <option value="All">All agencies</option><option>Federal Reserve</option><option>BLS</option><option>EIA</option>
          </select></label>
          <label><span className="sr-only">Publication period</span><select value={filters.days} onChange={(event) => changeFilters({ days: Number(event.target.value) })} className={`${control} w-full`}>
            {[7, 30, 90].map((days) => <option key={days} value={days}>Last {days} days</option>)}
          </select></label>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1" role="group" aria-label="Release topic">
          {NEWS_TOPICS.map((topic) => <button key={topic} type="button" aria-pressed={filters.topic === topic} onClick={() => changeFilters({ topic })}
            className={`min-h-10 border-b text-xs font-medium transition-colors ${filters.topic === topic ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{topic}</button>)}
        </div>
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 py-4 text-xs text-muted-foreground">
        <span role="status">{pending ? "Loading releases" : `${filtered.length} release${filtered.length === 1 ? "" : "s"}`}</span>
        <span>{checked ? `Last successful check ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone }).format(new Date(checked))}` : env?.status === "unavailable" ? "Source checks unsuccessful" : "Awaiting source checks"}</span>
      </div>
      {env?.status === "stale" && <p className="border-b border-border/60 py-3 text-xs leading-relaxed text-warning" role="status">Some updates are delayed. Available releases remain visible.{failedSources.length ? ` ${failedSources.map((source) => `${source.agency}: ${source.name}`).join("; ")}.` : ""}</p>}
      {pending ? <div className="space-y-5 py-6" aria-hidden>{[0, 1, 2, 3].map((i) => <div key={i} className="space-y-3"><div className="h-3 w-36 rounded bg-muted/40" /><div className="h-5 w-4/5 rounded bg-muted/30" /><div className="h-3 w-1/2 rounded bg-muted/20" /></div>)}</div>
        : env?.status === "unavailable" ? <Empty title="Releases are currently unavailable" detail="The official sources could not be reached. Try refreshing shortly. The calendar is available separately." />
        : filtered.length === 0 ? <Empty title={rangeArticles.length ? "No matching releases" : "No recent releases"} detail={rangeArticles.length ? "Try a different search, topic or agency." : "These sources publish on their own schedules. Try a longer date range; feeds may not include a full archive."}>
          {(filters.query || filters.agency !== "All" || filters.topic !== "All") && <button onClick={() => changeFilters({ query: "", agency: "All", topic: "All" })} className="mt-4 text-sm text-primary">Clear filters</button>}
        </Empty> : <ol className="divide-y divide-border/50">
          {filtered.slice(0, limit).map((article) => <li key={article.id} className="py-5 sm:py-6">
            <article>
              <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground/80">{article.source}</span>
                <time dateTime={article.publishedAt}>{publicationLabel(article, timeZone)}</time>
                <span>{article.topic}</span>
              </div>
              <h3 className="max-w-4xl text-[16px] font-medium leading-relaxed tracking-[-0.01em] sm:text-[17px]">
                <a href={article.url} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary">{article.title}<span className="sr-only"> (opens original release in a new tab)</span></a>
              </h3>
              {article.snippet && article.snippet !== article.title && <details className="mt-2.5">
                <summary className="w-fit cursor-pointer list-none text-xs text-muted-foreground transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">Read publisher excerpt</summary>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-foreground/75">{article.snippet}</p>
              </details>}
            </article>
          </li>)}
        </ol>}
      {filtered.length > limit && <button onClick={() => setLimit((count) => count + 25)} className="mt-4 min-h-11 w-full rounded-lg border border-border/70 text-sm font-medium transition-colors hover:border-primary/50 hover:text-primary">Show more ({filtered.length - limit} remaining)</button>}
      <footer className="mt-6 border-t border-border/60 pt-4 text-xs leading-relaxed text-muted-foreground">
        <p>Official publications only. Source checks run every 15 minutes while the dashboard is in use. Each feed provides a limited publication history.</p>
        <details className="mt-3"><summary className="w-fit cursor-pointer list-none text-foreground/75 [&::-webkit-details-marker]:hidden">Source status and attribution</summary>
          <ul className="mt-3 space-y-2">{env?.sources?.map((source) => <li key={source.id}>{source.agency} · {source.name}: {source.status === "ok" ? "Available" : source.status === "stale" ? "Delayed, showing cached releases" : "Unavailable"}{source.checkedAt ? ` · Checked ${new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone }).format(new Date(source.checkedAt))}` : ""}</li>)}</ul>
          <p className="mt-3">Sources: <a className="underline underline-offset-2" href="https://www.federalreserve.gov/feeds/feeds.htm" target="_blank" rel="noopener noreferrer">Federal Reserve Board</a>, <a className="underline underline-offset-2" href="https://www.bls.gov/feed/" target="_blank" rel="noopener noreferrer">U.S. Bureau of Labor Statistics</a>, <a className="underline underline-offset-2" href="https://www.eia.gov/tools/rssfeeds/" target="_blank" rel="noopener noreferrer">U.S. Energy Information Administration</a>. Publication dates appear with each release.</p>
        </details>
      </footer>
    </section>
    <NewsContext now={now} />
  </div>;
}

function Empty({ title, detail, children }: { title: string; detail: string; children?: React.ReactNode }) {
  return <div className="py-12"><h3 className="text-base font-medium">{title}</h3><p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">{detail}</p>{children}</div>;
}
