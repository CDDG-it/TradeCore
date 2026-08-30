"use client";

/**
 * OVERVIEW — the global tape in seconds: a pulse grid, the latest market news,
 * and the most recent high-impact US releases. Objective only — it shows what
 * moved and what was reported, never an interpretation or a call.
 */
import Link from "next/link";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";
import { fmtPrice, fmtPct, toneFor, timeAgo, useGmi, FRESHNESS_LABEL } from "@/lib/gmi/client";
import type { DataEnvelope, Quote, NewsArticle } from "@/lib/gmi/types";
import type { CalendarEntry } from "@/lib/gmi/calendar";
import { Panel, Unavailable } from "../panel";
import { Sparkline } from "../sparkline";

const PULSE = ["NQ", "ES", "YM", "RTY", "VIX", "DXY", "US10Y", "GC", "CL"];

function PulseCard({ q }: { q: Quote | undefined }) {
  const tone = toneFor(q?.changePct);
  return (
    <div className="rounded-xl border border-border/50 bg-muted/10 p-3">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-xs font-bold text-foreground">{q?.symbol ?? "—"}</span>
        <span className="font-mono text-[11px] font-semibold tabular-nums" style={{ color: tone }}>{q ? fmtPct(q.changePct) : "—"}</span>
      </div>
      <div className="mt-1 font-mono text-lg font-bold tabular-nums text-foreground/90">{q ? fmtPrice(q.price, q.unit) : "—"}</div>
      <div className="mt-1.5 h-6">{q?.spark?.length ? <Sparkline data={q.spark} width={140} height={24} /> : null}</div>
    </div>
  );
}

function fmtRel(v: number | null, unit: string): string {
  if (v == null) return "—";
  if (unit === "%") return `${v.toFixed(1)}%`;
  if (unit === "count") return Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(v);
  if (unit === "kpersons") return `${(v / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`;
  if (unit === "$B") return `$${(v / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })}T`;
  if (unit === "$M") return `$${(v / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}B`;
  return v.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

export function OverviewTab({ quotesEnv }: { quotesEnv: DataEnvelope<Quote[]> | null }) {
  const bySymbol = new Map((quotesEnv?.data ?? []).map((q) => [q.symbol, q]));
  const { env: newsEnv } = useGmi<NewsArticle[]>("/api/gmi/news", 15 * 60_000);
  const { env: calEnv } = useGmi<CalendarEntry[]>("/api/gmi/calendar", 30 * 60_000);
  const articles = (newsEnv?.data ?? []).slice(0, 7);
  const releases = (calEnv?.data ?? []).filter((e) => e.importance === "high").slice(0, 6);

  return (
    <div className="space-y-4">
      <Panel title="Market pulse" env={quotesEnv}>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
          {PULSE.map((s) => <PulseCard key={s} q={bySymbol.get(s)} />)}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Panel title="Latest market news" env={newsEnv}>
          {newsEnv?.status === "unavailable" ? (
            <Unavailable hint="News provider temporarily unavailable. Other data is unaffected." />
          ) : articles.length === 0 ? (
            <Unavailable label="No headlines" />
          ) : (
            <ol className="divide-y divide-border/40">
              {articles.map((a) => (
                <li key={a.id}>
                  <Link href={a.url} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-2.5 py-2.5">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: a.sentimentScore == null ? "var(--muted-foreground)" : a.sentimentScore > 0.15 ? "var(--success)" : a.sentimentScore < -0.15 ? "var(--destructive)" : "var(--muted-foreground)" }} />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground group-hover:text-primary">{a.title}</p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{a.source}</span><span>· {timeAgo(a.publishedAt)}</span>
                        {a.assets[0] && <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] text-primary">{a.assets[0]}</span>}
                      </div>
                    </div>
                    <ExternalLink className="mt-1 h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel title="Recent high-impact releases" env={calEnv}>
          {releases.length === 0 ? (
            <Unavailable label="Loading releases…" />
          ) : (
            <ul className="space-y-1.5">
              {releases.map((e) => {
                const delta = e.actual != null && e.previous != null ? e.actual - e.previous : null;
                return (
                  <li key={e.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/10 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">{e.label}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {e.referenceDate ? format(new Date(e.referenceDate + "T12:00:00"), "MMM yyyy") : "—"}
                        <span className="ml-1.5 uppercase tracking-wider text-muted-foreground/50">{FRESHNESS_LABEL[e.freshness]}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-bold tabular-nums text-foreground">{fmtRel(e.actual, e.unit)}</div>
                      {delta != null && <div className="font-mono text-[10px] tabular-nums" style={{ color: toneFor(delta) }}>{delta > 0 ? "▲" : delta < 0 ? "▼" : "▬"}</div>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
