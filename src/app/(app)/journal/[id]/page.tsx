"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft, TrendingUp, TrendingDown, Calendar,
  Brain, AlertCircle, Lightbulb, CheckCircle2,
  LinkIcon, Pencil, Trash2, Target, Activity,
  Flame, CheckSquare, Moon, ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScreenshotUpload } from "@/components/screenshot-upload";
import {
  getTradeById,
  getAnalysisById,
  deleteTrade,
  getDisciplineFieldLabel,
  getDaySummary,
  getDailyStateCheck,
  getSleepRecovery,
  getHabitCompletions,
  getHabits,
} from "@/lib/mock/store";
import { cn } from "@/lib/utils";
import type { TradeDiscipline, TradeMarketContext } from "@/lib/types";


const DISCIPLINE_FIELDS: (keyof Omit<TradeDiscipline, "score" | "notes">)[] = [
  "followed_plan", "traded_in_session", "respected_risk", "respected_max_trades",
  "matched_a_plus", "no_impulsive_entry", "no_revenge_trade", "respected_stop_loss",
  "journal_completed",
];

const REGIME_LABELS: Record<string, string> = {
  trending: "Trending",
  ranging: "Ranging",
  choppy: "Choppy",
};

const VOLATILITY_LABELS: Record<string, string> = {
  low: "Low Vol",
  medium: "Med Vol",
  high: "High Vol",
  extreme: "Extreme",
};

const REGIME_COLORS: Record<string, string> = {
  trending: "oklch(0.72 0.17 145)",
  ranging: "oklch(0.72 0.22 45)",
  choppy: "oklch(0.72 0.22 45)",
};

const VOL_COLORS: Record<string, string> = {
  low: "oklch(0.72 0.17 145)",
  medium: "oklch(0.72 0.22 45)",
  high: "oklch(0.65 0.22 25)",
  extreme: "oklch(0.60 0.25 25)",
};

function ContextBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: color + " / 0.15)", color }}
    >
      {label}
    </span>
  );
}

