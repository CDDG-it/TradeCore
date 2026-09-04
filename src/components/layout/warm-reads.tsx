"use client";

/**
 * Warms the reads every screen shares.
 *
 * Each page fetches its own data on mount, so the first visit to the journal,
 * analytics or the therapist used to start with a spinner even though the
 * dashboard had already loaded the same rows. This runs once for the session —
 * the app shell survives navigation — and fills the read cache in the
 * background, so a page switch renders from memory instead of a round trip.
 *
 * Deliberately fire-and-forget: nothing renders, nothing blocks, and a failure
 * just means the page fetches for itself as before.
 */
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getTrades, getAccounts, getHabits, getAnalyses } from "@/lib/supabase/queries";

export function WarmReads() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const warm = () => {
      if (cancelled) return;
      void Promise.allSettled([getTrades(), getAccounts(), getHabits(), getAnalyses()]);
    };
    // After paint, so the visible page always wins the network.
    const idle = window.requestIdleCallback?.(warm, { timeout: 1500 }) ?? window.setTimeout(warm, 400);
    return () => {
      cancelled = true;
      window.cancelIdleCallback?.(idle as number);
      window.clearTimeout(idle as number);
    };
  }, [user]);

  return null;
}
