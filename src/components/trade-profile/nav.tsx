"use client";

import { createContext, useContext } from "react";

export type ProfileTab = "today" | "profile" | "focus" | "goal" | "progress" | "library";

/** How the sections move between each other without knowing about the page. */
export interface ProfileNav {
  goTab: (tab: ProfileTab) => void;
  openRetest: (week: number) => void;
  openReflection: (week: number) => void;
  closeOverlay: () => void;
  openExercise: (id: string) => void;
}

export const ProfileNavContext = createContext<ProfileNav | null>(null);

export function useProfileNav(): ProfileNav {
  const n = useContext(ProfileNavContext);
  if (!n) throw new Error("useProfileNav outside TradeProfileApp");
  return n;
}
