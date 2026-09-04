"use client";

/**
 * OVERVIEW — the global tape in seconds: which sessions are live, what moved,
 * what was reported and what the latest high-impact releases printed. Objective
 * only — it shows what happened, never an interpretation or a call.
 */
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowUpRight, Clock } from "lucide-react";
import { fmtPrice, toneFor, timeAgo, useGmi, FRESHNESS_LABEL } from "@/lib/gmi/client";
import { SESSIONS, sessionState, fmtDuration } from "@/lib/gmi/sessions";
import type { DataEnvelope, Quote, NewsArticle } from "@/lib/gmi/types";
import type { CalendarEntry } from "@/lib/gmi/calendar";
import { Panel, Unavailable, ChangeChip, a } from "../panel";
import { Sparkline } from "../sparkline";

const PULSE: { s: string; name: string }[] = [
  { s: "ES", name: "S&P 500" }, { s: "NQ", name: "Nasdaq 100" }, { s: "YM", name: "Dow" },
  { s: "RTY", name: "Russell 2000" }, { s: "VIX", name: "Volatility" }, { s: "DXY", name: "Dollar" },
  { s: "US10Y", name: "US 10-Year" }, { s: "GC", name: "Gold" }, { s: "CL", name: "Crude Oil" },
];

/* ── Session clock ─────────────────────────────────────────────────────────
   Exchange cash hours in each venue's own local time, resolved through the
   IANA database so daylight saving is never guessed. */

/** Ticks every 30s, and stays null on the server so hydration can't disagree
 *  with the client about what time it is. */
function subscribeClock(onChange: () => void) {
  const id = setInterval(onChange, 30_000);
  return () => clearInterval(id);
}
function useClock(): Date | null {
  const bucket = useSyncExternalStore(
    subscribeClock,
    () => Math.floor(Date.now() / 30_000),
    () => null
  );
  return bucket == null ? null : new Date(bucket * 30_000);
}

