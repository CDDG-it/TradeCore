import { notFound } from "next/navigation";
import { getEmailContent } from "@/lib/email/templates";

/**
 * Development only: every account email, rendered as the reader gets it.
 *
 * Changing an email otherwise means triggering a real sign-up or password
 * reset and waiting for it to arrive, which is a slow way to move a button
 * eight pixels. Each one is shown in an iframe so the mail's own styling is
 * sealed off from the app's; that also means what you see here is close to
 * what a client shows, though never identical, since every client rewrites
 * the HTML its own way. Outlook in particular strips more than the rest.
 */

const TYPES = ["signup", "recovery", "invite", "magiclink", "email_change", "reauthentication"];

const SAMPLE_URL =
  "https://tradingmc.com/auth/confirm?token_hash=sample-token-hash-for-preview&type=signup";

export default function EmailPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header>
        <h1 className="text-lg font-semibold">Account emails</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Every message Supabase can ask the app to send, with a sample link.
          Edit them in <code className="font-mono text-xs">src/lib/email/templates.ts</code>.
          The last one is the fallback: it covers any type that has no wording
          of its own.
        </p>
      </header>

      {TYPES.map((type) => {
        const { subject, html } = getEmailContent(type, SAMPLE_URL);
        return (
          <section key={type} className="rounded-xl border border-border/60 bg-card p-4">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">{type}</p>
              <p className="text-sm font-medium">{subject}</p>
            </div>
            <iframe
              title={`${type} email`}
              srcDoc={html}
              className="h-[560px] w-full rounded-lg border border-border/40 bg-white"
            />
          </section>
        );
      })}
    </div>
  );
}
