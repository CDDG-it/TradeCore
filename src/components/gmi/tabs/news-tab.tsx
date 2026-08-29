"use client";

/**
 * NEWS — a focused financial news interface. Filter by asset, category and
 * sentiment; every item links to its original source. Sentiment is Marketaux's
 * own per-entity score (averaged per article) shown as the actual value — never
 * invented, and shown as "no score" when the provider supplies none.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import { timeAgo, useGmi } from "@/lib/gmi/client";
import type { NewsArticle } from "@/lib/gmi/types";
import { Panel, Unavailable } from "../panel";

function sentimentLabel(score: number | null): { label: string; color: string } {
  if (score == null) return { label: "No score", color: "var(--muted-foreground)" };
  if (score > 0.15) return { label: `Positive ${score.toFixed(2)}`, color: "var(--success)" };
  if (score < -0.15) return { label: `Negative ${score.toFixed(2)}`, color: "var(--destructive)" };
  return { label: `Neutral ${score.toFixed(2)}`, color: "var(--muted-foreground)" };
}

export function NewsTab() {
  const { env } = useGmi<NewsArticle[]>("/api/gmi/news", 15 * 60_000);
  const [q, setQ] = useState("");
  const [sent, setSent] = useState<"all" | "pos" | "neu" | "neg">("all");

  const articles = env?.data ?? [];
  const filtered = useMemo(() => {
    return articles.filter((a) => {
      if (q) {
        const hay = `${a.title} ${a.assets.join(" ")} ${a.source}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      if (sent !== "all") {
        const s = a.sentimentScore;
        if (sent === "pos" && !(s != null && s > 0.15)) return false;
        if (sent === "neg" && !(s != null && s < -0.15)) return false;
        if (sent === "neu" && !(s != null && s >= -0.15 && s <= 0.15)) return false;
      }
      return true;
    });
  }, [articles, q, sent]);

  return (
    <Panel title="Financial news" env={env}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by ticker, source…"
            className="w-full rounded-lg border border-border/60 bg-background/40 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-primary/50"
          />
        </div>
        <div className="flex rounded-lg border border-border/60 overflow-hidden">
          {(["all", "pos", "neu", "neg"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setSent(k)}
              className={`px-2.5 py-1.5 text-[11px] font-semibold capitalize transition-colors ${
                sent === k ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {k === "pos" ? "Positive" : k === "neu" ? "Neutral" : k === "neg" ? "Negative" : "All"}
            </button>
          ))}
        </div>
      </div>

      {env?.status === "unavailable" ? (
        <Unavailable hint="Marketaux is temporarily unavailable or the daily request budget is exhausted. Cached articles will return automatically." />
      ) : filtered.length === 0 ? (
        <Unavailable label="No matching articles" />
      ) : (
        <ul className="space-y-2">
          {filtered.map((a) => {
            const s = sentimentLabel(a.sentimentScore);
            return (
              <li key={a.id}>
                <Link
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-lg border border-border/50 bg-muted/10 px-3.5 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/20"
                >
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="tabular-nums">{timeAgo(a.publishedAt)}</span>
                    <span>· {a.source}</span>
                    {a.category && <span className="rounded bg-muted/60 px-1.5 py-0.5 capitalize">{a.category}</span>}
                    <span className="ml-auto font-semibold" style={{ color: s.color }}>{s.label}</span>
                    <ExternalLink className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <p className="mt-1 text-sm font-medium leading-snug text-foreground">{a.title}</p>
                  {a.snippet && <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{a.snippet}</p>}
                  {a.assets.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {a.assets.map((sym) => (
                        <span key={sym} className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] text-primary">{sym}</span>
                      ))}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
