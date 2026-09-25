"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Where an account that is not on the testing allowlist lands.
 *
 * Registering stays open, so the page confirms the account exists and is
 * recorded rather than implying the sign-up failed. A trader who reaches this
 * has done nothing wrong, and the page says so plainly.
 */
export default function WaitlistPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null))
      .catch(() => {});
  }, []);

  async function signOut() {
    setSigningOut(true);
    try {
      await createClient().auth.signOut();
    } finally {
      window.location.href = "/";
    }
  }

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#080e1b] px-6 py-16 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,rgba(20,184,166,.14),transparent_32%),radial-gradient(circle_at_18%_62%,rgba(6,182,212,.08),transparent_36%)]"
      />
      <div aria-hidden className="marketing-grid pointer-events-none absolute inset-0 opacity-[.09]" />

      <div className="relative w-full max-w-lg text-center">
        <Link href="/" aria-label="TradingMC home" className="inline-block transition-opacity hover:opacity-75">
          <Image src="/tradingmc-logo.png" alt="TradingMC" width={979} height={500} className="mx-auto h-11 w-auto" />
        </Link>

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <span className="mx-auto grid size-11 place-items-center rounded-full border border-[#14b8a6]/40 bg-[#14b8a6]/10">
            <LockKeyhole className="size-5 text-[#65d4c8]" />
          </span>

          <h1 className="mt-5 font-display text-2xl font-semibold tracking-[-.02em]">
            TradingMC is in private testing
          </h1>

          <p className="mt-3 text-sm leading-[1.75] text-[#9fb7bc]">
            Your account has been created and you are on the list. We are testing with a small group first, so the
            app itself is not open yet. You will hear from us as soon as your account is switched on.
          </p>

          {email && (
            <p className="mt-6 rounded-xl border border-white/10 bg-black/20 px-4 py-3 font-mono text-xs text-[#d4e3e5]">
              {email}
            </p>
          )}

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="marketing-cta inline-flex min-h-11 items-center justify-center rounded-full bg-[#14b8a6] px-6 text-sm font-semibold text-[#081721] hover:bg-[#70d9cf]"
            >
              Back to the site
            </Link>
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut}
              className="marketing-cta inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#5a7f87] px-5 text-sm font-medium text-[#d9e8e9] hover:border-[#a9ddd8] hover:bg-white/5 hover:text-white disabled:opacity-60"
            >
              {signingOut && <Loader2 className="size-4 animate-spin" />}
              Sign out
            </button>
          </div>
        </div>

        <p className="mt-6 text-xs text-[#78939c]">
          Already testing with us and seeing this? Let us know which address you signed up with.
        </p>
      </div>
    </main>
  );
}
