"use client";

import { useState } from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { Search, Zap, TrendingUp, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getNews, getFeaturedNews } from "@/lib/mock/store";
import { cn } from "@/lib/utils";
import type { ImpactLevel } from "@/lib/types";

function ImpactBadge({ level }: { level: ImpactLevel }) {
  const config = {
    high: { cls: "bg-destructive/15 text-destructive border-destructive/20", icon: Zap },
    medium: { cls: "bg-warning/15 text-warning border-warning/20", icon: TrendingUp },
    low: { cls: "bg-muted text-muted-foreground border-border", icon: null },
  };
  const { cls, icon: Icon } = config[level];
  return (
    <Badge className={cn("text-xs capitalize flex items-center gap-1", cls)}>
      {Icon && <Icon className="w-2.5 h-2.5" />}
      {level}
    </Badge>
  );
}

export default function NewsPage() {
  const [search, setSearch] = useState("");
  const [filterImpact, setFilterImpact] = useState<ImpactLevel | "all">("all");
  const [filterMarket, setFilterMarket] = useState<"all" | "futures" | "commodities">("all");

  const featured = getFeaturedNews();
  const allNews = getNews({
    impact: filterImpact !== "all" ? filterImpact : undefined,
    market: filterMarket !== "all" ? filterMarket : undefined,
  }).filter((n) => {
    if (!search) return true;
    return (
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.summary.toLowerCase().includes(search.toLowerCase()) ||
      n.asset_tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    );
  });

  // Non-featured news
  const regularNews = allNews.filter((n) => !n.is_featured);
  const filteredFeatured = allNews.filter((n) => n.is_featured);

  const showFeatured = filterImpact === "all" && filterMarket === "all" && !search;

  return (
    <div className="space-y-6">
      <PageHeader badge="Markets" title="News" subtitle="High-impact events and market intel" />
      <PageWrapper>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search news or assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-card border-border/50"
          />
        </div>

        <div className="flex rounded-lg border border-border/50 overflow-hidden">
          {(["all", "high", "medium", "low"] as const).map((i) => (
            <button
              key={i}
              onClick={() => setFilterImpact(i)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors capitalize",
                filterImpact === i
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {i}
            </button>
          ))}
        </div>

        <div className="flex rounded-lg border border-border/50 overflow-hidden">
          {(["all", "futures", "commodities"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setFilterMarket(m)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors capitalize",
                filterMarket === m
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Featured section */}
      {showFeatured && featured.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-warning" />
            <h2 className="text-sm font-semibold">Featured</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {featured.map((item) => (
              <Card
                key={item.id}
                className="bg-card border-border/50 hover:border-primary/30 transition-colors"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <ImpactBadge level={item.impact_level} />
                    <div className="flex flex-wrap gap-1 justify-end">
                      {item.asset_tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded capitalize"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold leading-snug mb-2">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    {item.summary}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground/60">
                    <span className="font-medium">{item.source_name}</span>
                    <span>{format(new Date(item.published_at), "MMM d, h:mm a")}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All news */}
      <div>
        {showFeatured && <h2 className="text-sm font-semibold mb-3">All News</h2>}
        {allNews.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No news found matching your filters.
          </div>
        ) : (
          <Card className="bg-card border-border/50">
            <div className="divide-y divide-border/40">
              {(showFeatured ? regularNews : allNews).map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-muted/20 transition-colors"
                >
                  {/* Impact indicator */}
                  <div
                    className={cn(
                      "w-1 self-stretch rounded-full shrink-0 mt-1",
                      item.impact_level === "high"
                        ? "bg-destructive"
                        : item.impact_level === "medium"
                        ? "bg-warning"
                        : "bg-muted-foreground/30"
                    )}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h3 className="text-sm font-medium leading-snug">{item.title}</h3>
                      <ImpactBadge level={item.impact_level} />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2 line-clamp-2">
                      {item.summary}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground/60">
                      <span className="font-medium text-muted-foreground/80">{item.source_name}</span>
                      <span>·</span>
                      <span>{format(new Date(item.published_at), "MMM d, h:mm a")}</span>
                      <span>·</span>
                      <div className="flex gap-1">
                        {item.asset_tags.map((tag) => (
                          <span key={tag} className="capitalize bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Market pulse summary */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Market Pulse</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "High Impact",
              count: getNews().filter((n) => n.impact_level === "high").length,
              color: "text-destructive",
              bg: "bg-destructive/5 border-destructive/20",
            },
            {
              label: "Medium Impact",
              count: getNews().filter((n) => n.impact_level === "medium").length,
              color: "text-warning",
              bg: "bg-warning/5 border-warning/20",
            },
            {
              label: "Low Impact",
              count: getNews().filter((n) => n.impact_level === "low").length,
              color: "text-muted-foreground",
              bg: "bg-muted/30 border-border/50",
            },
          ].map(({ label, count, color, bg }) => (
            <div
              key={label}
              className={cn("rounded-xl border p-4 text-center", bg)}
            >
              <p className={cn("text-2xl font-bold", color)}>{count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>
      </PageWrapper>
    </div>
  );
}
