"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp, Shield, AlertTriangle, Lightbulb,
  Eye, Zap, Brain, BarChart2, Target, RefreshCw,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getTrades, getHabits, getHabitCompletions, getPlaybook,
  generateCoachingInsights, getAvgDisciplineScore,
} from "@/lib/mock/store";
import { cn } from "@/lib/utils";
import type { CoachingInsight, InsightType, InsightCategory } from "@/lib/types";

const TYPE_CONFIG: Record<InsightType, {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}> = {
  strength: {
    label: "Strength",
    icon: TrendingUp,
    color: "oklch(0.72 0.17 145)",
    bg: "oklch(0.72 0.17 145 / 0.08)",
  },
  weakness: {
    label: "Weakness",
    icon: AlertTriangle,
    color: "oklch(0.65 0.22 25)",
    bg: "oklch(0.65 0.22 25 / 0.08)",
  },
  pattern: {
    label: "Pattern",
    icon: BarChart2,
    color: "oklch(0.72 0.14 220)",
    bg: "oklch(0.72 0.14 220 / 0.08)",
  },
  suggestion: {
    label: "Suggestion",
    icon: Lightbulb,
    color: "oklch(0.74 0.13 82)",
    bg: "oklch(0.74 0.13 82 / 0.08)",
  },
  blind_spot: {
    label: "Blind Spot",
    icon: Eye,
    color: "oklch(0.70 0.18 310)",
    bg: "oklch(0.70 0.18 310 / 0.08)",
  },
};

const CATEGORY_LABELS: Record<InsightCategory, string> = {
  performance: "Performance",
  discipline: "Discipline",
  psychology: "Psychology",
  market: "Market",
  habits: "Habits",
};

const CONFIDENCE_CONFIG = {
  high: { label: "High confidence", dots: 3, color: "oklch(0.72 0.17 145)" },
  medium: { label: "Medium confidence", dots: 2, color: "oklch(0.74 0.13 82)" },
  low: { label: "Low confidence", dots: 1, color: "oklch(0.88 0.008 252 / 40%)" },
};

