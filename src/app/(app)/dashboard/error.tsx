"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

/** A read failed on the way in. Say so and offer the retry, instead of a
 *  spinner that never resolves. */
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Dashboard failed to load:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <p className="font-heading text-lg font-bold tracking-tight text-foreground">The desk could not load</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Your data did not come back. This is usually a connection blip; it will be there on the next try.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-1 inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-px"
        style={{ background: "var(--primary)" }}
      >
        <RefreshCw className="h-4 w-4" /> Try again
      </button>
    </div>
  );
}
