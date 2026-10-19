"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EASE_OUT, SPRING } from "@/lib/motion";
import { copy } from "@/lib/trade-profile/content/copy";
import { domains, facets } from "@/lib/trade-profile/content/traits";
import { DOMAINS } from "@/lib/trade-profile/types";
import { traitColor } from "@/components/trade-profile/primitives";
import { InlinePill, Marquee } from "@/components/trade-profile/motion-bits";
import { useTradeProfile } from "@/components/trade-profile/store";

/** Heights of the five capsules on the front door: a profile shape, not anyone's scores. */
const SHAPE = [62, 84, 48, 72, 92];

/**
 * The front door, as an editorial split: the promise and the one decision
 * (consent, start) on the left, a quiet picture of the five traits on the
 * right with room around it. Under it, the thirty facets drift past, then the
 * four steps and what the tool is not.
 */
export function Onboarding({ onStart }: { onStart: () => void }) {
  const { state, consent } = useTradeProfile();
  const reduce = useReducedMotion();
  const [agreed, setAgreed] = useState(state.consentedOn !== null);
  const started = Object.keys(state.answers).length > 0;
  const t = copy.welcome;
  // The headline carries the five trait colours inside its first sentence.
  const [first, ...rest] = t.title.split(". ");
  const second = rest.join(". ");

  return (
    <div className="space-y-10 pt-4 lg:space-y-14 lg:pt-8">
      {/* ── The promise and the decision, beside the five traits ──── */}
      <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:gap-12">
        <div className="min-w-0">
          <motion.p className="text-xs font-semibold text-primary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            {t.eyebrow}
          </motion.p>
          <motion.h2
            className="mt-4 max-w-4xl font-heading text-[clamp(2.1rem,3.8vw,3.4rem)] font-bold leading-[1.05] tracking-[-0.035em] [text-wrap:balance]"
            initial={{ opacity: 0, transform: "translateY(14px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
          >
            {second ? (() => {
              // The last word, the pill and the full stop travel together, so the pill never starts a line.
              const words = first.split(" ");
              const last = words.pop();
              return <>{words.join(" ")} <span className="whitespace-nowrap">{last}<InlinePill className="mr-0.5" />.</span> <span className="text-foreground/70">{second}</span></>;
            })() : t.title}
          </motion.h2>
          <motion.p
            className="mt-5 max-w-[56ch] text-[15px] leading-relaxed text-muted-foreground"
            initial={{ opacity: 0, transform: "translateY(10px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            transition={{ duration: 0.5, delay: 0.1, ease: EASE_OUT }}
          >
            {t.lead}
          </motion.p>

          <motion.div
            className="mt-8 max-w-xl rounded-2xl border border-white/[0.08] bg-card/80 p-4 shadow-[0_24px_60px_-40px_rgba(0,0,0,.9)] backdrop-blur-sm sm:p-5"
            initial={{ opacity: 0, transform: "translateY(10px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            transition={{ duration: 0.5, delay: 0.18, ease: EASE_OUT }}
          >
            <button type="button" role="checkbox" aria-checked={agreed} onClick={() => setAgreed(!agreed)} className="press flex w-full items-start gap-3 text-left">
              <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors duration-200", agreed ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/60")}>
                <AnimatePresence initial={false}>
                  {agreed && (
                    <motion.span key="tick" className="flex" initial={{ opacity: 0, transform: "scale(0.5)" }} animate={{ opacity: 1, transform: "scale(1)" }} exit={{ opacity: 0, transform: "scale(0.6)", transition: { duration: 0.08 } }} transition={SPRING}>
                      <Check className="size-3.5" strokeWidth={3} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
              <span className="text-sm leading-relaxed text-foreground/85">{t.consent}</span>
            </button>
            <Button
              size="lg"
              className="group mt-4 w-full sm:w-auto"
              disabled={!agreed}
              onClick={() => {
                consent();
                onStart();
              }}
            >
              {started ? t.resume : t.start}
              <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
          </motion.div>
        </div>

        {/* ── Five traits as five capsules, rising into place ─────────── */}
        <div aria-hidden className="relative hidden h-[22rem] lg:block">
          <div className="absolute inset-x-6 inset-y-4 rounded-[2rem] border border-white/[0.06] bg-[radial-gradient(ellipse_at_50%_100%,rgba(20,184,166,.12),transparent_65%)]" />
          <div className="absolute inset-x-12 bottom-10 top-10 flex items-end justify-between gap-4">
            {DOMAINS.map((d, i) => (
              <div key={d} className="flex h-full flex-1 flex-col items-center justify-end gap-3">
                <motion.div
                  className="w-full max-w-14 origin-bottom rounded-full shadow-[0_0_40px_-8px_var(--glow)]"
                  style={{ height: `${SHAPE[i]}%`, background: `linear-gradient(180deg, ${traitColor[d]}, color-mix(in oklch, ${traitColor[d]} 25%, transparent))`, ["--glow" as string]: traitColor[d] }}
                  initial={{ transform: reduce ? "scaleY(1)" : "scaleY(0)", opacity: reduce ? 1 : 0 }}
                  animate={{ transform: "scaleY(1)", opacity: 1 }}
                  transition={{ type: "spring", stiffness: 140, damping: 20, delay: 0.25 + i * 0.08 }}
                />
                <span className="text-[11px] font-semibold text-muted-foreground">{domains[d].name.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The thirty facets, drifting past ─────────────────────────── */}
      <Marquee items={Object.values(facets).map((f) => f.name)} className="-mx-2 border-y border-white/[0.06] py-4 font-heading text-lg font-semibold tracking-tight text-foreground/35" />

      {/* ── How it works ─────────────────────────────────────────────── */}
      <ol className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-4">
        {t.steps.map((s, i) => (
          <li key={s.title} className="rise-in group relative bg-card/90 p-5" style={{ ["--i" as string]: i }}>
            <span className="font-heading text-sm font-bold tabular-nums text-primary">{i + 1}</span>
            <h3 className="mt-3 font-heading text-[15px] font-bold tracking-tight">{s.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            <span aria-hidden className="absolute inset-x-5 bottom-0 h-px origin-left scale-x-0 bg-primary/60 transition-transform duration-500 ease-out group-hover:scale-x-100" />
          </li>
        ))}
      </ol>

      <div className="max-w-3xl rounded-2xl border border-border/50 bg-background/30 p-4 sm:p-5">
        <p className="text-xs font-semibold text-foreground/85">{t.noticeTitle}</p>
        <ul className="mt-2 grid gap-x-8 gap-y-1.5 text-xs leading-relaxed text-muted-foreground sm:grid-cols-2">
          {t.notices.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
