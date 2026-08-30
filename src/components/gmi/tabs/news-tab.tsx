"use client";

/**
 * NEWS — a clean, interactive financial reader. A lead story, quick asset-chip
 * filters derived from what's actually tagged, and a scannable list. Sentiment
 * is Marketaux's own per-entity score shown as a subtle dot (value on hover) —
 * no verbose machine-written labels, nothing invented, every item links out.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import { timeAgo, useGmi } from "@/lib/gmi/client";
import type { NewsArticle } from "@/lib/gmi/types";
import { Panel, Unavailable } from "../panel";

function sentimentDot(score: number | null): { color: string; title: string } {
  if (score == null) return { color: "var(--muted-foreground)", title: "No sentiment score" };
  if (score > 0.15) return { color: "var(--success)", title: `Sentiment ${score.toFixed(2)} (positive)` };
  if (score < -0.15) return { color: "var(--destructive)", title: `Sentiment ${score.toFixed(2)} (negative)` };
  return { color: "var(--muted-foreground)", title: `Sentiment ${score.toFixed(2)} (neutral)` };
}

function AssetChips({ assets }: { assets: string[] }) {
  if (assets.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {assets.slice(0, 5).map((s) => (
        <span key={s} className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] text-primary">{s}</span>
      ))}
    </div>
  );
}

function Dot({ score }: { score: number | null }) {
  const d = sentimentDot(score);
  return <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: d.color }} title={d.title} />;
}

export function NewsTab() {
  const { env } = useGmi<NewsArticle[]>("/api/gmi/news", 15 * 60_000);
  const [q, setQ] = useState("");
  const [asset, setAsset] = useState<string | null>(null);

  const articles = env?.data ?? [];

  // Asset chips from what's actually tagged, most frequent first.
  const topAssets = useMemo(() => {
    const freq = new Map<string, number>();
    for (const a of articles) for (const s of a.assets) freq.set(s, (freq.get(s) ?? 0) + 1);
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([s]) => s);
  }, [articles]);

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      if (asset && !a.assets.includes(asset)) return false;
      if (q) {
        const hay = `${a.title} ${a.assets.join(" ")} ${a.source}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [articles, q, asset]);

  const [lead, ...rest] = filtered;

  return (
    <Panel title="Financial news" env={env}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-44 max-w-72">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search headlines…"
            className="w-full rounded-lg border border-border/60 bg-background/40 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-primary/50"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <button onClick={() => setAsset(null)} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${asset === null ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:text-foreground"}`}>All</button>
          {topAssets.map((s) => (
            <button key={s} onClick={() => setAsset(asset === s ? null : s)} className={`rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold transition-colors ${asset === s ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:text-foreground"}`}>{s}</button>
          ))}
        </div>
      </div>

      {env?.status === "unavailable" ? (
        <Unavailable hint="Marketaux is temporarily unavailable or the daily request budget is exhausted. Cached articles return automatically." />
      ) : filtered.length === 0 ? (
        <Unavailable label="No matching articles" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          {/* Lead story */}
          {lead && (
            <Link
              href={lead.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col justify-between rounded-2xl border border-border/60 bg-gradient-to-br from-muted/25 to-transparent p-4 transition-colors hover:border-primary/40"
            >
              <div>
                <div className="mb-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Dot score={lead.sentimentScore} />
                  <span className="font-semibold text-foreground/80">{lead.source}</span>
                  <span>· {timeAgo(lead.publishedAt)}</span>
                  <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <h3 className="text-lg font-bold leading-snug text-foreground">{lead.title}</h3>
                {lead.snippet && <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{lead.snippet}</p>}
              </div>
              <div className="mt-3"><AssetChips assets={lead.assets} /></div>
            </Link>
          )}

          {/* The rest */}
          <ul className="divide-y divide-border/40">
            {rest.map((a) => (
              <li key={a.id}>
                <Link
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex gap-3 py-2.5 transition-colors"
                >
                  <Dot score={a.sentimentScore} />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground group-hover:text-primary">{a.title}</p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{a.source}</span>
                      <span>· {timeAgo(a.publishedAt)}</span>
                      {a.assets[0] && <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] text-primary">{a.assets[0]}</span>}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-3 text-[10px] text-muted-foreground/60">
        Dot colour = Marketaux per-entity sentiment (hover for the value). Descriptive, provider-supplied — never a call.
      </p>
    </Panel>
  );
}
