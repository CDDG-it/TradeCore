"use client";

/**
 * 04 NEWS — the wire, at length.
 *
 * The lead story gets room to be read; everything else runs as a dense feed you
 * can scan by time. Sentiment is Marketaux's own per-entity score, shown as a
 * mark in the margin — provider-supplied, never a call, never a written verdict.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { timeAgo, useGmi } from "@/lib/gmi/client";
import type { NewsArticle } from "@/lib/gmi/types";
import { Pane, Empty, Label } from "../pane";

function sentimentColor(score: number | null): string {
  if (score == null) return "var(--muted-foreground)";
  if (score > 0.15) return "var(--success)";
  if (score < -0.15) return "var(--destructive)";
  return "var(--muted-foreground)";
}

export function NewsTab() {
  const { env } = useGmi<NewsArticle[]>("/api/gmi/news", 15 * 60_000);
  const [q, setQ] = useState("");
  const [asset, setAsset] = useState<string | null>(null);

  const articles = useMemo(() => env?.data ?? [], [env]);

  const topAssets = useMemo(() => {
    const freq = new Map<string, number>();
    for (const art of articles) for (const s of art.assets) freq.set(s, (freq.get(s) ?? 0) + 1);
    return [...freq.entries()].sort((x, y) => y[1] - x[1]).slice(0, 10).map(([s]) => s);
  }, [articles]);

  const filtered = useMemo(
    () =>
      articles.filter((art) => {
        if (asset && !art.assets.includes(asset)) return false;
        if (q) {
          const hay = `${art.title} ${art.assets.join(" ")} ${art.source}`.toLowerCase();
          if (!hay.includes(q.toLowerCase())) return false;
        }
        return true;
      }),
    [articles, q, asset]
  );

  const [lead, ...rest] = filtered;

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-2 lg:grid-cols-12">
      {/* ── Lead ──────────────────────────────────────────────────────── */}
      <Pane index="01" label="Lead story" className="min-h-[220px] lg:col-span-4" bodyClassName="p-0">
        {env?.status === "unavailable" ? (
          <Empty label="Wire down" hint="Marketaux is unavailable or the daily request budget is spent. Cached articles return by themselves." />
        ) : !lead ? (
          <Empty label="No article" hint={q || asset ? "Nothing matches the current filter." : undefined} />
        ) : (
          <Link
            href={lead.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex h-full flex-col justify-between p-4 transition-colors hover:bg-muted/10"
          >
            <div className="min-h-0">
              <div className="flex items-baseline gap-2">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: sentimentColor(lead.sentimentScore) }} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/55">{lead.source}</span>
                <span className="text-[10px] tabular-nums text-muted-foreground/35">{timeAgo(lead.publishedAt)}</span>
              </div>
              <h2 className="mt-3 font-heading text-[19px] font-bold leading-[1.25] tracking-tight text-foreground transition-colors group-hover:text-primary">
                {lead.title}
              </h2>
              {lead.snippet && (
                <p className="mt-3 line-clamp-6 text-[12px] leading-relaxed text-muted-foreground/80">{lead.snippet}</p>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border/30 pt-3">
              {lead.assets.slice(0, 6).map((s) => (
                <span key={s} className="border border-border/50 px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-primary/80">{s}</span>
              ))}
            </div>
          </Link>
        )}
      </Pane>

      {/* ── Feed ──────────────────────────────────────────────────────── */}
      <Pane
        index="02"
        label="Feed"
        right={
          <span className="flex items-center gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="filter…"
              className="w-28 border-b border-border/50 bg-transparent pb-px text-[11px] text-foreground outline-none placeholder:text-muted-foreground/35 focus:border-primary"
            />
            <Label className="tracking-[0.18em]">{filtered.length} items</Label>
          </span>
        }
        bodyClassName="flex flex-col p-0"
        className="lg:col-span-8"
      >
        {/* Asset filter — words, no chips-with-icons */}
        <div className="scrollbar-none flex shrink-0 items-center gap-3 overflow-x-auto border-b border-border/30 px-3 py-1.5">
          <button
            onClick={() => setAsset(null)}
            className={`shrink-0 border-b pb-px text-[11px] font-semibold uppercase tracking-wider transition-colors ${
              asset === null ? "border-primary text-primary" : "border-transparent text-muted-foreground/50 hover:text-foreground"
            }`}
          >
            All
          </button>
          {topAssets.map((s) => (
            <button
              key={s}
              onClick={() => setAsset(asset === s ? null : s)}
              className={`shrink-0 border-b pb-px font-mono text-[10px] tracking-[0.1em] transition-colors ${
                asset === s ? "border-primary text-primary" : "border-transparent text-muted-foreground/50 hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {rest.length === 0 ? (
            <Empty label="Nothing else on the wire" />
          ) : (
            <ol>
              {rest.map((art) => (
                <li key={art.id} className="border-b border-border/20 last:border-0">
                  <Link
                    href={art.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-baseline gap-3 px-3 py-[7px] transition-colors hover:bg-muted/20"
                  >
                    <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground/40">
                      {format(parseISO(art.publishedAt), "HH:mm")}
                    </span>
                    <span aria-hidden className="mt-[5px] h-[3px] w-[3px] shrink-0 rounded-full" style={{ background: sentimentColor(art.sentimentScore) }} />
                    <span className="min-w-0 flex-1 truncate text-[12px] text-foreground/90 transition-colors group-hover:text-primary">
                      {art.title}
                    </span>
                    {art.assets[0] && <span className="shrink-0 font-mono text-[9px] tracking-wider text-primary/70">{art.assets[0]}</span>}
                    <span className="hidden w-28 shrink-0 truncate text-right text-[10px] uppercase tracking-wider text-muted-foreground/35 xl:inline">
                      {art.source}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>

        <p className="shrink-0 border-t border-border/30 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/35">
          Margin mark = provider sentiment · green positive, red negative, grey neutral or unscored
        </p>
      </Pane>
    </div>
  );
}
