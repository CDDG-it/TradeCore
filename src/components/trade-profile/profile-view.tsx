"use client";

import { ArrowLeft, ArrowRight, ChevronRight, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/trade-profile/content/copy";
import { domains, facets } from "@/lib/trade-profile/content/traits";
import { DOMAINS, type DomainCode, type FacetCode } from "@/lib/trade-profile/types";
import { DomainRadar } from "@/components/trade-profile/charts";
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

/**
 * The five domains as a ranked reading list on the left, and their shape on
 * the right, so both views of the same profile sit side by side on desktop.
 */
export function ProfileView() {
  const { profile, supportNote } = useDerived();
  const { restartAssessment, demo } = useTradeProfile();
  const nav = useProfileNav();
  if (!profile) return null;
  const t = copy.results;

  return (
    <div className="space-y-4">
      {supportNote && <SupportNote />}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
        <section className="rounded-2xl border border-border/60 bg-card p-4 sm:p-6">
          <h2 className="font-heading text-xl font-bold tracking-tight">{t.title}</h2>
          <p className="mt-1 max-w-[60ch] text-sm text-muted-foreground">{t.lead}</p>

          <ul className="-mx-2 mt-4 space-y-0.5">
            {DOMAINS.map((d) => (
              <li key={d}>
                <button type="button" onClick={() => nav.openDomain(d)} className="group block w-full rounded-xl px-2 py-3 text-left transition-colors hover:bg-muted/30">
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <span className="text-[15px] font-semibold tracking-tight">{domains[d].name}</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Score value={profile.domains[d]!} className="text-xl" />
                      <ChevronRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                  <ScaleBar value={profile.domains[d]!} color={traitColor[d]} />
                  <p className="mt-2 max-w-[62ch] text-xs leading-relaxed text-muted-foreground">{domains[d].about}</p>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 px-0.5 text-[11px] text-muted-foreground">
            {copy.common.positionOnScale}. {copy.common.low} 35 or below, {copy.common.high.toLowerCase()} 65 or above.
          </p>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
            <h3 className="font-heading text-sm font-bold tracking-tight">{t.radar}</h3>
            <DomainRadar profile={profile} />
          </div>
          <div className="rounded-2xl border border-border/50 bg-background/30 p-4 text-xs leading-relaxed text-muted-foreground">
            <p className="font-semibold text-foreground/85">{t.measurementTitle}</p>
            <p className="mt-1.5">{t.scaleExplainer}</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              {t.measurement.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button size="lg" onClick={() => nav.goTab("focus")}>
          {t.toFocus} <ArrowRight />
        </Button>
        {!demo && (
          <button type="button" onClick={() => confirm(t.retakeConfirm) && restartAssessment()} className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
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
