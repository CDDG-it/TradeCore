"use client";

/**
 * Warms the reads every screen shares.
 *
 * Each page fetches its own data on mount, so the first visit to the journal,
 * analytics or the therapist used to start with a spinner even though the
 * dashboard had already loaded the same rows. This runs once for the session:
 * the app shell survives navigation, and fills the read cache in the
 * background, so a page switch renders from memory instead of a round trip.
 *
 * Deliberately fire-and-forget: nothing renders, nothing blocks, and a failure
 * just means the page fetches for itself as before.
 *
 * What is warmed is a judgement about cost, not a list of everything shared.
 * Analyses used to be here and are not any more: the two screens that need the
 * list fetch it on mount anyway, and the journal's new-trade form explicitly
 * drops the cached copy before reading, so warming it was bytes spent for
 * nothing on every session. The profile took its place because it is a single
 * row read by four screens.
 *
 * `getTrades()` is the expensive one left, and it is fetched whole. Narrowing
 * it means splitting the read that fifteen screens share, which is a larger
 * job than it looks and has not been done yet.
 */
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getTrades, getAccounts, getHabits, getProfile } from "@/lib/supabase/queries";

export function WarmReads() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const warm = () => {
      if (cancelled) return;
      void Promise.allSettled([getTrades(), getAccounts(), getHabits(), getProfile()]);
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
