"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";

type Theme = "dark" | "light";

const KEY = "th_theme";
const EVENT = "th_theme_change";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggleTheme: () => {},
});

/**
 * The stored preference is external state, so it is read with
 * `useSyncExternalStore` rather than copied into React state from an effect.
 * That removes the extra render the old version did on every mount, and keeps
 * two providers (or two tabs) from disagreeing about the current theme.
 */
function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === "light" ? "light" : "dark";
  } catch {
    // Private windows and blocked site data both throw here.
    return "dark";
  }
}

// Dark is the product's default, and what the server renders.
const serverTheme = (): Theme => "dark";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readTheme, serverTheme);

  // Painting the class onto <html> is the one genuine external sync here.
  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Nothing to store into; the toggle still takes effect for this session.
    }
    window.dispatchEvent(new Event(EVENT));
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
