"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  getTradeProfileBundle,
  resetTradeProfile,
  saveTradeProfile,
  saveTradeProfileCheckin,
  saveTradeProfileReflection,
  saveTradeProfileRetest,
} from "@/lib/supabase/queries";
import { exercises } from "@/lib/trade-profile/content/exercises";
import { items } from "@/lib/trade-profile/items";
import { today } from "@/lib/trade-profile/dates";
import { needsSupportNote, placeInFocus } from "@/lib/trade-profile/focus";
import type { FocusAreaId } from "@/lib/trade-profile/focus-rules";
import { emptyTradeProfile, type ProfileGoal, type TradeProfileState } from "@/lib/trade-profile/model";
import { personas, personaState } from "@/lib/trade-profile/personas";
import { buildProgram, programPosition } from "@/lib/trade-profile/program";
import { rowsToState, stateToRow, toAnswers } from "@/lib/trade-profile/rows";
import { clearDraft, loadDraft, writeDraft } from "@/lib/drafts";
import { isComplete, scoreProfile } from "@/lib/trade-profile/scoring";
import type { Answer, Answers, Checkin } from "@/lib/trade-profile/types";

/**
 * One store for the page, with two backends:
 *   • live: the trader's own rows in Supabase (sql/trade_profile.sql);
 *   • demo: a persona held in memory. Nothing in demo mode is ever written,
 *     so a trader can preview every screen without touching their data.
 * Components never know which one they are talking to.
 */
export type StoreStatus = "loading" | "ready" | "setup" | "error";

export interface TradeProfileStore {
  status: StoreStatus;
  state: TradeProfileState;
  /** Today's key, shifted by the demo day offset. */
  todayKey: string;
  demo: { personaId: string; dayOffset: number } | null;
  saveError: boolean;
  consent: () => void;
  answer: (id: number, a: Answer) => void;
  fillAnswers: (answers: Answers) => void;
  setPage: (page: number) => void;
  completeAssessment: () => void;
  restartAssessment: () => void;
  saveGoal: (goal: ProfileGoal) => Promise<void>;
  saveCheckin: (date: string, checkin: Checkin) => Promise<void>;
  saveReflection: (week: number, answers: string[]) => Promise<void>;
  saveRetest: (week: number, answers: Answers) => Promise<void>;
  reset: () => Promise<void>;
  startDemo: (personaId: string) => void;
  exitDemo: () => void;
  setDayOffset: (n: number) => void;
}

const StoreContext = createContext<TradeProfileStore | null>(null);

export function useTradeProfile(): TradeProfileStore {
  const s = useContext(StoreContext);
  if (!s) throw new Error("useTradeProfile outside TradeProfileProvider");
  return s;
}

const ANSWER_SAVE_DELAY = 300;

/**
 * Answers are also mirrored to a local draft on every click, so nothing is lost
 * to a closed tab, a dropped connection or a save still in flight. The draft
 * lives under the app's draft prefix, so signing out clears it.
 */
export const ANSWERS_DRAFT = "trade-profile:answers";
type AnswersDraft = { answers: Record<string, number>; page: number };

/** Demo id of the empty trader the dev preview starts over with. */
export const FRESH = "fresh";

interface DemoState {
  personaId: string;
  dayOffset: number;
  state: TradeProfileState;
}

