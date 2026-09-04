"use client";

/**
 * NEWS — a clean financial reader. A lead story, quick asset-chip filters
 * derived from what's actually tagged, and a scannable list. Sentiment is
 * Marketaux's own per-entity score shown as a subtle dot (value on hover) —
 * no verbose machine-written labels, nothing invented, every item links out.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { timeAgo, useGmi } from "@/lib/gmi/client";
import type { NewsArticle } from "@/lib/gmi/types";
import { Panel, Unavailable, a } from "../panel";

function sentimentTone(score: number | null): { color: string; title: string } {
  if (score == null) return { color: "var(--muted-foreground)", title: "No sentiment score" };
  if (score > 0.15) return { color: "var(--success)", title: `Sentiment ${score.toFixed(2)} (positive)` };
  if (score < -0.15) return { color: "var(--destructive)", title: `Sentiment ${score.toFixed(2)} (negative)` };
  return { color: "var(--muted-foreground)", title: `Sentiment ${score.toFixed(2)} (neutral)` };
}

function Dot({ score }: { score: number | null }) {
  const d = sentimentTone(score);
  return (
    <span
      className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ background: d.color, boxShadow: `0 0 0 3px ${a(d.color, 14)}` }}
      title={d.title}
    />
  );
}

function AssetChips({ assets, max = 5 }: { assets: string[]; max?: number }) {
  if (assets.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {assets.slice(0, max).map((s) => (
        <span key={s} className="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-primary">{s}</span>
      ))}
    </div>
  );
}

export function NewsTab() {
  const { env } = useGmi<NewsArticle[]>("/api/gmi/news", 15 * 60_000);
  const [q, setQ] = useState("");
  const [asset, setAsset] = useState<string | null>(null);

  const articles = useMemo(() => env?.data ?? [], [env]);

  // Asset chips from what's actually tagged, most frequent first.
  const topAssets = useMemo(() => {
    const freq = new Map<string, number>();
    for (const art of articles) for (const s of art.assets) freq.set(s, (freq.get(s) ?? 0) + 1);
    return [...freq.entries()].sort((x, y) => y[1] - x[1]).slice(0, 8).map(([s]) => s);
  }, [articles]);

  const filtered = useMemo(() => {
    return articles.filter((art) => {
      if (asset && !art.assets.includes(asset)) return false;
      if (q) {
        const hay = `${art.title} ${art.assets.join(" ")} ${art.source}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [articles, q, asset]);

  const [lead, ...rest] = filtered;

  return (
    <Panel
      eyebrow="Wire"
      title="Financial news"
      env={env}
      subtitle={filtered.length ? `${filtered.length} article${filtered.length !== 1 ? "s" : ""}${asset ? ` · ${asset}` : ""}` : undefined}
    >
      {/* Search + asset filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-44 max-w-72 flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search headlines…"
            className="w-full rounded-lg border border-border/60 bg-background/40 py-1.5 pl-8 pr-3 text-xs outline-none transition-colors focus:border-primary/50"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setAsset(null)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${asset === null ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:text-foreground"}`}
          >
            All
          </button>
          {topAssets.map((s) => (
            <button
              key={s}
              onClick={() => setAsset(asset === s ? null : s)}
              className={`rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold transition-colors ${asset === s ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:text-foreground"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {env?.status === "unavailable" ? (
        <Unavailable hint="Marketaux is temporarily unavailable or the daily request budget is exhausted. Cached articles return automatically." />
      ) : filtered.length === 0 ? (
        <Unavailable label="No matching articles" hint={q || asset ? "Try clearing the search or the asset filter." : undefined} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
          {/* Lead story */}
          {lead && (
            <Link
              href={lead.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/60 p-5 transition-colors hover:border-primary/40"
              style={{ background: `linear-gradient(155deg, ${a("var(--primary)", 7)}, transparent 55%), var(--muted)` }}
            >
              <div>
                <div className="mb-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Dot score={lead.sentimentScore} />
                  <span className="font-semibold text-foreground/80">{lead.source}</span>
                  <span>· {timeAgo(lead.publishedAt)}</span>
                  <ArrowUpRight className="ml-auto h-4 w-4 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-70" />
                </div>
                <h3 className="text-xl font-bold leading-snug tracking-tight text-foreground">{lead.title}</h3>
                {lead.snippet && <p className="mt-2.5 line-clamp-4 text-xs leading-relaxed text-muted-foreground">{lead.snippet}</p>}
              </div>
              <div className="mt-4"><AssetChips assets={lead.assets} /></div>
            </Link>
          )}

          {/* The rest */}
          <ul className="divide-y divide-border/40">
            {rest.map((art) => (
              <li key={art.id}>
                <Link
                  href={art.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex gap-3 rounded-lg px-1 py-2.5 transition-colors hover:bg-muted/20"
                >
                  <Dot score={art.sentimentScore} />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground transition-colors group-hover:text-primary">{art.title}</p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="font-medium text-foreground/70">{art.source}</span>
                      <span>· {timeAgo(art.publishedAt)}</span>
                      <AssetChips assets={art.assets} max={2} />
                    </div>
                  </div>
                  <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-60" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-4 border-t border-border/40 pt-2.5 text-[10px] text-muted-foreground/60">
        Dot colour = Marketaux per-entity sentiment (hover for the value). Descriptive, provider-supplied — never a call.
      </p>
    </Panel>
  );
}
