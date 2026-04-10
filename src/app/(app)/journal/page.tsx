"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  Filter,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getTrades } from "@/lib/mock/store";
import { cn } from "@/lib/utils";
import type { TradeResult, Direction } from "@/lib/types";

function ResultBadge({ result }: { result: TradeResult }) {
  const config = {
    win: "bg-success/15 text-success border-success/20",
    loss: "bg-destructive/15 text-destructive border-destructive/20",
    "break-even": "bg-warning/15 text-warning border-warning/20",
  };
  const labels = { win: "Win", loss: "Loss", "break-even": "B/E" };
  return (
    <Badge className={cn("text-xs", config[result])}>{labels[result]}</Badge>
  );
}

function DirectionIcon({ direction }: { direction: Direction }) {
  if (direction === "long")
    return <TrendingUp className="w-3.5 h-3.5 text-success" />;
  return <TrendingDown className="w-3.5 h-3.5 text-destructive" />;
}

export default function JournalPage() {
  const allTrades = getTrades();
  const [search, setSearch] = useState("");
  const [filterResult, setFilterResult] = useState<TradeResult | "all">("all");
  const [filterDirection, setFilterDirection] = useState<Direction | "all">("all");

  const filtered = allTrades.filter((t) => {
    const matchSearch =
      !search ||
      t.instrument.toLowerCase().includes(search.toLowerCase()) ||
      t.setup.toLowerCase().includes(search.toLowerCase());
    const matchResult = filterResult === "all" || t.result === filterResult;
    const matchDir = filterDirection === "all" || t.direction === filterDirection;
    return matchSearch && matchResult && matchDir;
  });

  const wins = allTrades.filter((t) => t.result === "win").length;
  const losses = allTrades.filter((t) => t.result === "loss").length;
  const bes = allTrades.filter((t) => t.result === "break-even").length;
  const totalPnl = allTrades.reduce((s, t) => s + t.pnl, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trade Journal</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {allTrades.length} trades logged
          </p>
        </div>
        <Link
          href="/journal/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Log trade
        </Link>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total P&L", value: `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toLocaleString()}`, color: totalPnl >= 0 ? "text-success" : "text-destructive" },
          { label: "Wins", value: wins.toString(), color: "text-success" },
          { label: "Losses", value: losses.toString(), color: "text-destructive" },
          { label: "Break-Even", value: bes.toString(), color: "text-warning" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border/50 rounded-xl p-4 text-center">
            <p className={cn("text-xl font-bold", color)}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search instrument or setup..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-card border-border/50"
          />
        </div>

        <div className="flex rounded-lg border border-border/50 overflow-hidden">
          {(["all", "win", "loss", "break-even"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setFilterResult(r)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors capitalize",
                filterResult === r
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {r === "break-even" ? "B/E" : r}
            </button>
          ))}
        </div>

        <div className="flex rounded-lg border border-border/50 overflow-hidden">
          {(["all", "long", "short"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setFilterDirection(d)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors capitalize",
                filterDirection === d
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Trade list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No trades found.
        </div>
      ) : (
        <Card className="bg-card border-border/50">
          <div className="divide-y divide-border/40">
            {filtered.map((trade) => (
              <Link
                key={trade.id}
                href={`/journal/${trade.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors"
              >
                {/* Direction + result */}
                <div className="flex items-center gap-2 w-16 shrink-0">
                  <DirectionIcon direction={trade.direction} />
                  <ResultBadge result={trade.result} />
                </div>

                {/* Instrument + setup */}
                <div className="w-20 shrink-0">
                  <p className="text-sm font-bold">{trade.instrument}</p>
                  <p className="text-xs text-muted-foreground capitalize">{trade.market}</p>
                </div>

                {/* Setup */}
                <div className="flex-1 min-w-0 hidden sm:block">
                  <p className="text-sm text-foreground/90 truncate">{trade.setup}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {trade.confluences.slice(0, 2).map((c) => (
                      <span
                        key={c}
                        className="text-xs bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                {/* RR */}
                <div className="text-center w-14 shrink-0 hidden md:block">
                  <p className="text-sm font-semibold">{trade.rr}R</p>
                  <p className="text-xs text-muted-foreground">R:R</p>
                </div>

                {/* Session */}
                <div className="text-center w-20 shrink-0 hidden lg:block">
                  <p className="text-xs text-muted-foreground">{trade.session}</p>
                </div>

                {/* PnL + date */}
                <div className="text-right shrink-0 ml-auto">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      trade.pnl > 0
                        ? "text-success"
                        : trade.pnl < 0
                        ? "text-destructive"
                        : "text-muted-foreground"
                    )}
                  >
                    {trade.pnl > 0 ? "+" : ""}${trade.pnl.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(trade.date_time), "MMM d")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
