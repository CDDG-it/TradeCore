/**
 * Supabase rows ↔ the in-app TradeProfileState. Pure, so the mapping can be
 * tested without a database.
 */
import type { FocusAreaId } from "@/lib/trade-profile/focus-rules";
import { emptyTradeProfile, type TradeProfileState } from "@/lib/trade-profile/model";
import type { Answer, Answers, TraitCode } from "@/lib/trade-profile/types";
import type {
  TradeProfileCheckinRow,
  TradeProfileReflectionRow,
  TradeProfileRetestRow,
  TradeProfileRow,
  TradeProfileRowInput,
} from "@/lib/types";

/** Keep only valid 1–5 answers with numeric item ids; anything else is dropped. */
export function toAnswers(raw: Record<string, number> | null | undefined): Answers {
  const out: Answers = {};
  for (const [k, v] of Object.entries(raw ?? {})) {
    const id = Number(k);
    if (Number.isInteger(id) && [1, 2, 3, 4, 5].includes(v)) out[id] = v as Answer;
  }
  return out;
}

export function rowsToState(
  row: TradeProfileRow | null,
  checkins: TradeProfileCheckinRow[],
  reflections: TradeProfileReflectionRow[],
  retests: TradeProfileRetestRow[],
): TradeProfileState {
  const s = emptyTradeProfile();
  if (row) {
    s.consentedOn = row.consented_on ?? null;
    s.answers = toAnswers(row.answers);
    s.page = row.page ?? 0;
    s.completedOn = row.completed_on ?? null;
    s.programStart = row.program_start ?? null;
    if (row.goal_trait && row.goal_direction) {
      s.goal = {
        trait: row.goal_trait as TraitCode,
        direction: row.goal_direction,
        area: (row.goal_area as FocusAreaId | null) ?? null,
        outcome: row.goal_outcome ?? "",
        obstacle: row.goal_obstacle ?? "",
        ifCue: row.goal_if_cue ?? "",
        thenAction: row.goal_then_action ?? "",
      };
    }
  }
  for (const c of checkins) {
    s.checkins[c.date] = { exerciseId: c.exercise_id, done: c.done, difficulty: c.difficulty, state: c.state };
  }
  for (const r of reflections) s.reflections[r.week] = { answers: r.answers ?? [], date: r.updated_at.slice(0, 10) };
  s.retests = retests
    .map((r) => ({ week: r.week, date: r.taken_on, answers: toAnswers(r.answers) }))
    .sort((a, b) => a.week - b.week);
  return s;
}

/** The trade_profile columns for the parts of the state that live on that row. */
export function stateToRow(s: TradeProfileState): TradeProfileRowInput {
  return {
    answers: s.answers,
    page: s.page,
    consented_on: s.consentedOn,
    completed_on: s.completedOn,
    goal_trait: s.goal?.trait ?? null,
    goal_direction: s.goal?.direction ?? null,
    goal_area: s.goal?.area ?? null,
    goal_outcome: s.goal?.outcome ?? "",
    goal_obstacle: s.goal?.obstacle ?? "",
    goal_if_cue: s.goal?.ifCue ?? "",
    goal_then_action: s.goal?.thenAction ?? "",
    program_start: s.programStart,
  };
}
