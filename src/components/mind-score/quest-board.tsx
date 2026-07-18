"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpenCheck, Brain, Target, PenLine, Check, ChevronRight, Trophy, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { computeQuestBoard, type QuestBoard, type QuestKey } from "@/lib/mind-score/quests";
import { getTrades, getPsychEdgeSessions, getBestTradesOfDay, getWeeklyTradeReviews } from "@/lib/supabase/queries";

const QUEST_ICON: Record<QuestKey, typeof Target> = {
  "weekly-journal": BookOpenCheck,
  "psych-reflections": Brain,
  "best-trade": Target,
  "journal-trades": PenLine,
};

const ACCENT = "oklch(0.70 0.12 183)";

export function QuestBoard({ compact = false }: { compact?: boolean }) {
  const [board, setBoard] = useState<QuestBoard | null>(null);

  useEffect(() => {
    Promise.all([getTrades(), getPsychEdgeSessions(), getBestTradesOfDay(), getWeeklyTradeReviews()])
      .then(([trades, psychSessions, bestTrades, weeklyReviews]) => {
        setBoard(computeQuestBoard({ trades, psychSessions, bestTrades, weeklyReviews }));
      })
      .catch(() => setBoard(computeQuestBoard({ trades: [], psychSessions: [], bestTrades: [], weeklyReviews: [] })));
  }, []);

  if (!board) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-center h-40">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { quests, weeklyPoints, weeklyMax, level } = board;
  const ringPct = level.span > 0 ? Math.round((level.intoLevel / level.span) * 100) : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      {/* Header — level + weekly points */}
      <div className="flex items-center gap-3">
        <LevelEmblem level={level.level} ringPct={ringPct} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold">Level {level.level}</p>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
              style={{ background: "oklch(0.70 0.12 183 / 0.14)", color: ACCENT }}>
              {level.title}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
            {level.intoLevel}/{level.span} XP to level {level.level + 1}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-black tabular-nums leading-none" style={{ color: ACCENT }}>
            {weeklyPoints}<span className="text-muted-foreground/50 text-xs font-semibold">/{weeklyMax}</span>
          </p>
          <p className="text-[10px] text-muted-foreground">this week</p>
        </div>
      </div>

      {/* Weekly points bar */}
      <div className="h-1.5 w-full rounded-full bg-muted-foreground/15 overflow-hidden">
        <div className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${weeklyMax ? (weeklyPoints / weeklyMax) * 100 : 0}%`, background: ACCENT, boxShadow: `0 0 6px oklch(0.70 0.12 183 / 0.45)` }} />
      </div>

      {/* Quests */}
      <div className="space-y-1.5">
        {!compact && (
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Weekly quests</p>
        )}
        {quests.map((q) => {
          const Icon = QUEST_ICON[q.key];
          const pct = Math.min(100, Math.round((q.progress / q.target) * 100));
          return (
            <Link
              key={q.key}
              href={q.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl border p-2.5 transition-colors",
                q.done ? "border-success/40 bg-success/8" : "border-border hover:border-primary/30 hover:bg-muted/40"
              )}
            >
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                q.done ? "bg-success/20" : "bg-muted")}>
                {q.done ? <Check className="w-4 h-4 text-success" /> : <Icon className="w-4 h-4 text-muted-foreground" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold truncate">{q.label}</p>
                  <span className={cn("text-[11px] font-bold tabular-nums shrink-0",
                    q.done ? "text-success" : "text-muted-foreground")}>
                    +{q.earned}<span className="text-muted-foreground/40">/{q.points}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1 flex-1 rounded-full bg-muted-foreground/15 overflow-hidden">
                    <div className="h-full rounded-full transition-[width] duration-500"
                      style={{ width: `${pct}%`, background: q.done ? "oklch(0.58 0.17 145)" : ACCENT }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground/70 tabular-nums shrink-0">
                    {Math.min(q.progress, q.target)}/{q.target}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
            </Link>
          );
        })}
      </div>

      {weeklyPoints >= weeklyMax && weeklyMax > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">
          <Trophy className="w-3.5 h-3.5 shrink-0" /> All quests cleared this week. Elite discipline.
        </div>
      )}
    </div>
  );
}

/** Hexagonal level emblem with an XP progress ring. */
function LevelEmblem({ level, ringPct }: { level: number; ringPct: number }) {
  const R = 20;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative w-12 h-12 shrink-0">
      <svg width={48} height={48} viewBox="0 0 48 48" className="block -rotate-90">
        <circle cx={24} cy={24} r={R} fill="none" stroke="oklch(0.70 0.12 183 / 0.15)" strokeWidth={3} />
        <circle cx={24} cy={24} r={R} fill="none" stroke={ACCENT} strokeWidth={3} strokeLinecap="round"
          strokeDasharray={`${(ringPct / 100) * C} ${C}`}
          style={{ filter: `drop-shadow(0 0 4px oklch(0.70 0.12 183 / 0.5))`, transition: "stroke-dasharray 0.7s ease" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-base font-black tabular-nums" style={{ color: ACCENT }}>{level}</span>
      </div>
    </div>
  );
}
