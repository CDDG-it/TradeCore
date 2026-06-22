"use client";

import { useState, useEffect, useCallback } from "react";

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

export function usePrivacy() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(read());
    const sync = () => setHidden(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback(() => {
    setHidden((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new Event(EVENT));
      return next;
    });
  }, []);

  return { hidden, toggle };
}

/** Replace a sensitive value with a dotted placeholder when privacy mode is on. */
export function mask(value: string | number, hidden: boolean): string {
  return hidden ? "••••" : String(value);
}
