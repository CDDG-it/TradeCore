"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";

/** What the trader picked. "system" follows the OS, the way macOS and iOS do. */
export type ThemePreference = "dark" | "light" | "system";
/** What is actually painted. */
export type Theme = "dark" | "light";

const KEY = "th_theme";
const EVENT = "th_theme_change";
const MEDIA = "(prefers-color-scheme: light)";

interface ThemeContextValue {
  /** The theme on screen right now — always resolved, never "system". */
  theme: Theme;
  /** What the trader chose, which may be "system". */
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => void;
  /** Flip between light and dark, leaving "system" behind. */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  preference: "dark",
  setPreference: () => {},
  toggleTheme: () => {},
});

/* ── The stored preference ────────────────────────────────────────────────
   External state, so it is read with `useSyncExternalStore` rather than
   copied into React state from an effect. That removes the extra render the
   old version did on every mount, and keeps two providers (or two tabs) from
   disagreeing about the current theme. */

function subscribePreference(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function readPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "system") return v;
    return "dark";
  } catch {
    // Private windows and blocked site data both throw here.
    return "dark";
  }
}

/* ── The system's own setting ─────────────────────────────────────────────
   A second external store, so that a trader on "system" repaints the moment
   macOS flips at sunset — without the preference store having to know about
   the OS, or vice versa. */

function subscribeSystem(onChange: () => void) {
  const mq = window.matchMedia(MEDIA);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function readSystem(): Theme {
  try {
    return window.matchMedia(MEDIA).matches ? "light" : "dark";
  } catch {
    return "dark";
  }
}

// Dark is the product's default, and what the server renders. The inline
// script in the document head corrects the class before first paint, so a
// light-mode trader never sees a navy flash.
const serverPreference = (): ThemePreference => "dark";
const serverSystem = (): Theme => "dark";

export function resolveTheme(preference: ThemePreference, system: Theme): Theme {
  return preference === "system" ? system : preference;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const preference = useSyncExternalStore(subscribePreference, readPreference, serverPreference);
  const system = useSyncExternalStore(subscribeSystem, readSystem, serverSystem);
  const theme = resolveTheme(preference, system);

  // Painting the class onto <html> is the one genuine external sync here.
  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    // Lets the browser paint form controls, scrollbars and the overscroll area
    // in the right scheme — the parts CSS variables cannot reach.
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  function setPreference(next: ThemePreference) {
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Nothing to store into; the choice still takes effect for this session.
    }
    window.dispatchEvent(new Event(EVENT));
  }

  function toggleTheme() {
    setPreference(theme === "dark" ? "light" : "dark");
  }

  return (
    <ThemeContext.Provider value={{ theme, preference, setPreference, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
