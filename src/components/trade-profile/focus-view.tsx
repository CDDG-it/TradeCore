"use client";

import { ArrowRight } from "lucide-react";
import { AccentPanel } from "@/components/ui/accent-panel";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/trade-profile/content/copy";
import { focusAreas } from "@/lib/trade-profile/content/focus-areas";
import { traitName } from "@/lib/trade-profile/content/traits";
import type { FocusResult, Hit } from "@/lib/trade-profile/focus";
import { domainOf } from "@/lib/trade-profile/types";
import { traitColor } from "@/components/trade-profile/primitives";
import { useDerived } from "@/components/trade-profile/store";
import { useProfileNav } from "@/components/trade-profile/nav";

/** The trigger, shown rather than told: each facet's score against the line it crossed. */
function TriggerRow({ hit }: { hit: Hit }) {
  const color = traitColor[domainOf(hit.trait)];
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5">
      <span className="text-sm font-medium">{traitName(hit.trait)}</span>
      <span className="text-sm font-bold tabular-nums">
        {Math.round(hit.score)}
        <span className="ml-1 text-xs font-medium text-muted-foreground">
          {hit.op === ">=" ? "≥" : "≤"} {hit.threshold}
        </span>
      </span>
      <span className="relative col-span-2 h-1.5 rounded-full bg-muted/60">
        <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${hit.score}%`, background: color }} />
        <span className="absolute -inset-y-1 w-0.5 rounded-full bg-foreground/60" style={{ left: `${hit.threshold}%` }} aria-hidden />
      </span>
    </li>
  );
}

function AreaBody({ result }: { result: FocusResult }) {
  const a = focusAreas[result.id];
  const t = copy.focus;
  return (
    <>
      {result.hits.length > 0 ? (
        <>
          <p className="mt-4 text-xs font-medium text-muted-foreground">{t.because}</p>
          <ul className="mt-3 space-y-3.5">
            {result.hits.map((h) => (
              <TriggerRow key={h.trait} hit={h} />
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-4 text-sm text-foreground/85">{t.noTrigger}</p>
      )}
      <dl className="mt-5 grid gap-3 border-t border-border/50 pt-4 text-sm leading-relaxed sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold text-foreground/70">{t.pattern}</dt>
          <dd className="mt-0.5 text-foreground/85">{a.pattern}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-foreground/70">{t.problem}</dt>
          <dd className="mt-0.5 text-foreground/85">{a.tradingProblem}</dd>
        </div>
      </dl>
    </>
  );
}

/** Primary area as the main reading, the secondary beside it at a smaller voice. */
export function FocusView() {
  const { focus } = useDerived();
  const nav = useProfileNav();
  if (!focus) return null;
  const t = copy.focus;
  const p = focusAreas[focus.primary.id];
  const s = focus.secondary ? focusAreas[focus.secondary.id] : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
        <AccentPanel accent="primary" eyebrow={t.primary} className="sm:p-6 sm:pl-7">
          <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-[28px]">{p.title}</h2>
          <p className="mt-1.5 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">{p.summary}</p>
          <AreaBody result={focus.primary} />
        </AccentPanel>

        <div className="space-y-4">
          {s && focus.secondary && (
            <section className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
              <p className="text-xs font-medium text-ice">{t.secondary}</p>
              <h3 className="mt-1.5 font-heading text-lg font-bold tracking-tight">{s.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.summary}</p>
              <AreaBody result={focus.secondary} />
            </section>
          )}
          <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">{t.hypothesis}</p>
        </div>
      </div>

      <Button size="lg" onClick={() => nav.goTab("goal")}>
        {t.cta} <ArrowRight />
      </Button>
    </div>
  );
}
