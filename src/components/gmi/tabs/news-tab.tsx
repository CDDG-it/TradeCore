"use client";

import { useMemo, useState, useSyncExternalStore, type CSSProperties } from "react";
import { useGmi } from "@/lib/gmi/client";
import { filterNews, NEWS_TOPICS, publicationLabel, type NewsFilters } from "@/lib/gmi/news-view";
import type { NewsArticle, NewsTopic } from "@/lib/gmi/types";
import { NewsContext } from "../news-context";
import s from "../news-desk.module.css";

const DEFAULT_FILTERS: NewsFilters = { query: "", topic: "All", agency: "All", days: 30 };
const TOPICS: NewsTopic[] = ["Monetary Policy", "Inflation", "Employment", "Energy"];
const TOPIC_CLASS: Record<NewsTopic, string> = { "Monetary Policy": s.policy, Inflation: s.inflation, Employment: s.employment, Energy: s.energy };
const subscribeClock = (notify: () => void) => { const timer = setInterval(notify, 60_000); return () => clearInterval(timer); };
const clockSnapshot = () => Math.floor(Date.now() / 60_000) * 60_000;
const serverClock = () => null;

function publicationDay(article: NewsArticle, timeZone: string) {
  const zone = article.publishedPrecision === "date" ? "UTC" : timeZone;
  const date = new Date(article.publishedAt);
  return {
    key: new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: zone }).format(date),
    day: new Intl.DateTimeFormat("en-GB", { day: "2-digit", timeZone: zone }).format(date),
    month: new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: zone }).format(date),
  };
}

