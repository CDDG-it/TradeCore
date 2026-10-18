/**
 * Demo personas: synthetic answer sets plus 3 weeks of check-ins, so that every
 * screen can be shown without taking the full test. These are not real people.
 *
 * Each persona sets a target mean (1–5, after reverse keying) per facet;
 * unlisted facets sit at the neutral 3. The answers are built so that each
 * facet's four items hit that mean exactly.
 */
import type { FocusAreaId } from "@/lib/trade-profile/focus-rules";
import { items } from "@/lib/trade-profile/items";
import { exercises } from "@/lib/trade-profile/content/exercises";
import { personaText } from "@/lib/trade-profile/content/personas";
import { weeklyQuestions } from "@/lib/trade-profile/content/reflection";
import { addDays, type DateKey } from "@/lib/trade-profile/dates";
import { buildProgram, exerciseForDay } from "@/lib/trade-profile/program";
import type { Answer, Answers, Checkin, FacetCode, GoalTarget, Item } from "@/lib/trade-profile/types";
import { emptyTradeProfile, type TradeProfileState } from "@/lib/trade-profile/model";

export interface Persona {
  id: string;
  facetMeans: Partial<Record<FacetCode, number>>;
  /** The area the focus logic is expected to place this persona in (used by tests). */
  expectedPrimary: FocusAreaId;
  expectedSecondary?: FocusAreaId;
  goal: GoalTarget & { area: FocusAreaId };
  woop: { outcome: string; obstacle: string; ifCue: string; thenAction: string };
  /** Typical state rating at the start, and the rise over three weeks. */
  stateStart: number;
  stateRise: number;
  /** Chance that a day's challenge was done (yes); partly takes half the remainder. */
  adherence: number;
}

export const personas: Persona[] = [
  {
    id: "anxiousScalper",
    facetMeans: { N1: 4.5, N2: 4.25, N3: 3.5, N4: 3.5, N5: 3, N6: 4.25, C1: 3, C5: 3.25, C6: 3.5, E5: 2.75 },
    expectedPrimary: "calm",
    goal: { trait: "N", direction: "decrease", area: "calm" },
    woop: {
      outcome: "I can sit through a normal pullback and let my stop or target decide.",
      obstacle: "The jolt of fear when price ticks against me in the first seconds.",
      ifCue: "If price moves against me and I want to exit before my stop",
      thenAction: "I breathe out slowly once and check whether my exit rule is actually hit.",
    },
    stateStart: 3,
    stateRise: 1.5,
    adherence: 0.7,
  },
  {
    id: "impulsiveOvertrader",
    facetMeans: { N5: 4.5, C6: 1.75, E5: 4.5, E4: 4, C5: 2.5, N2: 3.5, N1: 2.75, O4: 3.5 },
    expectedPrimary: "impulse",
    expectedSecondary: "thrill",
    goal: { trait: "C6", direction: "increase", area: "impulse" },
    woop: {
      outcome: "Five planned trades a day, each with a reason I can write down.",
      obstacle: "Boredom in the lunch range and the urge to just be in something.",
      ifCue: "If I feel the urge to enter and the setup is not on my plan",
      thenAction: "I say my entry rule out loud and wait 10 seconds with my hand off the mouse.",
    },
    stateStart: 3.5,
    stateRise: 1.25,
    adherence: 0.6,
  },
  {
    id: "disciplinedHesitant",
    facetMeans: { C1: 2, C2: 4.25, C3: 4.5, C4: 4, C5: 4.25, C6: 4, N4: 4.25, N1: 3.5, N6: 3.25, E3: 2.5 },
    expectedPrimary: "selfTrust",
    goal: { trait: "C1", direction: "increase", area: "selfTrust" },
    woop: {
      outcome: "I take every A+ setup on time, at my planned size.",
      obstacle: "The thought “what if I am wrong?” right before I click.",
      ifCue: "If all three checklist items are met",
      thenAction: "I enter within 10 seconds and place the stop where the plan says.",
    },
    stateStart: 3,
    stateRise: 1.75,
    adherence: 0.85,
  },
  {
    id: "balanced",
    facetMeans: { N1: 2.75, N2: 2.5, N6: 2.5, E5: 3.25, O4: 3.25, C1: 3.5, C2: 3.25, C3: 3.5, C5: 3.25, C6: 3.25, A1: 3.25 },
    expectedPrimary: "maintain",
    goal: { trait: "C5", direction: "increase", area: "maintain" },
    woop: {
      outcome: "A journal review after every session, even on quiet days.",
      obstacle: "Skipping the review after a big win because it feels unnecessary.",
      ifCue: "If I close the platform",
      thenAction: "I write my three-line close before I leave the desk.",
    },
    stateStart: 4.5,
    stateRise: 0.75,
    adherence: 0.8,
  },
];

/** Answers that make each facet's keyed mean equal its target (rounded to a quarter point). */
export function answersFromFacetMeans(itemList: Item[], means: Partial<Record<FacetCode, number>>): Answers {
  const answers: Answers = {};
  const byFacet = new Map<FacetCode, Item[]>();
  for (const item of itemList) byFacet.set(item.facet, [...(byFacet.get(item.facet) ?? []), item]);
  for (const [facet, group] of byFacet) {
    const target = Math.min(5, Math.max(1, means[facet] ?? 3));
    const total = Math.round(target * group.length);
    const base = Math.floor(total / group.length);
    let extra = total - base * group.length;
    for (const item of group) {
      const keyed = Math.min(5, base + (extra-- > 0 ? 1 : 0));
      answers[item.id] = (item.keyed === "-" ? 6 - keyed : keyed) as Answer;
    }
  }
  return answers;
}

/** Small seeded PRNG so a persona always gets the same check-ins. */
function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** A complete profile for a persona, with the program started 21 days before `todayKey`. */
export function personaState(persona: Persona, todayKey: DateKey): TradeProfileState {
  const startDate = addDays(todayKey, -21);
  const state = emptyTradeProfile();
  const text = personaText[persona.id];
  state.consentedOn = addDays(startDate, -1);
  state.answers = answersFromFacetMeans(items, persona.facetMeans);
  state.completedOn = addDays(startDate, -1);
  state.goal = { ...persona.goal, ...persona.woop };
  state.programStart = startDate;

  const program = buildProgram(exercises, persona.goal, persona.goal.area);
  const rand = rng(persona.id);
  const checkins: Record<DateKey, Checkin> = {};
  for (let d = 0; d < 21; d++) {
    const date = addDays(startDate, d);
    const r = rand();
    // The last three days are always done, so the demo shows a streak.
    const done = d >= 18 || r < persona.adherence ? "yes" : r < persona.adherence + (1 - persona.adherence) / 2 ? "partly" : "no";
    if (done === "no" && rand() < 0.4) continue; // some days simply not logged
    const trend = persona.stateStart + (persona.stateRise * d) / 20;
    checkins[date] = {
      exerciseId: exerciseForDay(program, startDate, date) ?? program[0].exerciseIds[0],
      done,
      difficulty: clamp(Math.round(2 + rand() * 2 + (d > 14 ? 0.5 : 0)), 1, 5),
      state: clamp(Math.round(trend + (rand() - 0.5) * 1.6), 1, 7),
    };
  }
  state.checkins = checkins;
  state.reflections = Object.fromEntries(
    text.reflections.map((answers, i) => [
      i + 1,
      { answers: answers.slice(0, weeklyQuestions.length), date: addDays(startDate, i * 7 + 6) },
    ]),
  );
  return state;
}
