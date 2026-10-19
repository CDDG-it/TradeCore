"use client";

import { createContext, useContext } from "react";
import type { DomainCode } from "@/lib/trade-profile/types";

/** Today, Profile, Psychology and Progress are the tabs; Goal and Library open from inside them. */
export type ProfileTab = "today" | "profile" | "psychology" | "progress" | "goal" | "library";

/**
 * Where the page is. Every change is a browser history entry (see app.tsx), so
 * the browser or phone back button steps back through it instead of leaving
 * the page.
 */
export type ProfileView =
  | { kind: "tab"; tab: ProfileTab }
  | { kind: "domain"; code: DomainCode }
  | { kind: "retest"; week: number }
  | { kind: "reflection"; week: number }
  | { kind: "intro" }
  | { kind: "assessment" };

/** How the sections move between each other without knowing about the page. */
export interface ProfileNav {
  goTab: (tab: ProfileTab) => void;
  openDomain: (code: DomainCode) => void;
  openRetest: (week: number) => void;
  openReflection: (week: number) => void;
  openExercise: (id: string) => void;
  startAssessment: () => void;
  /** One step back: the previous history entry when it is ours, otherwise `fallback`. */
  back: (fallback?: ProfileView) => void;
  /** Scroll the section's own scroll frame (not the window) back to the top. */
  scrollTop: (smooth?: boolean) => void;
}

export const ProfileNavContext = createContext<ProfileNav | null>(null);

export function useProfileNav(): ProfileNav {
  const n = useContext(ProfileNavContext);
  if (!n) throw new Error("useProfileNav outside TradeProfileApp");
  return n;
}

/** The key our entries carry in history.state, next to whatever Next.js keeps there. */
export const HISTORY_KEY = "tradeProfile";
export interface HistoryEntry {
  view: ProfileView;
  /** Assessment page, when the entry is a page turn. */
  page?: number;
  /** Position in our own stack; 0 is the entry the page was opened on. */
  depth: number;
}

export function currentEntry(): HistoryEntry | null {
  if (typeof window === "undefined") return null;
  const s = window.history.state as Record<string, unknown> | null;
  const e = s?.[HISTORY_KEY] as HistoryEntry | undefined;
  return e && typeof e.depth === "number" ? e : null;
}

export function pushEntry(entry: Omit<HistoryEntry, "depth">, url?: URL, replace = false) {
  const prev = currentEntry();
  const depth = replace ? (prev?.depth ?? 0) : (prev?.depth ?? 0) + 1;
  const state = { ...(window.history.state ?? {}), [HISTORY_KEY]: { ...entry, depth } };
  if (replace) window.history.replaceState(state, "", url);
  else window.history.pushState(state, "", url);
}
