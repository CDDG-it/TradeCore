"use client";

import { useEffect, useState } from "react";
import { MotionConfig, motion } from "motion/react";
import { SectionNav } from "@/components/layout/section-nav";
import { copy } from "@/lib/trade-profile/content/copy";
import { DemoBar } from "@/components/trade-profile/demo-bar";
import { Onboarding } from "@/components/trade-profile/onboarding";
import { AssessmentView } from "@/components/trade-profile/assessment";
import { DomainDetail, ProfileView } from "@/components/trade-profile/profile-view";
import { FocusView } from "@/components/trade-profile/focus-view";
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

const TABS: { key: ProfileTab; label: string }[] = (Object.keys(copy.tabs) as ProfileTab[]).map((key) => ({ key, label: copy.tabs[key] }));
const TODAY: View = { kind: "tab", tab: "today" };
const EASE = [0.23, 1, 0.32, 1] as const;

/** The address bar only carries the tab; sub-views live in history.state. */
function urlFor(view: View): URL {
  const url = new URL(window.location.href);
  if (view.kind === "tab" && view.tab !== "today") url.searchParams.set("tab", view.tab);
  else if (view.kind === "tab") url.searchParams.delete("tab");
  return url;
}

/**
 * My Trade Profile: a Big Five assessment (IPIP-NEO-120) turned into a
 * 12-week development program. Before the assessment is done the page is an
 * onboarding flow; after it, six sections behind the shared section picker.
 *
 * Every move (a section, a facet drill-down, a retest, an assessment page) is
 * a browser history entry, so back always steps back one screen with the
 * trader's answers intact, and never throws them off the page.
 */
export function TradeProfileApp() {
  const store = useTradeProfile();
  const { finished, goalTarget } = useDerived();
  const [view, setView] = useState<View>(TODAY);
  const [exercise, setExercise] = useState<string | null>(null);

  // Seed from the URL after mount (the page is prerendered, so reading it during
  // render would make server and client disagree), then follow back/forward.
  useEffect(() => {
    const entry = currentEntry();
    const t = new URLSearchParams(window.location.search).get("tab");
    const initial: View = entry?.view ?? (TABS.some((x) => x.key === t) ? { kind: "tab", tab: t as ProfileTab } : TODAY);
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
    window.scrollTo({ top: 0 });
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
        window.scrollTo({ top: 0 });
      }
    },
  };

  // Without a goal there is no program yet, so Today would be empty: show the profile first.
  const tabOf = (t: ProfileTab): ProfileTab => (t === "today" && !goalTarget ? "profile" : t);
  const shownTab: ProfileTab = view.kind === "tab" ? tabOf(view.tab) : view.kind === "domain" ? "profile" : "today";

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
        {shownTab === "focus" && <FocusView />}
        {shownTab === "goal" && <GoalView />}
        {shownTab === "progress" && <ProgressView />}
        {shownTab === "library" && <LibraryView />}
      </>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <ProfileNavContext.Provider value={nav}>
        <div className="mx-auto w-full max-w-4xl space-y-5">
          <div className="flex min-h-10 flex-wrap items-center justify-between gap-3">
            {finished ? (
              <SectionNav
                title={copy.title}
                titleClassName="font-heading font-bold text-lg md:text-xl text-foreground tracking-tight leading-none"
                items={TABS}
                value={shownTab}
                onChange={nav.goTab}
              />
            ) : (
              <h1 className="font-heading text-lg font-bold leading-none tracking-tight text-foreground md:text-xl">{copy.title}</h1>
            )}
          </div>

          {store.demo && <DemoBar />}
          {store.saveError && !store.demo && (
            <p role="status" className="rounded-xl border border-loss/30 bg-loss/10 px-3 py-2 text-xs text-loss">
              {copy.saveError}
            </p>
          )}

          {/* Enter-only fade, like PageWrapper: a section change never waits on the old one leaving. */}
          <motion.div key={viewKey} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16, ease: EASE }}>
            {body}
          </motion.div>
        </div>
        <ExerciseSheet id={exercise} onClose={() => setExercise(null)} />
      </ProfileNavContext.Provider>
    </MotionConfig>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3" aria-busy>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl border border-border/40 bg-card/60" />
      ))}
    </div>
  );
}
