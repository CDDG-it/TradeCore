"use client";

/**
 * OVERVIEW — understand the global tape in seconds: a pulse grid, the globe, and
 * a timestamped stream of the latest market news. Objective only: it shows what
 * moved and what was reported, never an interpretation or a call.
 */
import dynamic from "next/dynamic";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { fmtPrice, fmtPct, toneFor, timeAgo, useGmi } from "@/lib/gmi/client";
import type { DataEnvelope, Quote, NewsArticle } from "@/lib/gmi/types";
import { Panel, Unavailable } from "../panel";
import { Sparkline } from "../sparkline";

const WorldMap3D = dynamic(
  () => import("@/components/news-city/WorldMap3D").then((m) => m.WorldMap3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">Spinning up the globe…</p>
      </div>
    ),
  }
);

const PULSE = ["NQ", "ES", "YM", "RTY", "VIX", "DXY", "US10Y", "GC", "CL"];

function PulseCard({ q }: { q: Quote | undefined }) {
  const tone = toneFor(q?.changePct);
  return (
    <div className="rounded-xl border border-border/50 bg-muted/10 p-3">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-xs font-bold text-foreground">{q?.symbol ?? "—"}</span>
        <span className="font-mono text-[11px] font-semibold tabular-nums" style={{ color: tone }}>
          {q ? fmtPct(q.changePct) : "—"}
        </span>
      </div>
      <div className="mt-1 font-mono text-lg font-bold tabular-nums text-foreground/90">
        {q ? fmtPrice(q.price, q.unit) : "—"}
      </div>
      <div className="mt-1.5 h-6">{q?.spark?.length ? <Sparkline data={q.spark} width={140} height={24} /> : null}</div>
    </div>
  );
}

export function OverviewTab({ quotesEnv }: { quotesEnv: DataEnvelope<Quote[]> | null }) {
  const bySymbol = new Map((quotesEnv?.data ?? []).map((q) => [q.symbol, q]));
  const { env: newsEnv } = useGmi<NewsArticle[]>("/api/gmi/news", 15 * 60_000);
  const articles = (newsEnv?.data ?? []).slice(0, 8);

  return (
    <div className="space-y-4">
      {/* A. Market pulse */}
      <Panel title="Market pulse" env={quotesEnv}>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
          {PULSE.map((s) => (
            <PulseCard key={s} q={bySymbol.get(s)} />
          ))}
        </div>
      </Panel>

      {/* B + C. World map + latest headlines */}
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="World" className="flex flex-col">
          <div
            className="relative w-full overflow-hidden rounded-xl"
            style={{ height: "clamp(320px, 46vh, 520px)", background: "#0b1120" }}
          >
            <WorldMap3D />
            <p className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-2 text-center text-[10px] text-muted-foreground">
              Drag to spin · scroll to zoom · full country detail in the World tab
            </p>
          </div>
        </Panel>

        <Panel title="Latest market news" env={newsEnv}>
          {newsEnv?.status === "unavailable" ? (
            <Unavailable hint="The news provider is temporarily unavailable. Other data on this page is unaffected." />
          ) : articles.length === 0 ? (
            <Unavailable label="No headlines" />
          ) : (
            <ol className="space-y-2.5">
              {articles.map((a) => (
                <li key={a.id}>
                  <Link
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block rounded-lg border border-border/50 bg-muted/10 px-3 py-2 transition-colors hover:border-primary/40 hover:bg-muted/20"
                  >
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="tabular-nums">{timeAgo(a.publishedAt)}</span>
                      <span className="truncate">· {a.source}</span>
                      <ExternalLink className="ml-auto h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs font-medium leading-snug text-foreground">{a.title}</p>
                    {a.assets.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {a.assets.slice(0, 4).map((s) => (
                          <span key={s} className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] text-primary">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </div>
  );
}