function SessionClock() {
  const now = useClock();

  return (
    <Panel
      eyebrow="Session clock"
      title="Exchange hours"
      accent="cyan"
      action={<span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/70"><Clock className="h-3 w-3" /> venue local time</span>}
    >
      <div className="grid gap-2.5 sm:grid-cols-3">
        {SESSIONS.map((w) => {
          const st = now ? sessionState(w, now) : null;
          const live = st?.open ?? false;
          const tone = live ? "var(--success)" : "var(--muted-foreground)";
          return (
            <div
              key={w.key}
              className="relative overflow-hidden rounded-xl border border-border/50 bg-muted/[0.06] p-3"
              style={live ? { background: `linear-gradient(150deg, ${a("var(--success)", 8)}, transparent 60%)` } : undefined}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <span
                    className={live ? "h-1.5 w-1.5 rounded-full animate-pulse" : "h-1.5 w-1.5 rounded-full"}
                    style={{ background: tone, boxShadow: live ? `0 0 8px ${a("var(--success)", 70)}` : undefined }}
                  />
                  {w.label}
                </span>
                <span className="font-mono text-xs font-bold tabular-nums text-foreground/80">{st?.localTime ?? "—:—"}</span>
              </div>

              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-border/60">
                <div
                  className="h-full rounded-full transition-[width] duration-700 ease-out"
                  style={{ width: `${(st?.progress ?? 0) * 100}%`, background: live ? "var(--success)" : "var(--muted-foreground)" }}
                />
              </div>

              <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground/70">
                <span className="uppercase tracking-wider">{w.hours}</span>
                <span className="tabular-nums">
                  {!st
                    ? "—"
                    : live
                    ? `closes in ${fmtDuration(st.minutesToEdge)}`
                    : st.nextOpenDay
                    ? `opens ${st.nextOpenDay} ${String(Math.floor(w.openMin / 60)).padStart(2, "0")}:${String(w.openMin % 60).padStart(2, "0")}`
                    : `opens in ${fmtDuration(st.minutesToEdge)}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* ── Pulse card ───────────────────────────────────────────────────────────── */
function PulseCard({ q, name, symbol }: { q: Quote | undefined; name: string; symbol: string }) {
  const tone = toneFor(q?.changePct);
  return (
    <div className="group/pulse relative overflow-hidden rounded-xl border border-border/50 bg-muted/[0.06] p-3 transition-colors hover:border-border">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-10 opacity-60 transition-opacity duration-300 group-hover/pulse:opacity-100"
        style={{ background: `linear-gradient(0deg, ${a(tone, 10)}, transparent)` }}
      />
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-mono text-xs font-bold text-foreground">{symbol}</div>
          <div className="truncate text-[10px] text-muted-foreground/70">{name}</div>
        </div>
        <ChangeChip pct={q?.changePct} />
      </div>
      <div className="relative mt-2 font-mono text-xl font-bold leading-none tabular-nums text-foreground">
        {q ? fmtPrice(q.price, q.unit) : <span className="inline-block h-5 w-16 animate-pulse rounded bg-muted/50" />}
      </div>
      <div className="relative mt-2 h-6">
        {q?.spark?.length ? <Sparkline data={q.spark} width={180} height={24} /> : null}
      </div>
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

function sentimentTone(score: number | null): string {
  if (score == null) return "var(--muted-foreground)";
  if (score > 0.15) return "var(--success)";
  if (score < -0.15) return "var(--destructive)";
  return "var(--muted-foreground)";
}

export function OverviewTab({ quotesEnv }: { quotesEnv: DataEnvelope<Quote[]> | null }) {
  const bySymbol = new Map((quotesEnv?.data ?? []).map((q) => [q.symbol, q]));
  const { env: newsEnv } = useGmi<NewsArticle[]>("/api/gmi/news", 15 * 60_000);
  const { env: calEnv } = useGmi<CalendarEntry[]>("/api/gmi/calendar", 30 * 60_000);
  const articles = (newsEnv?.data ?? []).slice(0, 7);
  const releases = (calEnv?.data ?? []).filter((e) => e.importance === "high").slice(0, 6);

  return (
    <div className="space-y-4">
      <SessionClock />

      <Panel eyebrow="Cross-asset" title="Market pulse" env={quotesEnv}>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
          {PULSE.map(({ s, name }) => <PulseCard key={s} symbol={s} name={name} q={bySymbol.get(s)} />)}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Panel eyebrow="Wire" title="Latest market news" env={newsEnv}>
          {newsEnv?.status === "unavailable" ? (
            <Unavailable hint="News provider temporarily unavailable. Other data is unaffected." />
          ) : articles.length === 0 ? (
            <Unavailable label="No headlines" />
          ) : (
            <ol className="divide-y divide-border/40">
              {articles.map((art) => (
                <li key={art.id}>
                  <Link href={art.url} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-3 py-2.5">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: sentimentTone(art.sentimentScore) }} />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground transition-colors group-hover:text-primary">{art.title}</p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="font-medium text-foreground/70">{art.source}</span>
                        <span>· {timeAgo(art.publishedAt)}</span>
                        {art.assets[0] && <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] text-primary">{art.assets[0]}</span>}
                      </div>
                    </div>
                    <ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-70" />
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel eyebrow="Macro" title="Recent high-impact releases" env={calEnv}>
          {releases.length === 0 ? (
            <Unavailable label="Loading releases…" />
          ) : (
            <ul className="space-y-1.5">
              {releases.map((e) => {
                const delta = e.actual != null && e.previous != null ? e.actual - e.previous : null;
                return (
                  <li key={e.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/[0.06] px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">{e.label}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {e.referenceDate ? format(new Date(e.referenceDate + "T12:00:00"), "MMM yyyy") : "—"}
                        <span className="ml-1.5 uppercase tracking-wider text-muted-foreground/50">{FRESHNESS_LABEL[e.freshness]}</span>
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-mono text-sm font-bold tabular-nums text-foreground">{fmtRel(e.actual, e.unit)}</div>
                      {delta != null && (
                        <div className="font-mono text-[10px] font-semibold tabular-nums" style={{ color: toneFor(delta) }}>
                          {delta > 0 ? "▲" : delta < 0 ? "▼" : "▬"} vs prev
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      {/* One honest line about the tape itself */}
      <p className="px-1 text-[10px] text-muted-foreground/60">
        Quotes are delayed exchange data via Yahoo{quotesEnv?.asOf ? ` · captured ${timeAgo(quotesEnv.asOf)}` : ""}. Percentage
        moves are versus the prior close. Nothing on this page is a recommendation.
      </p>
    </div>
  );
}