function coverageGradient(counts: Map<NewsTopic, number>): string {
  const total = TOPICS.reduce((sum, topic) => sum + (counts.get(topic) ?? 0), 0) || 1;
  const colors = ["var(--primary)", "var(--ice)", "var(--success)", "var(--warning)"];
  let cursor = 0;
  return `conic-gradient(from -90deg, ${TOPICS.map((topic, index) => {
    const start = cursor;
    cursor += ((counts.get(topic) ?? 0) / total) * 100;
    return `${colors[index]} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;
  }).join(", ")})`;
}

export function NewsTab() {
  const { env, loading, refresh } = useGmi<NewsArticle[]>("/api/gmi/news", 5 * 60_000);
  const now = useSyncExternalStore(subscribeClock, clockSnapshot, serverClock);
  const timeZone = now === null ? "UTC" : Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [limit, setLimit] = useState(25);
  const [refreshing, setRefreshing] = useState(false);
  const changeFilters = (patch: Partial<NewsFilters>) => { setFilters((current) => ({ ...current, ...patch })); setLimit(25); };
  const articles = useMemo(() => env?.data ?? [], [env]);
  const filtered = now == null ? [] : filterNews(articles, filters, now);
  const rangeArticles = now == null ? [] : filterNews(articles, { ...DEFAULT_FILTERS, days: filters.days }, now);
  const topicArticles = useMemo(
    () => now == null ? [] : filterNews(articles, { ...filters, topic: "All" }, now),
    [articles, filters, now]
  );
  const failedSources = env?.sources?.filter((source) => source.status !== "ok") ?? [];
  const checked = env?.sources?.map((source) => source.checkedAt).filter((date): date is string => Boolean(date)).sort().at(-1);
  const pending = now == null || (!env && loading);
  const lead = filtered[0];
  const groups = new Map<string, { day: string; month: string; articles: NewsArticle[] }>();
  for (const article of filtered.slice(1, limit)) {
    const date = publicationDay(article, timeZone);
    if (!groups.has(date.key)) groups.set(date.key, { ...date, articles: [] });
    groups.get(date.key)!.articles.push(article);
  }
  const topicCounts = useMemo(() => {
    const counts = new Map<NewsTopic, number>();
    for (const topic of TOPICS) counts.set(topic, topicArticles.filter((article) => article.topic === topic).length);
    return counts;
  }, [topicArticles]);
  const agencies = useMemo(() => ["Federal Reserve", "BLS", "EIA"].map((agency) => ({ agency, count: topicArticles.filter((article) => article.source === agency).length })), [topicArticles]);
  const maxAgency = Math.max(1, ...agencies.map((item) => item.count));

  return <div className={s.desk}>
    <header className={s.mast}>
      <div><h2 className={s.title}>Market briefing</h2><p className={s.subtitle}>Official U.S. macro, policy and energy releases</p></div>
      <div className={s.edition}><p className={s.editionDate}>{now == null ? "U.S. macro & energy" : new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone }).format(new Date(now))}</p><p className={s.editionMeta}>{checked ? `Checked ${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone }).format(new Date(checked))}` : env?.status === "unavailable" ? "Sources unavailable" : "Checking sources"}</p></div>
    </header>

    {!pending && lead && <section className={s.featureGrid} aria-label="Latest release and coverage">
      <article key={lead.id} className={`${s.feature} ${lead.topic ? TOPIC_CLASS[lead.topic] : ""}`}>
        <div className={s.featureGlow} aria-hidden />
        <svg className={s.featureWave} viewBox="0 0 900 220" preserveAspectRatio="none" aria-hidden><path d="M0 170 C85 170 90 136 170 144 S280 190 360 136 S470 58 545 96 S660 166 740 112 S830 72 900 84" /><path className={s.waveEcho} d="M0 190 C92 182 125 155 210 164 S335 202 410 150 S520 86 590 118 S700 184 775 138 S850 100 900 108" /></svg>
        <div className={s.featureContent}>
          <div className={s.featureMeta}><span className={s.liveMark}><i aria-hidden />Latest release</span><span>{lead.topic}</span></div>
          <h3><a href={lead.url} target="_blank" rel="noopener noreferrer">{lead.title}<span className="sr-only"> (opens original release in a new tab)</span></a></h3>
          {lead.snippet && lead.snippet !== lead.title && <p>{lead.snippet}</p>}
          <div className={s.featureFoot}><span>{lead.source}</span><time dateTime={lead.publishedAt}>{publicationLabel(lead, timeZone)}</time><a href={lead.url} target="_blank" rel="noopener noreferrer">Open release</a></div>
        </div>
      </article>
      <aside className={s.coverage} aria-label="Coverage distribution">
        <div className={s.coverageHeader}><div><p className={s.eyebrow}>Coverage</p><h3>{topicArticles.length} releases</h3></div><span>{filters.days}d</span></div>
        <div className={s.coverageBody}><div className={s.coverageRing} style={{ "--coverage": coverageGradient(topicCounts) } as CSSProperties}><span>{TOPICS.filter((topic) => (topicCounts.get(topic) ?? 0) > 0).length}<small>topics</small></span></div><ul className={s.coverageLegend}>{TOPICS.map((topic) => <li key={topic} className={TOPIC_CLASS[topic]}><i aria-hidden /><span>{topic}</span><strong>{topicCounts.get(topic) ?? 0}</strong></li>)}</ul></div>
        <div className={s.sourceBars}>{agencies.map((item) => <div key={item.agency}><span>{item.agency}</span><i><b style={{ transform: `scaleX(${item.count / maxAgency})` }} /></i><strong>{item.count}</strong></div>)}</div>
      </aside>
    </section>}

    <div className={s.toolbar}>
      <div className={s.topics} role="group" aria-label="Release topic">{NEWS_TOPICS.map((topic) => <button key={topic} type="button" aria-pressed={filters.topic === topic} onClick={() => changeFilters({ topic })} className={s.topic}>{topic === "All" ? "All releases" : topic}<span className={s.topicCount}>{pending ? "-" : topic === "All" ? topicArticles.length : topicCounts.get(topic as NewsTopic) ?? 0}</span></button>)}</div>
      <div className={s.controls}><label><span className="sr-only">Agency</span><select value={filters.agency} onChange={(event) => changeFilters({ agency: event.target.value })} className={s.select}><option value="All">All agencies</option><option>Federal Reserve</option><option>BLS</option><option>EIA</option></select></label><label><span className="sr-only">Publication period</span><select value={filters.days} onChange={(event) => changeFilters({ days: Number(event.target.value) })} className={s.select}>{[7, 30, 90].map((days) => <option key={days} value={days}>{days} days</option>)}</select></label><button type="button" disabled={refreshing || pending} onClick={async () => { setRefreshing(true); try { await refresh(); } finally { setRefreshing(false); } }} className={s.refresh}>{refreshing ? "Checking" : "Refresh"}</button></div>
    </div>

    <div className={s.workspace}>
      <section className={s.main} aria-label="Published releases">
        <div className={s.searchRow}><label className={s.search}><span className="sr-only">Search releases</span><input type="search" value={filters.query} onChange={(event) => changeFilters({ query: event.target.value })} placeholder="Search headlines and releases" /></label><span className={s.resultCount} role="status">{pending ? "Loading" : `${filtered.length} releases`}</span></div>
        {env?.status === "stale" && <p className={s.notice} role="status">Updates delayed. Showing available releases.{failedSources.length ? ` Affected: ${failedSources.map((source) => `${source.agency} ${source.name}`).join("; ")}.` : ""}</p>}
        {pending ? <div className={s.skeleton} aria-hidden>{[0, 1, 2, 3, 4].map((i) => <div key={i} />)}</div> : env?.status === "unavailable" ? <Empty title="Sources temporarily unavailable" detail="The official feeds could not be reached. Refresh to try again. Your calendar remains available." /> : !lead ? <Empty title={rangeArticles.length ? "No matching releases" : "No releases in this period"} detail={rangeArticles.length ? "Try another search, topic or agency." : "Try a longer date range. Official feeds publish on their own schedules and may not include a full archive."}>{(filters.query || filters.agency !== "All" || filters.topic !== "All") && <button onClick={() => changeFilters({ query: "", agency: "All", topic: "All" })} className="mt-4 text-sm text-primary">Clear filters</button>}</Empty> : groups.size > 0 && <><div className={s.feedHeading}><h3>Release stream</h3><span>Newest first · {timeZone}</span></div>{[...groups.entries()].map(([key, group]) => <section key={key} className={s.dayGroup} aria-label={`Releases ${key}`}><h4 className={s.dayLabel}><span className={s.dayNumber}>{group.day}</span>{group.month}</h4><ol>{group.articles.map((article) => <li key={article.id} className={s.story}><article><div className={s.storyMeta}><span className={`${s.topicMarker} ${article.topic ? TOPIC_CLASS[article.topic] : ""}`}><i aria-hidden />{article.topic}</span><span className={s.source}>{article.source}</span><time className={s.timestamp} dateTime={article.publishedAt}>{article.publishedPrecision === "date" ? "Date only" : new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone }).format(new Date(article.publishedAt))}</time></div><h5 className={s.storyTitle}><a href={article.url} target="_blank" rel="noopener noreferrer" className={s.headlineLink}>{article.title}<span className="sr-only"> (opens original release in a new tab)</span></a></h5>{article.snippet && article.snippet !== article.title && <details className={s.excerpt}><summary><span className={s.expandLabel}>Read excerpt</span><span className={s.collapseLabel}>Close excerpt</span></summary><p>{article.snippet}</p></details>}</article></li>)}</ol></section>)}</>}
        {filtered.length > limit && <button onClick={() => setLimit((count) => count + 25)} className={s.more}>Load earlier releases<span>{filtered.length - limit} remaining</span></button>}
        <footer className={s.footer}><details><summary>Sources & publication details</summary><p className="mt-3">Original agency publications. Times in {timeZone}. Sources are checked every 15 minutes while in use; available history varies by feed.</p><ul>{env?.sources?.map((source) => <li key={source.id}>{source.agency} · {source.name}: {source.status === "ok" ? "Available" : source.status === "stale" ? "Delayed, cached releases" : "Unavailable"}{source.checkedAt ? ` · Checked ${new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone }).format(new Date(source.checkedAt))}` : ""}</li>)}</ul></details></footer>
      </section>
      <NewsContext now={now} />
    </div>
  </div>;
}

function Empty({ title, detail, children }: { title: string; detail: string; children?: React.ReactNode }) { return <div className={s.empty}><h3>{title}</h3><p>{detail}</p>{children}</div>; }