export default function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const trade = getTradeById(id);

  if (!trade) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-sm">Trade not found.</p>
        <Link href="/journal" className="text-primary text-sm hover:underline mt-2 inline-block">← Back to journal</Link>
      </div>
    );
  }

  const linkedAnalysis = trade.linked_analysis_id ? getAnalysisById(trade.linked_analysis_id) : undefined;
  const discipline = trade.discipline as TradeDiscipline | undefined;
  const context = trade.market_context as TradeMarketContext | undefined;

  const resultConfig = {
    win: { color: "text-success", bg: "bg-success/8 border-success/20", label: "Win" },
    loss: { color: "text-destructive", bg: "bg-destructive/8 border-destructive/20", label: "Loss" },
    "break-even": { color: "text-warning", bg: "bg-warning/8 border-warning/20", label: "Break-Even" },
  };
  const res = resultConfig[trade.result];

  async function handleDelete() {
    setDeleting(true);
    await new Promise((r) => setTimeout(r, 300));
    deleteTrade(id);
    router.push("/journal");
  }

  const groups = trade.screenshot_groups ?? [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link href="/journal" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Journal
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl font-bold text-primary">{trade.instrument}</span>
              <div className="flex items-center gap-1.5">
                {trade.direction === "long"
                  ? <TrendingUp className="w-5 h-5 text-success" />
                  : <TrendingDown className="w-5 h-5 text-destructive" />}
                <span className={cn("text-sm font-semibold capitalize",
                  trade.direction === "long" ? "text-success" : "text-destructive")}>
                  {trade.direction}
                </span>
              </div>
              <Badge className="capitalize bg-secondary text-secondary-foreground border-border text-xs">
                {trade.market}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(trade.date_time.slice(0, 10) + "T12:00:00"), "EEEE, MMMM d, yyyy")}
              </span>
              <span>{trade.session} session{trade.timeframe ? ` · ${trade.timeframe}` : ""}</span>
            </div>
          </div>

          <div className={cn("px-5 py-3 rounded-xl border shrink-0", res.bg)}>
            <p className={cn("text-2xl font-bold text-center", res.color)}>{trade.rr}R</p>
            <p className={cn("text-xs font-medium text-center mt-0.5", res.color)}>{res.label}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Link href={`/journal/${id}/edit`}>
            <Button variant="outline" size="sm" className="gap-1.5 transition-all hover:-translate-y-px">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
          </Link>
          {!confirmDelete ? (
            <Button variant="outline" size="sm"
              className="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5 transition-all"
              onClick={() => setConfirmDelete(true)}>
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          ) : (
            <div className="flex items-center gap-2 animate-fade-in">
              <span className="text-xs text-destructive font-medium">Delete this trade?</span>
              <Button variant="outline" size="sm"
                className="bg-destructive text-white hover:bg-destructive/90 border-destructive"
                onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Yes, delete"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            </div>
          )}
        </div>
      </div>

      {/* Discipline + Market Context row */}
      {(discipline || context) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Discipline Score */}
          {discipline && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4" style={{ color: "oklch(0.72 0.22 45)" }} />
                  Discipline Score
                  <span
                    className="ml-auto text-sm font-bold"
                    style={{
                      color: discipline.score >= 80
                        ? "oklch(0.72 0.17 145)"
                        : discipline.score >= 60
                        ? "oklch(0.72 0.22 45)"
                        : "oklch(0.65 0.22 25)",
                    }}
                  >
                    {discipline.score}%
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {DISCIPLINE_FIELDS.map((field) => {
                    const passed = discipline[field] as boolean;
                    return (
                      <div key={field} className="flex items-center gap-2 text-xs">
                        <span className={cn(
                          "w-3.5 h-3.5 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold",
                          passed
                            ? "bg-success/15 text-success"
                            : "bg-destructive/15 text-destructive"
                        )}>
                          {passed ? "✓" : "✗"}
                        </span>
                        <span className={cn(
                          passed ? "text-foreground/70" : "text-foreground/40 line-through"
                        )}>
                          {getDisciplineFieldLabel(field)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {discipline.notes && (
                  <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border leading-relaxed">
                    {discipline.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Market Context */}
          {context && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Market Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {context.regime && (
                    <ContextBadge
                      label={REGIME_LABELS[context.regime] ?? context.regime}
                      color={REGIME_COLORS[context.regime] ?? "oklch(0.72 0.22 45)"}
                    />
                  )}
                  {context.volatility && (
                    <ContextBadge
                      label={VOLATILITY_LABELS[context.volatility] ?? context.volatility}
                      color={VOL_COLORS[context.volatility] ?? "oklch(0.72 0.22 45)"}
                    />
                  )}
                  {context.htf_bias && (
                    <ContextBadge
                      label={`HTF: ${context.htf_bias.toUpperCase()}`}
                      color={
                        context.htf_bias === "bullish"
                          ? "oklch(0.72 0.17 145)"
                          : context.htf_bias === "bearish"
                          ? "oklch(0.65 0.22 25)"
                          : "oklch(0.72 0.22 45)"
                      }
                    />
                  )}
                  {context.news_day && (
                    <ContextBadge label="News Day" color="oklch(0.72 0.22 45)" />
                  )}
                  {context.major_event && (
                    <ContextBadge label="Major Event" color="oklch(0.65 0.22 25)" />
                  )}
                </div>

                {context.confidence !== undefined && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Context Confidence
                    </p>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((pip) => (
                        <div
                          key={pip}
                          className="h-1.5 flex-1 rounded-full"
                          style={{
                            background: pip <= context.confidence
                              ? "oklch(0.72 0.22 45)"
                              : "oklch(1 0 0 / 8%)",
                          }}
                        />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">
                        {context.confidence}/5
                      </span>
                    </div>
                  </div>
                )}

                {context.notes && (
                  <p className="text-xs text-muted-foreground leading-relaxed pt-1 border-t border-border">
                    {context.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Confluences */}
      {trade.confluences.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" /> Confluences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {trade.confluences.map((c) => (
                <span key={c} className="text-sm bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg border border-border">
                  {c}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Screenshots */}
      {groups.some((g) => g.urls.length > 0) && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Screenshots</CardTitle>
          </CardHeader>
          <CardContent>
            <ScreenshotUpload groups={groups} onChange={() => {}} readOnly />
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" /> Execution Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground/80">{trade.execution_notes || "—"}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Brain className="w-4 h-4 text-gold" /> Psychology
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground/80">{trade.psychology_notes || "—"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {trade.mistakes && trade.mistakes !== "None" && (
          <Card className="bg-destructive/5 border-destructive/20 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" /> Mistakes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground/80">{trade.mistakes}</p>
            </CardContent>
          </Card>
        )}
        {trade.lessons && (
          <Card className="bg-gold/5 border-gold/20 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gold">
                <Lightbulb className="w-4 h-4" /> Lessons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground/80">{trade.lessons}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {linkedAnalysis && (
        <Card className="bg-primary/5 border-primary/20 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Linked Analysis</span>
              </div>
              <Link href={`/analysis/${linkedAnalysis.id}`} className="text-xs text-primary hover:text-primary/70 transition-colors">
                View analysis →
              </Link>
            </div>
            <p className="text-sm mt-2 text-foreground/80">{linkedAnalysis.title}</p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{linkedAnalysis.thesis}</p>
          </CardContent>
        </Card>
      )}

      {/* Day Context from Self-Improvement System */}
      <TradeDayContext tradeDate={trade.date_time.slice(0, 10)} />
    </div>
  );
}

// ── Day Context Component ─────────────────────────────────────────────────────
function TradeDayContext({ tradeDate }: { tradeDate: string }) {
  const summary = getDaySummary(tradeDate);
  const stateCheck = getDailyStateCheck(tradeDate);
  const sleepData = getSleepRecovery(tradeDate);
  const habits = getHabits();
  const completions = getHabitCompletions(undefined, tradeDate).filter((c) => c.completed);

  const hasAnyData = summary.hasAnalysis || summary.hasJournal || summary.hasStateCheck || summary.hasSleep || completions.length > 0;

  if (!hasAnyData) {
    return (
      <div
        className="rounded-xl p-5"
        style={{
          background: "oklch(0.10 0.003 28)",
          border: "1px solid oklch(0.18 0.005 28)",
        }}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "oklch(0.72 0.22 45 / 0.15)" }}
          >
            <Flame className="w-3.5 h-3.5" style={{ color: "oklch(0.72 0.22 45)" }} />
          </div>
          <p className="text-sm font-semibold">Day Context</p>
          <Link
            href="/self-improvement"
            className="ml-auto text-xs flex items-center gap-1 transition-opacity hover:opacity-70"
            style={{ color: "oklch(0.72 0.22 45)" }}
          >
            Add context <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          No self-improvement data logged for this day. Visit the Self-Improvement tab to add your mental state, habits, and reflections.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "oklch(0.10 0.003 28)",
        border: "1px solid oklch(0.72 0.22 45 / 0.20)",
      }}
    >
      <div
        className="flex items-center gap-2.5 px-5 py-3.5"
        style={{ borderBottom: "1px solid oklch(0.18 0.005 28)" }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "oklch(0.72 0.22 45 / 0.15)" }}
        >
          <Flame className="w-3.5 h-3.5" style={{ color: "oklch(0.72 0.22 45)" }} />
        </div>
        <p className="text-sm font-semibold">Day Context — How You Showed Up</p>
        <Link
          href="/self-improvement"
          className="ml-auto text-xs flex items-center gap-1 transition-opacity hover:opacity-70"
          style={{ color: "oklch(0.72 0.22 45)" }}
        >
          Self-Improvement <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <div className="p-5 grid sm:grid-cols-3 gap-4">
        {stateCheck && (
          <div
            className="rounded-lg p-3"
            style={{ background: "oklch(0.08 0.003 28)", border: "1px solid oklch(0.18 0.005 28)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-3.5 h-3.5" style={{ color: "oklch(0.72 0.22 45)" }} />
              <span className="text-xs font-semibold" style={{ color: "oklch(0.72 0.22 45)" }}>Mental State</span>
            </div>
            <div className="space-y-1">
              {[
                { label: "Mood", value: stateCheck.mood },
                { label: "Focus", value: stateCheck.focus },
                { label: "Confidence", value: stateCheck.confidence },
                { label: "Stress", value: stateCheck.stress, invert: true },
              ].map(({ label, value, invert }) => {
                const isGood = invert ? value <= 4 : value >= 7;
                const isNeutral = !invert && value >= 5;
                const color = isGood
                  ? "oklch(0.58 0.17 145)"
                  : isNeutral
                  ? "oklch(0.70 0.16 72)"
                  : "oklch(0.58 0.22 25)";
                return (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="text-xs font-bold" style={{ color }}>{value}/10</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {sleepData && (
          <div
            className="rounded-lg p-3"
            style={{ background: "oklch(0.08 0.003 28)", border: "1px solid oklch(0.18 0.005 28)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Moon className="w-3.5 h-3.5" style={{ color: "oklch(0.58 0.17 145)" }} />
              <span className="text-xs font-semibold" style={{ color: "oklch(0.58 0.17 145)" }}>Recovery</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Sleep</span>
                <span
                  className="text-xs font-bold"
                  style={{ color: sleepData.hours_slept >= 7.5 ? "oklch(0.58 0.17 145)" : "oklch(0.58 0.22 25)" }}
                >
                  {sleepData.hours_slept}h
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Quality</span>
                <span className="text-xs font-bold" style={{ color: sleepData.sleep_quality >= 7 ? "oklch(0.58 0.17 145)" : "oklch(0.70 0.16 72)" }}>
                  {sleepData.sleep_quality}/10
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Movement</span>
                <span className="text-xs font-bold" style={{ color: sleepData.training_movement ? "oklch(0.58 0.17 145)" : "oklch(0.55 0.005 28)" }}>
                  {sleepData.training_movement ? "Done" : "Skipped"}
                </span>
              </div>
            </div>
          </div>
        )}

        {habits.length > 0 && (
          <div
            className="rounded-lg p-3"
            style={{ background: "oklch(0.08 0.003 28)", border: "1px solid oklch(0.18 0.005 28)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckSquare className="w-3.5 h-3.5" style={{ color: "oklch(0.72 0.22 45)" }} />
              <span className="text-xs font-semibold" style={{ color: "oklch(0.72 0.22 45)" }}>Habits</span>
              <span
                className="ml-auto text-xs font-bold"
                style={{
                  color: completions.length / habits.length >= 0.7
                    ? "oklch(0.58 0.17 145)"
                    : completions.length / habits.length >= 0.4
                    ? "oklch(0.70 0.16 72)"
                    : "oklch(0.58 0.22 25)",
                }}
              >
                {completions.length}/{habits.length}
              </span>
            </div>
            <div className="space-y-1">
              {habits.slice(0, 4).map((h) => {
                const done = completions.some((c) => c.habit_id === h.id);
                return (
                  <div key={h.id} className="flex items-center gap-2">
                    <span className="text-xs">{h.icon}</span>
                    <span
                      className="text-xs flex-1 truncate"
                      style={{ color: done ? "oklch(0.94 0.002 28)" : "oklch(0.40 0.005 28)" }}
                    >
                      {h.name}
                    </span>
                    {done && <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: "oklch(0.58 0.17 145)" }} />}
                  </div>
                );
              })}
              {habits.length > 4 && (
                <p className="text-xs text-muted-foreground">+{habits.length - 4} more habits</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
