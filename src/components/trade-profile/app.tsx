"use client";

import { useEffect, useState } from "react";
import { MotionConfig, motion } from "motion/react";
import { SectionNav } from "@/components/layout/section-nav";
import { copy } from "@/lib/trade-profile/content/copy";
import { DemoBar } from "@/components/trade-profile/demo-bar";
import { Onboarding } from "@/components/trade-profile/onboarding";
import { AssessmentView } from "@/components/trade-profile/assessment";
import { ProfileView } from "@/components/trade-profile/profile-view";
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
import { ProfileNavContext, type ProfileNav, type ProfileTab } from "@/components/trade-profile/nav";

const TABS: { key: ProfileTab; label: string }[] = (Object.keys(copy.tabs) as ProfileTab[]).map((key) => ({ key, label: copy.tabs[key] }));

/** A view that replaces the tab content until the trader finishes or goes back. */
type Overlay = { kind: "retest"; week: number } | { kind: "reflection"; week: number } | null;

const EASE = [0.23, 1, 0.32, 1] as const;

/**
 * My Trade Profile: a Big Five assessment (IPIP-NEO-120) turned into a
 * 12-week development program. Before the assessment is done the page is an
 * onboarding flow; after it, six sections behind the shared section picker.
 */
export function TradeProfileApp() {
  const store = useTradeProfile();
  const { finished, goalTarget } = useDerived();
  const [tab, setTab] = useState<ProfileTab>("today");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [exercise, setExercise] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  // Read the deep-linked tab after mount: the page is prerendered, so seeding
  // state from the URL during render would make server and client disagree.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot sync from the URL, not a render loop
    if (TABS.some((x) => x.key === t)) setTab(t as ProfileTab);
  }, []);

  function goTab(next: ProfileTab) {
    setOverlay(null);
    setTab(next);
    const url = new URL(window.location.href);
    if (next === "today") url.searchParams.delete("tab");
    else url.searchParams.set("tab", next);
    window.history.replaceState(window.history.state, "", url);
    window.scrollTo({ top: 0 });
  }

  const nav: ProfileNav = {
    goTab,
    openRetest: (week) => {
      setOverlay({ kind: "retest", week });
      window.scrollTo({ top: 0 });
    },
    openReflection: (week) => {
      setOverlay({ kind: "reflection", week });
      window.scrollTo({ top: 0 });
    },
    closeOverlay: () => setOverlay(null),
    openExercise: setExercise,
  };

  // Without a goal there is no program yet, so Today would be empty: show the profile first.
  const shownTab: ProfileTab = tab === "today" && !goalTarget ? "profile" : tab;

  let body: React.ReactNode;
  if (store.status === "loading") body = <LoadingState />;
  else if (store.status === "setup" && !store.demo) body = <SetupNotice />;
  else if (store.status === "error" && !store.demo) body = <p className="text-sm text-muted-foreground">{copy.loadError}</p>;
  else if (!finished) {
    body = started || store.state.consentedOn ? <AssessmentView /> : <Onboarding onStart={() => setStarted(true)} />;
  } else if (overlay?.kind === "retest") body = <RetestView week={overlay.week} />;
  else if (overlay?.kind === "reflection") body = <ReflectionView week={overlay.week} />;
  else {
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

  const viewKey = !finished ? "onboarding" : overlay ? `${overlay.kind}-${overlay.week}` : shownTab;

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
                onChange={goTab}
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
