"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/trade-profile/content/copy";
import { useTradeProfile } from "@/components/trade-profile/store";

/**
 * The front door, as an asymmetric split: the promise and the one decision
 * (consent, start) on the left; how it works and what it is not on the right.
 */
export function Onboarding({ onStart }: { onStart: () => void }) {
  const { state, consent } = useTradeProfile();
  const [agreed, setAgreed] = useState(state.consentedOn !== null);
  const started = Object.keys(state.answers).length > 0;
  const t = copy.welcome;

  return (
    <div className="grid gap-6 pt-2 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-10 lg:pt-6">
      {/* ── The promise and the decision ───────────────────────── */}
      <section className="min-w-0">
        <p className="text-xs font-semibold text-primary">{t.eyebrow}</p>
        <h2 className="mt-3 max-w-[16ch] font-heading text-[32px] font-bold leading-[1.05] tracking-tight [text-wrap:balance] sm:text-[44px]">{t.title}</h2>
        <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground">{t.lead}</p>

        <div className="mt-7 max-w-xl rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
          <button
            type="button"
            role="checkbox"
            aria-checked={agreed}
            onClick={() => setAgreed(!agreed)}
            className="press flex w-full items-start gap-3 text-left"
          >
            <span
              className={cn(
                "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors duration-200",
                agreed ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/60",
              )}
            >
              {agreed && <Check className="size-3.5" strokeWidth={3} />}
            </span>
            <span className="text-sm leading-relaxed text-foreground/85">{t.consent}</span>
          </button>
          <Button
            size="lg"
            className="mt-4 w-full sm:w-auto"
            disabled={!agreed}
            onClick={() => {
              consent();
              onStart();
            }}
          >
            {started ? t.resume : t.start} <ArrowRight />
          </Button>
        </div>

      </section>

      {/* ── How it works, and what it is not ───────────────────── */}
      <aside className="min-w-0 space-y-5 lg:pt-2">
        <ol className="relative space-y-5 border-l border-border/60 pl-5">
          {t.steps.map((s, i) => (
            <li key={s.title} className="rise-in relative" style={{ ["--i" as string]: i }}>
              <span
                aria-hidden
                className={cn("absolute -left-[25px] top-1.5 size-2 rounded-full ring-4 ring-background", i === 0 ? "bg-primary" : "bg-muted-foreground/40")}
              />
              <h3 className="font-heading text-[15px] font-bold tracking-tight">{s.title}</h3>
              <p className="mt-0.5 max-w-[48ch] text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="rounded-2xl border border-border/50 bg-background/30 p-4">
          <p className="text-xs font-semibold text-foreground/85">{t.noticeTitle}</p>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
            {t.notices.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
