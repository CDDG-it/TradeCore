"use client";

import { useEffect, useRef, useState } from "react";
import { MotionConfig, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/trade-profile/content/copy";
import { DemoBar } from "@/components/trade-profile/demo-bar";
import { Onboarding } from "@/components/trade-profile/onboarding";
import { AssessmentView } from "@/components/trade-profile/assessment";
import { DomainDetail, ProfileView } from "@/components/trade-profile/profile-view";
import { GoalView } from "@/components/trade-profile/goal-view";
import { TodayView } from "@/components/trade-profile/today-view";
import { ProgressView } from "@/components/trade-profile/progress-view";
import { LibraryView } from "@/components/trade-profile/library-view";
import { RetestView } from "@/components/trade-profile/retest-view";
import { ReflectionView } from "@/components/trade-profile/reflection-view";
import { ExerciseSheet } from "@/components/trade-profile/exercise-sheet";
import { SetupNotice } from "@/components/trade-profile/setup-notice";
import { useDerived, useTradeProfile } from "@/components/trade-profile/store";
import {
  currentEntry,
  ProfileNavContext,
  pushEntry,
  type ProfileNav,
  type ProfileTab,
  type ProfileView as View,
} from "@/components/trade-profile/nav";

const SECTIONS: { key: ProfileTab; label: string }[] = (Object.keys(copy.tabs) as (keyof typeof copy.tabs)[]).map((key) => ({ key, label: copy.tabs[key] }));
const ALL_TABS: ProfileTab[] = ["today", "profile", "progress", "goal", "library"];
/** The tab that stays underlined while a screen without its own tab is open. */
const PARENT: Partial<Record<ProfileTab, ProfileTab>> = { goal: "today", library: "profile" };
/** Older links pointed at sections that are now part of another one. */
const RENAMED: Record<string, ProfileTab> = { focus: "profile" };
const TODAY: View = { kind: "tab", tab: "today" };
const EASE = [0.23, 1, 0.32, 1] as const;
/** The Therapist owns `?tab=`; the section inside My Trade Profile rides on `?section=`. */
const PARAM = "section";

function urlFor(view: View): URL {
  const url = new URL(window.location.href);
  if (view.kind === "tab" && view.tab !== "today") url.searchParams.set(PARAM, view.tab);
  else if (view.kind === "tab") url.searchParams.delete(PARAM);
  return url;
}

/**
 * My Trade Profile, as a section of MC Trade Therapist: a Big Five assessment
 * (IPIP-NEO-60) turned into a 12-week development program. Before the
 * assessment is done it is an onboarding flow; after it, three sections
 * (Today, Profile, Progress), with the goal and the evidence one click away.
 *
 * It fills the Therapist's viewport-high frame and scrolls inside it. Every
 * move (a sub-section, a facet drill-down, a retest, an assessment page) is a
 * browser history entry, so back steps back one screen with answers intact.
 */
export function TradeProfileApp() {
  const store = useTradeProfile();
  const { finished, goalTarget } = useDerived();
  const [view, setView] = useState<View>(TODAY);
  const [exercise, setExercise] = useState<string | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const scrollTop = (smooth = false) => frame.current?.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });

  // Seed from the URL after mount (the page is prerendered, so reading it during
  // render would make server and client disagree), then follow back/forward.
  useEffect(() => {
    const entry = currentEntry();
    const raw = new URLSearchParams(window.location.search).get(PARAM) ?? "";
    const t = RENAMED[raw] ?? raw;
    const initial: View = entry?.view ?? (ALL_TABS.includes(t as ProfileTab) ? { kind: "tab", tab: t as ProfileTab } : TODAY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot sync from the URL, not a render loop
    setView(initial);
    if (!entry) pushEntry({ view: initial }, undefined, true);
    const onPop = () => {
      const e = currentEntry();
      if (e) setView(e.view);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // A returning trader who already consented resumes straight into the questions:
  // the entry they landed on becomes the assessment, so "Back" from the first
  // question leads to the intro rather than into the same screen again.
  const resume = store.status === "ready" && !finished && store.state.consentedOn !== null && view.kind === "tab";
  useEffect(() => {
    if (!resume) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot correction once the profile has loaded
    setView({ kind: "assessment" });
    pushEntry({ view: { kind: "assessment" } }, undefined, true);
  }, [resume]);

  function go(next: View) {
    setView(next);
    pushEntry({ view: next }, urlFor(next));
    scrollTop();
  }

  const nav: ProfileNav = {
    goTab: (tab) => go({ kind: "tab", tab }),
    openDomain: (code) => go({ kind: "domain", code }),
    openRetest: (week) => go({ kind: "retest", week }),
    openReflection: (week) => go({ kind: "reflection", week }),
    openExercise: setExercise,
    startAssessment: () => {
      // Mark the entry the intro was shown on as the intro, so back returns here.
      pushEntry({ view: { kind: "intro" } }, undefined, true);
      go({ kind: "assessment" });
    },
    back: (fallback = TODAY) => {
      if ((currentEntry()?.depth ?? 0) > 0) window.history.back();
      else {
        setView(fallback);
        pushEntry({ view: fallback }, urlFor(fallback), true);
        scrollTop();
      }
    },
    scrollTop,
  };

  // Without a goal there is no program yet, so Today would be empty: show the profile first.
  const tabOf = (raw: ProfileTab): ProfileTab => {
    const t = RENAMED[raw] ?? raw;
    return t === "today" && !goalTarget ? "profile" : t;
  };
  const shownTab: ProfileTab = view.kind === "tab" ? tabOf(view.tab) : view.kind === "domain" ? "profile" : tabOf("today");
  // Intro and assessment entries left in history after finishing show the sections too.
  const inSection = view.kind !== "retest" && view.kind !== "reflection";

  let body: React.ReactNode;
  let viewKey: string;
  if (store.status === "loading") [body, viewKey] = [<LoadingState key="l" />, "loading"];
  else if (store.status === "setup" && !store.demo) [body, viewKey] = [<SetupNotice key="s" />, "setup"];
  else if (store.status === "error" && !store.demo) [body, viewKey] = [<p key="e" className="text-sm text-muted-foreground">{copy.loadError}</p>, "error"];
  else if (!finished) {
    const assessing = view.kind === "assessment" || resume;
    body = assessing ? <AssessmentView /> : <Onboarding onStart={nav.startAssessment} />;
    viewKey = assessing ? "assessment" : "intro";
  } else if (view.kind === "retest") [body, viewKey] = [<RetestView key="r" week={view.week} />, `retest-${view.week}`];
  else if (view.kind === "reflection") [body, viewKey] = [<ReflectionView key="f" week={view.week} />, `reflection-${view.week}`];
  else if (view.kind === "domain") [body, viewKey] = [<DomainDetail key="d" code={view.code} />, `domain-${view.code}`];
  else {
    viewKey = shownTab;
    body = (
      <>
        {shownTab === "today" && <TodayView />}
        {shownTab === "profile" && <ProfileView />}
        {shownTab === "goal" && <GoalView />}
        {shownTab === "progress" && <ProgressView />}
        {shownTab === "library" && <LibraryView />}
      </>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <ProfileNavContext.Provider value={nav}>
        <div ref={frame} className="h-full overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
          <div className="w-full space-y-5 pb-10">
            {finished && inSection && <SectionTabs value={PARENT[shownTab] ?? shownTab} onChange={nav.goTab} />}
            {store.demo && <DemoBar />}
            {store.saveError && !store.demo && (
              <p role="status" className="rounded-xl border border-loss/30 bg-loss/10 px-3 py-2 text-xs text-loss">
                {copy.saveError}
              </p>
            )}
            {/* Enter-only fade, like PageWrapper: a section change never waits on the old one leaving. */}
            <motion.div key={viewKey} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: EASE }}>
              {body}
            </motion.div>
          </div>
        </div>
        <ExerciseSheet id={exercise} onClose={() => setExercise(null)} />
      </ProfileNavContext.Provider>
    </MotionConfig>
  );
}

/**
 * The sub-sections as one quiet text row with a sliding underline, rather than
 * a second dropdown inside the Therapist's own section picker. It scrolls
 * sideways on a phone instead of wrapping.
 */
function SectionTabs({ value, onChange }: { value: ProfileTab; onChange: (t: ProfileTab) => void }) {
  return (
    <nav aria-label={copy.title} className="sticky top-0 z-30 -mx-1 border-b border-border/50 bg-background/90 px-1 backdrop-blur-md">
      <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SECTIONS.map((s) => {
          const on = s.key === value;
          return (
            <button
              key={s.key}
              type="button"
              aria-current={on ? "page" : undefined}
              onClick={() => onChange(s.key)}
              className={cn(
                "relative shrink-0 px-3 py-3 text-[13px] font-semibold tracking-tight transition-colors outline-none focus-visible:text-primary",
                on ? "text-foreground" : "text-foreground/50 hover:text-foreground/80",
              )}
            >
              {s.label}
              {on && (
                <motion.span
                  layoutId="trade-profile-section"
                  className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 480, damping: 38 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-4 pt-2 lg:grid-cols-[1.35fr_1fr]" aria-busy>
      <div className="h-80 animate-pulse rounded-2xl border border-border/40 bg-card/60" />
      <div className="space-y-4">
        <div className="h-36 animate-pulse rounded-2xl border border-border/40 bg-card/60" />
        <div className="h-40 animate-pulse rounded-2xl border border-border/40 bg-card/60" />
      </div>
    </div>
  );
}
