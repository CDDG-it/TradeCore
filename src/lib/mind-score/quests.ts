/**
 * MC Mindset — quests & progression.
 *
 * The MC Mind Score measures discipline *right now*; quests turn the habits that
 * build that discipline into a game. Every quest is derived from data the trader
 * already produces — there's no separate "mark as done" to fake. Doing the work
 * (your weekly journal, your daily psych-edge reflection, logging the best trade
 * of the day) is what completes a quest and earns the points.
 *
 * Points come in two flavours:
 *   • Weekly points — this week's quest board, resets every Monday.
 *   • Lifetime XP    — everything you've ever logged, which drives your level.
 */

import { startOfWeek, endOfWeek } from "date-fns";
import type {
  TradeJournalEntry, PsychEdgeSession, BestTradeOfDay, WeeklyTradeReview,
} from "@/lib/types";

export type QuestKey = "weekly-journal" | "psych-reflections" | "best-trade" | "journal-trades";

export interface Quest {
  key: QuestKey;
  label: string;
  description: string;
  /** Points awarded when fully complete this week. */
  points: number;
  /** Units needed for a full completion this week. */
  target: number;
  /** Units done this week (uncapped). */
  progress: number;
  /** Points earned this week so far (partial credit, capped at `points`). */
  earned: number;
  done: boolean;
  /** Where to go to make progress. */
  href: string;
}

export interface LevelInfo {
  level: number;
  title: string;
  /** Lifetime XP total. */
  xp: number;
  /** XP accumulated inside the current level. */
  intoLevel: number;
  /** XP span of the current level (intoLevel / span = ring fill). */
  span: number;
}

export interface QuestBoard {
  quests: Quest[];
  weeklyPoints: number;
  weeklyMax: number;
  level: LevelInfo;
}

const XP = {
  trade: 5,
  psychSession: 12,
  bestTrade: 20,
  weeklyJournal: 40,
} as const;

/** Cumulative XP required to *reach* a given level (level 1 starts at 0). */
function xpToReach(level: number): number {
  return 60 * (level - 1) * level; // 0, 120, 360, 720, 1200, 1800, …
}

function levelTitle(level: number): string {
  if (level >= 15) return "Master";
  if (level >= 10) return "Elite";
  if (level >= 7) return "Sharp";
  if (level >= 5) return "Consistent";
  if (level >= 3) return "Disciplined";
  return "Novice";
}

function computeLevel(xp: number): LevelInfo {
  let level = 1;
  while (xpToReach(level + 1) <= xp) level++;
  const base = xpToReach(level);
  const next = xpToReach(level + 1);
  return { level, title: levelTitle(level), xp, intoLevel: xp - base, span: next - base };
}

const dayOf = (iso: string) => iso.slice(0, 10);

export function computeQuestBoard(
  {
    now = new Date(),
    trades,
    psychSessions,
    bestTrades,
    weeklyReviews,
  }: {
    now?: Date;
    trades: TradeJournalEntry[];
    psychSessions: PsychEdgeSession[];
    bestTrades: BestTradeOfDay[];
    weeklyReviews: WeeklyTradeReview[];
  }
): QuestBoard {
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const inWeek = (iso: string) => {
    const d = new Date(dayOf(iso) + "T12:00:00");
    return d >= weekStart && d <= weekEnd;
  };
  const weekStartKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;

  // ── This week's progress ──────────────────────────────────────────────
  const tradesThisWeek = trades.filter((t) => inWeek(t.date_time)).length;
  const psychThisWeek = psychSessions.filter((s) => inWeek(s.date)).length;
  const bestThisWeek = bestTrades.filter((b) => inWeek(b.date)).length;
  const weeklyJournalDone = weeklyReviews.some((r) => r.week_start === weekStartKey);

  const mk = (
    key: QuestKey, label: string, description: string, href: string,
    points: number, target: number, progress: number
  ): Quest => {
    const done = progress >= target;
    const earned = Math.round(points * Math.min(progress / target, 1));
    return { key, label, description, points, target, progress, earned, done, href };
  };

  const quests: Quest[] = [
    mk("weekly-journal", "Weekly journal", "Complete this week's trade review", "/journal/review",
      XP.weeklyJournal, 1, weeklyJournalDone ? 1 : 0),
    mk("psych-reflections", "Psych-edge reflections", "Reflect on your trading days", "/psychological-edge",
      30, 5, psychThisWeek),
    mk("best-trade", "Best trade of the day", "Log the best trade available", "/journal",
      30, 5, bestThisWeek),
    mk("journal-trades", "Journal your trades", "Keep the journal current", "/journal/new",
      20, 5, tradesThisWeek),
  ];

  const weeklyPoints = quests.reduce((s, q) => s + q.earned, 0);
  const weeklyMax = quests.reduce((s, q) => s + q.points, 0);

  // ── Lifetime XP → level ───────────────────────────────────────────────
  const xp =
    trades.length * XP.trade +
    psychSessions.length * XP.psychSession +
    bestTrades.length * XP.bestTrade +
    weeklyReviews.length * XP.weeklyJournal;

  return { quests, weeklyPoints, weeklyMax, level: computeLevel(xp) };
}
