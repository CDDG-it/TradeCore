"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { copy } from "@/lib/trade-profile/content/copy";
import { exerciseById, techniqueNames } from "@/lib/trade-profile/content/exercises";
import { focusAreas } from "@/lib/trade-profile/content/focus-areas";
import { referenceById } from "@/lib/trade-profile/content/references";
import { traitName } from "@/lib/trade-profile/content/traits";
import type { FocusAreaId } from "@/lib/trade-profile/focus-rules";
import { DifficultyPill, Eyebrow, Pill, StatusPill } from "@/components/trade-profile/primitives";

/** Full detail of one exercise, including the evidence behind it and its status. */
export function ExerciseSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const ex = id ? exerciseById[id] : undefined;
  const t = copy.today;
  return (
    <Sheet open={!!ex} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {ex && (
          <>
            <SheetHeader>
              <div className="flex flex-wrap gap-1.5">
                <DifficultyPill level={ex.difficulty} />
                <Pill>{focusAreas[ex.focusArea as FocusAreaId]?.title}</Pill>
                {ex.target.trait && ex.target.direction && (
                  <Pill tone="ice">
                    {copy.goal.directions[ex.target.direction]} · {traitName(ex.target.trait)}
                  </Pill>
                )}
              </div>
              <SheetTitle className="mt-2 font-heading text-xl font-bold tracking-tight">{ex.title}</SheetTitle>
              <SheetDescription>{ex.goal}</SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-4 pb-8">
              <dl className="grid grid-cols-3 gap-3 text-xs">
                {(
                  [
                    [t.technique, techniqueNames[ex.technique]],
                    [t.frequency, ex.frequency],
                    [t.duration, ex.duration],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs font-semibold text-foreground/70">{k}</dt>
                    <dd className="mt-0.5 text-foreground/85">{v}</dd>
                  </div>
                ))}
              </dl>
              <section>
                <Eyebrow>{t.howTo}</Eyebrow>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">{ex.instructions}</p>
              </section>
              <section className="rounded-xl border border-ice/15 bg-ice/[0.06] p-3.5">
                <Eyebrow tone="ice">{t.tradingVersion}</Eyebrow>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{ex.tradingVersion}</p>
              </section>
              <section>
                <Eyebrow>{t.logging}</Eyebrow>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">{ex.logging}</p>
              </section>
              <section>
                <Eyebrow className="mb-2">{t.references}</Eyebrow>
                <ul className="space-y-3.5">
                  {ex.referenceIds.map((rid) => {
                    const r = referenceById[rid];
                    return (
                      <li key={rid} className="text-xs">
                        <StatusPill status={r.status} />
                        <p className="mt-1.5 leading-relaxed text-foreground/85">{r.claim}</p>
                        <p className="mt-1 leading-relaxed text-muted-foreground">{r.citation}</p>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
