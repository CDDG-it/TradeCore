"use client";

import { useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { AccentPanel } from "@/components/ui/accent-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/trade-profile/content/copy";
import { personaText } from "@/lib/trade-profile/content/personas";
import { personas } from "@/lib/trade-profile/personas";
import { useTradeProfile } from "@/components/trade-profile/store";
import { Eyebrow } from "@/components/trade-profile/primitives";

/** Welcome, consent, and a way into the demo before committing 25 minutes. */
export function Onboarding({ onStart }: { onStart: () => void }) {
  const { state, consent, startDemo } = useTradeProfile();
  const [agreed, setAgreed] = useState(state.consentedOn !== null);
  const started = Object.keys(state.answers).length > 0;
  const t = copy.welcome;

  return (
    <div className="space-y-5">
      <header className="pt-1">
        <Eyebrow tone="primary">{t.eyebrow}</Eyebrow>
        <h2 className="mt-3 max-w-2xl font-heading text-[28px] font-bold leading-[1.1] tracking-tight sm:text-4xl">{t.title}</h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">{t.lead}</p>
      </header>

      <ol className="grid gap-3 sm:grid-cols-2">
        {t.steps.map((s, i) => (
          <li key={s.title} className="rise-in rounded-2xl border border-border/60 bg-card p-4 sm:p-5" style={{ ["--i" as string]: i }}>
            <span className="text-xs font-bold tabular-nums text-ice">0{i + 1}</span>
            <h3 className="mt-1.5 font-heading font-bold tracking-tight">{s.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
          </li>
        ))}
      </ol>

      <AccentPanel accent="primary" eyebrow={t.noticeTitle}>
        <ul className="mt-3 space-y-2">
          {t.notices.map((n) => (
            <li key={n} className="flex gap-2.5 text-sm leading-relaxed text-foreground/80">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              {n}
            </li>
          ))}
        </ul>

        <button
          type="button"
          role="checkbox"
          aria-checked={agreed}
          onClick={() => setAgreed(!agreed)}
          className="press mt-5 flex w-full items-start gap-3 rounded-xl border border-border/60 bg-background/40 p-3.5 text-left"
        >
          <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors", agreed ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/60")}>
            {agreed && <Check className="size-3.5" strokeWidth={3} />}
          </span>
          <span className="text-sm leading-relaxed text-foreground/85">{t.consent}</span>
        </button>

        <div className="mt-4">
          <Button
            size="lg"
            disabled={!agreed}
            onClick={() => {
              consent();
              onStart();
            }}
          >
            {started ? t.resume : t.start}
          </Button>
        </div>
      </AccentPanel>

      <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
        <Eyebrow tone="ice">{copy.demo.pickTitle}</Eyebrow>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{copy.demo.pickLead}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {personas.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => startDemo(p.id)}
              className="press rounded-xl border border-border/50 bg-background/30 p-3 text-left transition-colors hover:border-ice/40"
            >
              <span className="block text-sm font-semibold">{personaText[p.id].name}</span>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{personaText[p.id].description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
