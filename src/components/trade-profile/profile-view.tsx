"use client";

import { ArrowLeft, ArrowRight, ChevronRight, HeartHandshake } from "lucide-react";
import { AccentPanel } from "@/components/ui/accent-panel";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/trade-profile/content/copy";
import { focusAreas } from "@/lib/trade-profile/content/focus-areas";
import { domains, facets, traitName } from "@/lib/trade-profile/content/traits";
import type { Hit } from "@/lib/trade-profile/focus";
import { DOMAINS, domainOf, type DomainCode, type FacetCode } from "@/lib/trade-profile/types";
import { ScaleBar, Score, traitColor } from "@/components/trade-profile/primitives";
import { useDerived, useTradeProfile } from "@/components/trade-profile/store";
import { useProfileNav } from "@/components/trade-profile/nav";

export function SupportNote() {
  return (
    <div className="flex gap-3 rounded-2xl border border-primary/25 bg-primary/[0.05] p-4 text-sm leading-relaxed text-foreground/85">
      <HeartHandshake className="mt-0.5 size-4 shrink-0 text-primary" />
      <p>
        <span className="font-semibold text-foreground">{copy.results.supportTitle}. </span>
        {copy.results.support}
      </p>
    </div>
  );
}

/** The trigger, shown rather than told: each facet's score against the line it crossed. */
function TriggerRow({ hit }: { hit: Hit }) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
      <span className="text-sm font-medium">{traitName(hit.trait)}</span>
      <span className="text-sm font-bold tabular-nums">
        {Math.round(hit.score)}
        <span className="ml-1 text-xs font-medium text-muted-foreground">
          {hit.op === ">=" ? "≥" : "≤"} {hit.threshold}
        </span>
      </span>
      <span className="relative col-span-2 h-1.5 rounded-full bg-muted/60">
        <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${hit.score}%`, background: traitColor[domainOf(hit.trait)] }} />
        <span className="absolute -inset-y-1 w-0.5 rounded-full bg-foreground/60" style={{ left: `${hit.threshold}%` }} aria-hidden />
      </span>
    </li>
  );
}

/**
 * One screen for the result: where the profile points (the focus area and the
 * facets that put it there) beside the five traits, with the next step under
 * the focus. Facets, evidence and data sit one click away.
 */
export function ProfileView() {
  const { state, restartAssessment, demo } = useTradeProfile();
  const { profile, focus, supportNote } = useDerived();
  const nav = useProfileNav();
  if (!profile || !focus) return null;
  const t = copy.results;
  const f = copy.focus;
  const area = focusAreas[focus.primary.id];
  const also = focus.secondary ? focusAreas[focus.secondary.id] : null;

  return (
    <div className="space-y-4">
      {supportNote && <SupportNote />}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
        <AccentPanel accent="primary" className="sm:p-6 sm:pl-7">
          <p className="text-xs font-medium text-muted-foreground">{f.primary}</p>
          <h2 className="mt-1.5 font-heading text-2xl font-bold tracking-tight">{area.title}</h2>
          <p className="mt-1 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">{area.tradingProblem}</p>
          {focus.primary.hits.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {focus.primary.hits.map((h) => (
                <TriggerRow key={h.trait} hit={h} />
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-foreground/85">{f.noTrigger}</p>
          )}
          {also && (
            <p className="mt-4 border-t border-border/50 pt-3 text-xs text-muted-foreground">
              {f.secondary}: <span className="font-semibold text-foreground/85">{also.title}</span>
            </p>
          )}
          <Button className="mt-5" onClick={() => nav.goTab(state.goal ? "today" : "goal")}>
            {state.goal ? f.toToday : f.cta} <ArrowRight />
          </Button>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{f.hypothesis}</p>
        </AccentPanel>

        <section className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-heading text-sm font-bold tracking-tight">{t.title}</h3>
            <span className="text-[11px] text-muted-foreground">{t.lead}</span>
          </div>
          <ul className="-mx-2 mt-2">
            {DOMAINS.map((d) => (
              <li key={d}>
                <button type="button" onClick={() => nav.openDomain(d)} className="group block w-full rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-muted/30">
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <span className="text-sm font-semibold tracking-tight">{domains[d].name}</span>
                    <span className="inline-flex items-center gap-1">
                      <Score value={profile.domains[d]!} className="text-base" />
                      <ChevronRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                  <ScaleBar value={profile.domains[d]!} color={traitColor[d]} size="sm" />
                </button>
              </li>
            ))}
          </ul>
          <details className="group mt-2 border-t border-border/50 pt-3 text-xs leading-relaxed text-muted-foreground">
            <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-foreground/75 hover:text-foreground">
              {t.measurementTitle}
              <ChevronRight className="size-3.5 transition-transform duration-200 group-open:rotate-90" />
            </summary>
            <p className="mt-2">{t.scaleExplainer}</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              {t.measurement.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </details>
        </section>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 px-1 text-xs font-medium text-muted-foreground">
        <button type="button" onClick={() => nav.goTab("library")} className="underline-offset-4 hover:text-foreground hover:underline">
          {t.evidenceLink}
        </button>
        {!demo && (
          <button type="button" onClick={() => confirm(t.retakeConfirm) && restartAssessment()} className="underline-offset-4 hover:text-foreground hover:underline">
            {t.retake}
          </button>
        )}
      </div>
    </div>
  );
}

/** One domain: its score and range on top, then its six facets as a two-column reading list. */
export function DomainDetail({ code }: { code: DomainCode }) {
  const { profile } = useDerived();
  const nav = useProfileNav();
  if (!profile) return null;
  const text = domains[code];
  const color = traitColor[code];
  const t = copy.results;

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => nav.back({ kind: "tab", tab: "profile" })} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> {t.title}
      </button>

      <section className="grid gap-5 rounded-2xl border border-border/60 bg-card p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-heading text-2xl font-bold tracking-tight">{text.name}</h2>
            <Score value={profile.domains[code]!} className="font-heading text-4xl tracking-tight" />
          </div>
          <div className="mt-3">
            <ScaleBar value={profile.domains[code]!} color={color} />
          </div>
          <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">{text.about}</p>
        </div>
        <dl className="grid gap-3 text-sm leading-relaxed sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold text-foreground/70">{t.lowEnd}</dt>
            <dd className="mt-0.5 text-foreground/85">{text.low}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-foreground/70">{t.highEnd}</dt>
            <dd className="mt-0.5 text-foreground/85">{text.high}</dd>
          </div>
          <div className="rounded-xl border border-ice/15 bg-ice/[0.05] p-3.5 sm:col-span-2">
            <dt className="text-xs font-semibold text-ice">{t.trading}</dt>
            <dd className="mt-0.5 text-foreground/90">{text.trading}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-4 sm:p-6">
        <h3 className="font-heading text-sm font-bold tracking-tight">{t.facets}</h3>
        <div className="mt-4 grid gap-x-8 gap-y-6 md:grid-cols-2">
          {([1, 2, 3, 4, 5, 6] as const).map((n) => {
            const f = `${code}${n}` as FacetCode;
            const ft = facets[f];
            return (
              <article key={f}>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <h4 className="text-[15px] font-semibold tracking-tight">{ft.name}</h4>
                  <Score value={profile.facets[f]!} className="text-lg" />
                </div>
                <ScaleBar value={profile.facets[f]!} color={color} size="sm" />
                <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{ft.about}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-foreground/85">
                  <span className="font-semibold text-ice">{t.trading}. </span>
                  {ft.trading}
                </p>
              </article>
            );
          })}
        </div>
        <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground">
          {t.tradingNote} {t.measurement[1]}
        </p>
      </section>
    </div>
  );
}
