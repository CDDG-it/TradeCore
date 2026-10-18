/**
 * Supabase rows ↔ the in-app TradeProfileState. Pure, so the mapping can be
 * tested without a database.
 */
import type { FocusAreaId } from "@/lib/trade-profile/focus-rules";
import { items } from "@/lib/trade-profile/items";
import { LEGACY_120_TO_60 } from "@/lib/trade-profile/legacy";
import { emptyTradeProfile, type TradeProfileState } from "@/lib/trade-profile/model";
import { thresholds } from "@/lib/trade-profile/config";
import { isComplete } from "@/lib/trade-profile/scoring";
import type { Answer, Answers, TraitCode } from "@/lib/trade-profile/types";
import type {
  TradeProfileCheckinRow,
  TradeProfileReflectionRow,
  TradeProfileRetestRow,
  TradeProfileRow,
  TradeProfileRowInput,
} from "@/lib/types";

const CURRENT_IDS = new Set(items.map((i) => i.id));

/**
 * Keep only valid 1-5 answers to items in the current instrument. Answers saved
 * under the earlier IPIP-NEO-120 (ids 1-120) move to the identical IPIP-NEO-60
 * item where one exists; the rest are dropped. A current-id answer always wins.
 */
export function toAnswers(raw: Record<string, number> | null | undefined): Answers {
  const out: Answers = {};
  const legacy: Answers = {};
  for (const [k, v] of Object.entries(raw ?? {})) {
    const id = Number(k);
    if (!Number.isInteger(id) || ![1, 2, 3, 4, 5].includes(v)) continue;
    if (CURRENT_IDS.has(id)) out[id] = v as Answer;
    else if (LEGACY_120_TO_60[id] !== undefined) legacy[LEGACY_120_TO_60[id]] = v as Answer;
  }
  return { ...legacy, ...out };
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
  // A profile finished on the earlier, longer instrument may now miss a few
  // items: reopen the assessment on the first page with a gap, keeping the rest.
  if (s.completedOn && !isComplete(items, s.answers)) {
    s.completedOn = null;
    const first = items.findIndex((i) => s.answers[i.id] === undefined);
    s.page = Math.floor(Math.max(0, first) / thresholds.pageSize);
  }
  // A retest only counts once it covers every item of the goal's domain; one
  // taken on the earlier instrument may not, and is then offered again.
  const domain = s.goal?.trait[0];
  s.retests = retests
    .map((r) => ({ week: r.week, date: r.taken_on, answers: toAnswers(r.answers) }))
    .filter((r) => !domain || items.filter((i) => i.domain === domain).every((i) => r.answers[i.id] !== undefined))
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
