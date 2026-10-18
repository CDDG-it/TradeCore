/**
 * The in-app shape of one trader's My Trade Profile, independent of storage.
 * The Supabase rows (src/lib/types) map onto this in queries.ts, and the demo
 * preview keeps one of these in memory.
 */
import type { FocusAreaId } from "@/lib/trade-profile/focus-rules";
import type { DateKey } from "@/lib/trade-profile/dates";
import type { Answers, Checkin, Direction, TraitCode } from "@/lib/trade-profile/types";

export interface ProfileGoal {
  trait: TraitCode;
  direction: Direction;
  /** Focus area the goal came from, if any; weights exercise selection. */
  area: FocusAreaId | null;
  outcome: string;
  obstacle: string;
  ifCue: string;
  thenAction: string;
}

export interface ProfileReflection {
  answers: string[];
  date: DateKey;
}

export interface ProfileRetest {
  week: number;
  date: DateKey;
  answers: Answers;
}

export interface TradeProfileState {
  consentedOn: DateKey | null;
  answers: Answers;
  /** Assessment page to resume on. */
  page: number;
  completedOn: DateKey | null;
  goal: ProfileGoal | null;
  programStart: DateKey | null;
  checkins: Record<DateKey, Checkin>;
  /** Keyed by program week (1–12). */
  reflections: Record<number, ProfileReflection>;
  retests: ProfileRetest[];
}

export function emptyTradeProfile(): TradeProfileState {
  return {
    consentedOn: null,
    answers: {},
    page: 0,
    completedOn: null,
    goal: null,
    programStart: null,
    checkins: {},
    reflections: {},
    retests: [],
  };
}
