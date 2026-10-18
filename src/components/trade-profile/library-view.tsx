"use client";

import { useState } from "react";
import { ChevronRight, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/trade-profile/content/copy";
import { exercises, techniqueNames } from "@/lib/trade-profile/content/exercises";
import { focusAreas } from "@/lib/trade-profile/content/focus-areas";
import { references } from "@/lib/trade-profile/content/references";
import { focusRules } from "@/lib/trade-profile/focus-rules";
import { DifficultyPill, Eyebrow, Segmented, StatusPill } from "@/components/trade-profile/primitives";
import { useTradeProfile } from "@/components/trade-profile/store";
import { useProfileNav } from "@/components/trade-profile/nav";

type Section = "exercises" | "evidence" | "data";

/** The exercise library, the evidence behind it, and the trader's own data. */
export function LibraryView() {
  const { state, demo, reset } = useTradeProfile();
  const nav = useProfileNav();
  const [section, setSection] = useState<Section>("exercises");
  const t = copy.library;

  function download() {
    const blob = new Blob([JSON.stringify({ app: "tradingmc-trade-profile", exportedAt: new Date().toISOString(), ...state }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `my-trade-profile-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-4">
      <Segmented
        label={copy.tabs.library}
        className="max-w-md"
        value={section}
        onChange={setSection}
        options={[
          { value: "exercises", label: t.sections.exercises },
          { value: "evidence", label: t.sections.evidence },
          { value: "data", label: t.sections.data },
        ]}
      />

      {section === "exercises" && (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">{t.exercisesLead}</p>
          {focusRules.map((r) => (
            <section key={r.id}>
              <Eyebrow className="mb-2">{focusAreas[r.id].title}</Eyebrow>
              <ul className="grid gap-2 sm:grid-cols-2">
                {exercises
                  .filter((e) => e.focusArea === r.id)
                  .sort((a, b) => a.difficulty - b.difficulty)
                  .map((e) => (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => nav.openExercise(e.id)}
                        className="press flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card p-3.5 text-left transition-colors hover:border-primary/40"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold">{e.title}</span>
                          <span className="block truncate text-[11px] text-muted-foreground">{techniqueNames[e.technique]}</span>
                        </span>
                        <DifficultyPill level={e.difficulty} />
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </button>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {section === "evidence" && (
        <div className="space-y-3">
          <p className="text-xs leading-relaxed text-muted-foreground">{t.referencesLead}</p>
          {references.map((r) => {
            const n = exercises.filter((e) => e.referenceIds.includes(r.id)).length;
            return (
              <article key={r.id} className="rounded-2xl border border-border/60 bg-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={r.status} />
                  {n > 0 && <span className="text-[11px] text-muted-foreground">{t.usedBy(n)}</span>}
                </div>
                <p className="mt-2.5 text-sm leading-relaxed">{r.citation}</p>
                {r.doi && <p className="mt-1 text-[11px] text-muted-foreground">doi: <span className="select-all">{r.doi}</span></p>}
                <p className="mt-2.5 text-xs leading-relaxed text-foreground/80">{r.claim}</p>
                {r.note && <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{r.note}</p>}
              </article>
            );
          })}
        </div>
      )}

      {section === "data" && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
            <Eyebrow>{t.dataTitle}</Eyebrow>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{demo ? copy.demo.banner : t.dataLead}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" onClick={download}>
                <Download /> {t.export}
              </Button>
              <Button variant="destructive" onClick={() => confirm(t.resetConfirm) && void reset().catch(() => {})}>
                <Trash2 /> {t.reset}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
