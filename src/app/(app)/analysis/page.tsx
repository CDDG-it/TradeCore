"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, Search, TrendingUp, TrendingDown, Minus, ArrowRight, LinkIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getAnalyses } from "@/lib/mock/store";
import { cn } from "@/lib/utils";
import type { Bias, Market } from "@/lib/types";

function BiasBadge({ bias }: { bias: Bias }) {
  if (bias === "bullish")
    return (
      <span className="flex items-center gap-1 text-success text-xs font-medium">
        <TrendingUp className="w-3 h-3" /> Bullish
      </span>
    );
  if (bias === "bearish")
    return (
      <span className="flex items-center gap-1 text-destructive text-xs font-medium">
        <TrendingDown className="w-3 h-3" /> Bearish
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-muted-foreground text-xs font-medium">
      <Minus className="w-3 h-3" /> Neutral
    </span>
  );
}

function MarketBadge({ market }: { market: Market }) {
  const colors: Record<Market, string> = {
    futures: "bg-primary/10 text-primary border-primary/20",
    commodities: "bg-warning/10 text-warning border-warning/20",
  };
  return (
    <Badge className={cn("text-xs capitalize", colors[market])}>
      {market}
    </Badge>
  );
}

export default function AnalysisPage() {
  const allAnalyses = getAnalyses();
  const [search, setSearch] = useState("");
  const [filterBias, setFilterBias] = useState<Bias | "all">("all");
  const [filterMarket, setFilterMarket] = useState<Market | "all">("all");

  const filtered = allAnalyses.filter((a) => {
    const matchSearch =
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.instrument.toLowerCase().includes(search.toLowerCase());
    const matchBias = filterBias === "all" || a.bias === filterBias;
    const matchMarket = filterMarket === "all" || a.market === filterMarket;
    return matchSearch && matchBias && matchMarket;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pre-Trade Analysis</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {allAnalyses.length} analyses · structured prep before every trade
          </p>
        </div>
        <Link
          href="/analysis/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          New analysis
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search instrument or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-card border-border/50"
          />
        </div>

        {/* Bias filter */}
        <div className="flex rounded-lg border border-border/50 overflow-hidden">
          {(["all", "bullish", "bearish", "neutral"] as const).map((b) => (
            <button
              key={b}
              onClick={() => setFilterBias(b)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors capitalize",
                filterBias === b
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {b}
            </button>
          ))}
        </div>

        {/* Market filter */}
        <div className="flex rounded-lg border border-border/50 overflow-hidden">
          {(["all", "futures", "commodities"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setFilterMarket(m as Market | "all")}
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

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No analyses found.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((analysis) => (
            <Link key={analysis.id} href={`/analysis/${analysis.id}`}>
              <Card className="bg-card border-border/50 hover:border-primary/30 transition-colors h-full">
                <CardContent className="p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold tracking-tight">
                        {analysis.instrument}
                      </span>
                      <MarketBadge market={analysis.market} />
                    </div>
                    {analysis.used_for_trade && (
                      <Badge className="text-xs bg-primary/10 text-primary border-primary/20 shrink-0">
                        <LinkIcon className="w-2.5 h-2.5 mr-1" />
                        Traded
                      </Badge>
                    )}
                  </div>

                  {/* Title */}
                  <p className="text-sm font-medium leading-snug mb-2 line-clamp-2">
                    {analysis.title}
                  </p>

                  {/* Thesis */}
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                    {analysis.thesis}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/40">
                    <BiasBadge bias={analysis.bias} />
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{analysis.session}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(analysis.date), "MMM d")}
                      </span>
                    </div>
                  </div>

                  {/* Confluences */}
                  {analysis.confluences.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {analysis.confluences.slice(0, 3).map((c) => (
                        <span
                          key={c}
                          className="text-xs bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-md"
                        >
                          {c}
                        </span>
                      ))}
                      {analysis.confluences.length > 3 && (
                        <span className="text-xs text-muted-foreground/60">
                          +{analysis.confluences.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
