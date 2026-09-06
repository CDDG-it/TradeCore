"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Privacy mode — masks monetary figures (balances, costs, payouts) across the app,
 * like a banking app's "hide balance" shield for when you're in public.
 *
 * Persisted in localStorage and synced across every component that uses the hook
 * (and across browser tabs) so one toggle hides everything at once.
 */
const KEY = "tradecore:privacy";
const EVENT = "tradecore:privacy-change";

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// Nothing is hidden until the browser says otherwise, which is also what the
// server renders.
const serverSnapshot = () => false;

/**
 * The setting lives in localStorage, so it is read straight from there with
 * `useSyncExternalStore` instead of being copied into React state on mount.
 * Every caller of the hook reads the same source, so one toggle still hides
 * everything at once — now without a second render per component.
 */
export function usePrivacy() {
  const hidden = useSyncExternalStore(subscribe, read, serverSnapshot);

  const toggle = useCallback(() => {
    try {
      localStorage.setItem(KEY, read() ? "0" : "1");
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { hidden, toggle };
}

/** Replace a sensitive value with a dotted placeholder when privacy mode is on. */
export function mask(value: string | number, hidden: boolean): string {
  return hidden ? "••••" : String(value);
}
