"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, HeartHandshake } from "lucide-react";
import { AccentPanel } from "@/components/ui/accent-panel";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/trade-profile/content/copy";
import { domains, facets, type TraitText } from "@/lib/trade-profile/content/traits";
import { DOMAINS, type DomainCode, type FacetCode } from "@/lib/trade-profile/types";
import { DomainRadar } from "@/components/trade-profile/charts";
import { Eyebrow, ScaleBar, Score, Segmented, Tile, traitColor } from "@/components/trade-profile/primitives";
import { useDerived, useTradeProfile } from "@/components/trade-profile/store";
import { useProfileNav } from "@/components/trade-profile/nav";

export function SupportNote() {
  return (
    <div className="rounded-2xl border border-primary/25 bg-primary/[0.06] p-4 text-sm leading-relaxed text-foreground/85">
      <p className="mb-1 inline-flex items-center gap-2 font-semibold text-foreground">
        <HeartHandshake className="size-4 text-primary" /> {copy.results.supportTitle}
      </p>
      <p>{copy.results.support}</p>
    </div>
  );
}

/** The five domains, with a drill-down into each one's facets. */
export function ProfileView() {
  const { profile, supportNote } = useDerived();
  const { restartAssessment, demo } = useTradeProfile();
  const nav = useProfileNav();
  const [view, setView] = useState<"bars" | "radar">("bars");
  if (!profile) return null;
  const t = copy.results;

  return (
    <div className="space-y-4">
      {supportNote && <SupportNote />}

      <AccentPanel
        accent="cyan"
        eyebrow={t.eyebrow}
        title={t.title}
        subtitle={t.lead}
        headerRight={
          <Segmented
            label={t.title}
            className="w-36"
            value={view}
            onChange={setView}
            options={[
              { value: "bars", label: t.bars },
              { value: "radar", label: t.radar },
            ]}
          />
        }
      >
        <div className="mt-4">
          {view === "radar" ? (
            <DomainRadar profile={profile} />
          ) : (
            <ul className="-mx-2 space-y-0.5">
              {DOMAINS.map((d) => (
                <li key={d}>
                  <button type="button" onClick={() => nav.openDomain(d)} className="group block w-full rounded-xl px-2 py-3 text-left transition-colors hover:bg-muted/40">
                    <div className="mb-2 flex items-baseline justify-between gap-3">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold">
                        <span className="size-2 rounded-full" style={{ background: traitColor[d] }} />
                        {domains[d].name}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Score value={profile.domains[d]!} className="text-lg" />
                        <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                    <ScaleBar value={profile.domains[d]!} color={traitColor[d]} />
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{domains[d].about}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 flex justify-between px-0.5 text-[10px] text-muted-foreground">
            <span>0</span>
            <span>
              {copy.common.low} ≤ 35 · 65 ≤ {copy.common.high}
            </span>
            <span>100</span>
          </p>
        </div>
      </AccentPanel>

      <Tile>
        <Eyebrow>{t.measurementTitle}</Eyebrow>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t.scaleExplainer}</p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">
          {t.measurement.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </Tile>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button size="lg" onClick={() => nav.goTab("focus")}>
          {t.toFocus} <ChevronRight />
        </Button>
        {!demo && (
          <Button variant="ghost" size="sm" onClick={() => confirm(t.retakeConfirm) && restartAssessment()}>
            {t.retake}
          </Button>
        )}
      </div>
    </div>
  );
}

function Explainer({ text }: { text: TraitText }) {
  const t = copy.results;
  return (
    <dl className="mt-3 grid gap-3 text-xs leading-relaxed sm:grid-cols-2">
      <div>
        <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t.lowEnd}</dt>
        <dd className="mt-0.5 text-foreground/80">{text.low}</dd>
      </div>
      <div>
        <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t.highEnd}</dt>
        <dd className="mt-0.5 text-foreground/80">{text.high}</dd>
      </div>
      <div className="rounded-lg border border-ice/15 bg-ice/[0.06] p-3 sm:col-span-2">
        <dt className="text-[10px] font-semibold uppercase tracking-wider text-ice">{t.trading}</dt>
        <dd className="mt-0.5 text-foreground/85">{text.trading}</dd>
      </div>
    </dl>
  );
}

export function DomainDetail({ code }: { code: DomainCode }) {
  const { profile } = useDerived();
  const nav = useProfileNav();
  if (!profile) return null;
  const onBack = () => nav.back({ kind: "tab", tab: "profile" });
  const text = domains[code];
  const color = traitColor[code];
  return (
    <div className="space-y-3">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-3.5" /> {copy.results.title}
      </button>

      <AccentPanel accent="cyan" eyebrow={copy.common.positionOnScale} title={text.name} subtitle={text.about} headerRight={<Score value={profile.domains[code]!} className="text-3xl" />}>
        <div className="mt-4">
          <ScaleBar value={profile.domains[code]!} color={color} />
        </div>
        <Explainer text={text} />
      </AccentPanel>

      <Eyebrow className="pt-2">{copy.results.facets}</Eyebrow>
      <div className="grid gap-3 md:grid-cols-2">
        {([1, 2, 3, 4, 5, 6] as const).map((n) => {
          const f = `${code}${n}` as FacetCode;
          const ft = facets[f];
          return (
            <article key={f} className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <h3 className="font-heading text-sm font-bold tracking-tight">{ft.name}</h3>
                <Score value={profile.facets[f]!} />
              </div>
              <ScaleBar value={profile.facets[f]!} color={color} size="sm" />
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{ft.about}</p>
              <Explainer text={ft} />
            </article>
          );
        })}
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {copy.results.tradingNote} {copy.results.measurement[1]}
      </p>
    </div>
  );
}