function InsightCard({ insight }: { insight: CoachingInsight }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[insight.type];
  const confCfg = CONFIDENCE_CONFIG[insight.confidence];
  const Icon = cfg.icon;

  return (
    <Card
      className="shadow-sm transition-all duration-200 hover:shadow-md"
      style={{ borderColor: cfg.color + " / 0.20)" }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: cfg.bg }}
          >
            <Icon className="w-4.5 h-4.5" style={{ color: cfg.color }} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-sm font-semibold text-foreground leading-snug">
                {insight.title}
              </p>
              <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                {/* Confidence dots */}
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3].map((d) => (
                    <div
                      key={d}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: d <= confCfg.dots
                          ? confCfg.color
                          : "oklch(1 0 0 / 8%)",
                      }}
                    />
                  ))}
                </div>
                <span
                  className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                  style={{ background: cfg.bg, color: cfg.color }}
                >
                  {cfg.label}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
              {insight.description}
            </p>

            {/* Category + timeframe pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  background: "oklch(1 0 0 / 5%)",
                  color: "oklch(0.88 0.008 252 / 50%)",
                }}
              >
                {CATEGORY_LABELS[insight.category]}
              </span>
              <span
                className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  background: "oklch(1 0 0 / 5%)",
                  color: "oklch(0.88 0.008 252 / 50%)",
                }}
              >
                {insight.timeframe.replace("_", " ")}
              </span>
            </div>

            {/* Data points — collapsible */}
            {insight.data_points.length > 0 && (
              <div className="mt-2.5">
                <button
                  onClick={() => setExpanded((p) => !p)}
                  className="flex items-center gap-1 text-[10px] font-semibold transition-colors"
                  style={{ color: cfg.color }}
                >
                  Data points
                  {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {expanded && (
                  <ul className="mt-1.5 space-y-1">
                    {insight.data_points.map((pt, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                        <span style={{ color: cfg.color, marginTop: 1.5 }}>·</span>
                        {pt}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type FilterType = InsightType | "all";
type FilterCategory = InsightCategory | "all";

export default function CoachingPage() {
  const [insights, setInsights] = useState<CoachingInsight[]>([]);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
  const [tradeCount, setTradeCount] = useState(0);
  const [avgDiscipline, setAvgDiscipline] = useState(0);
  const [loading, setLoading] = useState(true);

  function loadInsights() {
    setLoading(true);
    const trades = getTrades();
    const habits = getHabits();
    const completions = getHabitCompletions();
    const playbook = getPlaybook();
    const generated = generateCoachingInsights(trades, habits, completions, playbook);
    setInsights(generated);
    setTradeCount(trades.length);
    setAvgDiscipline(getAvgDisciplineScore(trades));
    setLoading(false);
  }

  useEffect(() => { loadInsights(); }, []);

  const filtered = insights.filter((i) => {
    if (filterType !== "all" && i.type !== filterType) return false;
    if (filterCategory !== "all" && i.category !== filterCategory) return false;
    return true;
  });

  const counts: Record<InsightType, number> = {
    strength: 0, weakness: 0, pattern: 0, suggestion: 0, blind_spot: 0,
  };
  insights.forEach((i) => counts[i.type]++);

  const disciplineColor =
    avgDiscipline >= 80 ? "oklch(0.72 0.17 145)"
    : avgDiscipline >= 60 ? "oklch(0.74 0.13 82)"
    : "oklch(0.65 0.22 25)";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "oklch(0.93 0.008 252)" }}
          >
            Performance Coaching
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Data-driven insights from your trading history
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadInsights}
          className="gap-1.5 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Trades Analyzed",
            value: tradeCount,
            icon: BarChart2,
            color: "oklch(0.72 0.14 220)",
          },
          {
            label: "Avg Discipline",
            value: avgDiscipline > 0 ? avgDiscipline : "—",
            icon: Shield,
            color: disciplineColor,
          },
          {
            label: "Insights",
            value: insights.length,
            icon: Brain,
            color: "oklch(0.74 0.13 82)",
          },
          {
            label: "Action Items",
            value: counts.suggestion + counts.weakness,
            icon: Target,
            color: "oklch(0.65 0.22 25)",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </div>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Type breakdown */}
      <div className="grid grid-cols-5 gap-2">
        {(Object.keys(TYPE_CONFIG) as InsightType[]).map((type) => {
          const cfg = TYPE_CONFIG[type];
          const Icon = cfg.icon;
          const count = counts[type];
          return (
            <button
              key={type}
              onClick={() => setFilterType(filterType === type ? "all" : type)}
              className="p-3 rounded-xl text-left transition-all"
              style={{
                background: filterType === type ? cfg.bg : "oklch(1 0 0 / 3%)",
                border: `1px solid ${filterType === type ? cfg.color + " / 0.25)" : "oklch(1 0 0 / 6%)"}`,
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                <span className="text-lg font-bold" style={{ color: cfg.color }}>{count}</span>
              </div>
              <p className="text-[10px] font-semibold text-muted-foreground">{cfg.label}</p>
            </button>
          );
        })}
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
          Category:
        </span>
        {(["all", "performance", "discipline", "psychology", "market", "habits"] as const).map((cat) => {
          const active = filterCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all"
              style={{
                background: active ? "oklch(0.72 0.14 220 / 0.12)" : "oklch(1 0 0 / 4%)",
                color: active ? "oklch(0.72 0.14 220)" : "oklch(0.88 0.008 252 / 50%)",
                border: `1px solid ${active ? "oklch(0.72 0.14 220 / 0.25)" : "transparent"}`,
              }}
            >
              {cat === "all" ? "All Categories" : CATEGORY_LABELS[cat]}
            </button>
          );
        })}
      </div>

      {/* Insights list */}
      {loading ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground animate-pulse">Analyzing your trading data...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center">
            {insights.length === 0 ? (
              <>
                <Brain className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground/60">Not enough data yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  Log at least 3 trades with discipline scores to unlock personalized coaching insights.
                </p>
              </>
            ) : (
              <>
                <Zap className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground/60">No insights match this filter</p>
                <button
                  onClick={() => { setFilterType("all"); setFilterCategory("all"); }}
                  className="text-xs mt-2 transition-colors"
                  style={{ color: "oklch(0.72 0.14 220)" }}
                >
                  Clear filters
                </button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}

      {/* Footer note */}
      {insights.length > 0 && (
        <p className="text-[10px] text-muted-foreground text-center pb-2">
          Insights are generated from your actual trade data, discipline scores, habits, and market context.
          Log more trades to improve accuracy.
        </p>
      )}
    </div>
  );
}