export function TradeProfileProvider({
  children,
  demoOnly = false,
  initialPersona,
}: {
  children: ReactNode;
  /** The dev preview route: never touch Supabase. */
  demoOnly?: boolean;
  initialPersona?: string;
}) {
  const [live, setLiveState] = useState<TradeProfileState>(emptyTradeProfile);
  const [status, setStatus] = useState<StoreStatus>(demoOnly ? "ready" : "loading");
  const [saveError, setSaveError] = useState(false);
  const [demo, setDemoState] = useState<DemoState | null>(() => {
    const p = initialPersona ? personas.find((x) => x.id === initialPersona) : demoOnly ? personas[0] : undefined;
    return p ? { personaId: p.id, dayOffset: 0, state: personaState(p, today()) } : null;
  });
  // Refs mirror the state synchronously, so several quick answers in a row
  // each build on the previous one rather than on a stale render.
  const liveRef = useRef(live);
  const demoRef = useRef(demo);
  const setLive = useCallback((next: TradeProfileState) => {
    liveRef.current = next;
    setLiveState(next);
  }, []);
  const setDemo = useCallback((next: DemoState | null) => {
    demoRef.current = next;
    setDemoState(next);
  }, []);

  useEffect(() => {
    if (demoOnly) return;
    let alive = true;
    getTradeProfileBundle()
      .then((b) => {
        if (!alive) return;
        if (b.missingTable) setStatus("setup");
        else {
          const next = rowsToState(b.profile, b.checkins, b.reflections, b.retests);
          // A local draft newer than the saved row holds answers that never reached
          // the server (tab closed mid-save, offline): restore them and sync.
          const draft = loadDraft<AnswersDraft>(ANSWERS_DRAFT);
          const savedAt = b.profile ? Date.parse(b.profile.updated_at) : 0;
          if (draft && !next.completedOn && draft.savedAt > savedAt) {
            next.answers = { ...next.answers, ...toAnswers(draft.data.answers) };
            next.page = Math.max(0, draft.data.page ?? next.page);
            next.consentedOn ??= today();
            pending.current = next;
          }
          setLive(next);
          setStatus("ready");
          if (pending.current) flushRef.current();
        }
      })
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
    };
  }, [demoOnly, setLive]);

  // Answers autosave on a short debounce; a page turn or leaving the tab flushes it.
  const pending = useRef<TradeProfileState | null>(null);
  const flushRef = useRef<() => void>(() => {});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const s = pending.current;
    pending.current = null;
    if (!s) return;
    saveTradeProfile({ answers: s.answers, page: s.page, consented_on: s.consentedOn })
      .then(() => setSaveError(false))
      .catch(() => setSaveError(true));
  }, []);
  useEffect(() => {
    flushRef.current = flush;
    const onHide = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [flush]);

  const isDemo = demo !== null;
  const state = demo ? demo.state : live;
  const todayKey = today(demo?.dayOffset ?? 0);

  /** Apply a change to whichever state is active; returns the new state. */
  const apply = useCallback(
    (recipe: (draft: TradeProfileState) => void): TradeProfileState => {
      const d = demoRef.current;
      const next = structuredClone(d ? d.state : liveRef.current);
      recipe(next);
      if (d) setDemo({ ...d, state: next });
      else setLive(next);
      return next;
    },
    [setDemo, setLive],
  );

  /** Run a write against Supabase, unless this is the demo. */
  const persist = useCallback(
    async (write: () => Promise<void>) => {
      if (isDemo || demoOnly) return;
      try {
        await write();
        setSaveError(false);
      } catch (e) {
        setSaveError(true);
        throw e;
      }
    },
    [isDemo, demoOnly],
  );

  const queueAnswers = useCallback(
    (next: TradeProfileState, immediate = false) => {
      if (isDemo || demoOnly) return;
      if (!next.completedOn) writeDraft<AnswersDraft>(ANSWERS_DRAFT, { answers: next.answers, page: next.page });
      pending.current = next;
      if (timer.current) clearTimeout(timer.current);
      if (immediate) flush();
      else timer.current = setTimeout(flush, ANSWER_SAVE_DELAY);
    },
    [isDemo, demoOnly, flush],
  );

  const store: TradeProfileStore = {
    status,
    state,
    todayKey,
    demo: demo ? { personaId: demo.personaId, dayOffset: demo.dayOffset } : null,
    saveError,
    consent: () => {
      const next = apply((s) => {
        s.consentedOn ??= todayKey;
      });
      queueAnswers(next, true);
    },
    answer: (id, a) => queueAnswers(apply((s) => void (s.answers[id] = a))),
    fillAnswers: (answers) => queueAnswers(apply((s) => void (s.answers = answers)), true),
    setPage: (page) => queueAnswers(apply((s) => void (s.page = page)), true),
    completeAssessment: () => {
      flush();
      if (!isDemo) clearDraft(ANSWERS_DRAFT);
      const next = apply((s) => {
        s.completedOn = todayKey;
        s.page = 0;
      });
      void persist(() => saveTradeProfile({ answers: next.answers, page: 0, completed_on: next.completedOn })).catch(() => {});
    },
    restartAssessment: () => {
      if (!isDemo) clearDraft(ANSWERS_DRAFT);
      const next = apply((s) => {
        s.answers = {};
        s.page = 0;
        s.completedOn = null;
      });
      void persist(() => saveTradeProfile({ answers: next.answers, page: 0, completed_on: null })).catch(() => {});
    },
    saveGoal: async (goal) => {
      const next = apply((s) => {
        s.goal = goal;
        s.programStart ??= todayKey;
      });
      await persist(() => saveTradeProfile(stateToRow(next)));
    },
    saveCheckin: async (date, c) => {
      apply((s) => void (s.checkins[date] = c));
      await persist(() =>
        saveTradeProfileCheckin({ date, exercise_id: c.exerciseId, done: c.done, difficulty: c.difficulty, state: c.state }),
      );
    },
    saveReflection: async (week, answers) => {
      apply((s) => void (s.reflections[week] = { answers, date: todayKey }));
      await persist(() => saveTradeProfileReflection(week, answers));
    },
    saveRetest: async (week, answers) => {
      apply((s) => {
        s.retests = [...s.retests.filter((r) => r.week !== week), { week, date: todayKey, answers }].sort((a, b) => a.week - b.week);
      });
      await persist(() => saveTradeProfileRetest(week, todayKey, answers));
    },
    reset: async () => {
      if (demo) {
        const p = personas.find((x) => x.id === demo.personaId);
        setDemo({ ...demo, dayOffset: 0, state: p ? personaState(p, today()) : emptyTradeProfile() });
        return;
      }
      await persist(resetTradeProfile);
      clearDraft(ANSWERS_DRAFT);
      setLive(emptyTradeProfile());
    },
    startDemo: (personaId) => {
      const p = personas.find((x) => x.id === personaId) ?? personas[0];
      setDemo({ personaId: p.id, dayOffset: 0, state: personaState(p, today()) });
    },
    // The dev preview has no live data to fall back to: "exit" there means a
    // fresh, empty trader, so onboarding and the assessment can be tried too.
    exitDemo: () => setDemo(demoOnly ? { personaId: FRESH, dayOffset: 0, state: emptyTradeProfile() } : null),
    setDayOffset: (n) => demo && setDemo({ ...demo, dayOffset: n }),
  };

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

/** Everything the screens derive from the raw state, computed once per change. */
export function useDerived() {
  const { state, todayKey } = useTradeProfile();
  return useMemo(() => {
    const complete = isComplete(items, state.answers);
    const profile = complete ? scoreProfile(items, state.answers) : null;
    const focus = profile ? placeInFocus(profile) : null;
    const goalTarget = state.goal ? { trait: state.goal.trait, direction: state.goal.direction } : null;
    const schedule = goalTarget ? buildProgram(exercises, goalTarget, (state.goal?.area ?? undefined) as FocusAreaId | undefined) : null;
    const position = state.programStart ? programPosition(state.programStart, todayKey) : null;
    return {
      complete,
      finished: complete && state.completedOn !== null,
      profile,
      focus,
      supportNote: profile ? needsSupportNote(profile) : false,
      goalTarget,
      schedule,
      position,
    };
  }, [state, todayKey]);
}
