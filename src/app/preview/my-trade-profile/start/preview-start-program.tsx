"use client";

import { TradeProfileProvider } from "@/components/trade-profile/store";
import { ProfileNavContext, type ProfileNav } from "@/components/trade-profile/nav";
import { StartProgram } from "@/components/trade-profile/start-program";
import { ExerciseSheet } from "@/components/trade-profile/exercise-sheet";
import { DemoBar } from "@/components/trade-profile/demo-bar";
import { useState } from "react";

export function PreviewStartProgram() {
  const [exercise, setExercise] = useState<string | null>(null);
  const nav: ProfileNav = {
    goTab: (tab) => alert(`Would open: ${tab}`),
    openDomain: () => {},
    openRetest: () => {},
    openReflection: () => {},
    openExercise: setExercise,
    startAssessment: () => {},
    back: () => {},
    scrollTop: () => {},
  };
  return (
    <main className="min-h-dvh space-y-4 bg-background p-4 sm:p-6">
      <TradeProfileProvider demoOnly>
        <ProfileNavContext.Provider value={nav}>
          <DemoBar />
          <StartProgram />
          <ExerciseSheet id={exercise} onClose={() => setExercise(null)} />
        </ProfileNavContext.Provider>
      </TradeProfileProvider>
    </main>
  );
}
