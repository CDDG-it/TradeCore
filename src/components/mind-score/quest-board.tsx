"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { computeQuestBoard, type QuestBoard } from "@/lib/mind-score/quests";
import { getTrades, getPsychEdgeSessions, getBestTradesOfDay, getWeeklyTradeReviews } from "@/lib/supabase/queries";

const ACCENT = "oklch(0.70 0.12 183)";
const GREEN = "oklch(0.58 0.17 145)";

export function QuestBoard() {
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
      {/* Level + weekly points */}
      <div className="flex items-center gap-3">
        <LevelRing level={level.level} pct={ringPct} />
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

      <div className="h-1.5 w-full rounded-full bg-muted-foreground/15 overflow-hidden">
        <div className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${weeklyMax ? (weeklyPoints / weeklyMax) * 100 : 0}%`, background: ACCENT }} />
      </div>

      {/* Quests */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Weekly quests</p>
        {quests.map((q) => {
          const pct = Math.min(100, Math.round((q.progress / q.target) * 100));
          return (
            <Link
              key={q.key}
              href={q.href}
              className={cn(
                "block rounded-xl border p-3 transition-colors",
                q.done ? "border-success/40 bg-success/8" : "border-border hover:border-primary/30 hover:bg-muted/40"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{q.label}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{q.description}</p>
                </div>
                <span className={cn("text-[11px] font-bold tabular-nums shrink-0",
                  q.done ? "text-success" : "text-muted-foreground")}>
                  +{q.earned}<span className="text-muted-foreground/40">/{q.points}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="h-1 flex-1 rounded-full bg-muted-foreground/15 overflow-hidden">
                  <div className="h-full rounded-full transition-[width] duration-500"
                    style={{ width: `${pct}%`, background: q.done ? GREEN : ACCENT }} />
                </div>
                <span className="text-[10px] text-muted-foreground/70 tabular-nums shrink-0">
                  {Math.min(q.progress, q.target)}/{q.target}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/** Level ring with the level number in the centre. */
function LevelRing({ level, pct }: { level: number; pct: number }) {
  const R = 20;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative w-12 h-12 shrink-0">
      <svg width={48} height={48} viewBox="0 0 48 48" className="block -rotate-90">
        <circle cx={24} cy={24} r={R} fill="none" stroke="oklch(0.70 0.12 183 / 0.15)" strokeWidth={3} />
        <circle cx={24} cy={24} r={R} fill="none" stroke={ACCENT} strokeWidth={3} strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * C} ${C}`} style={{ transition: "stroke-dasharray 0.7s ease" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-base font-black tabular-nums" style={{ color: ACCENT }}>{level}</span>
      </div>
    </div>
  );
}
