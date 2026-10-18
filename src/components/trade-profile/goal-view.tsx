"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AccentPanel } from "@/components/ui/accent-panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { copy } from "@/lib/trade-profile/content/copy";
import { focusAreas } from "@/lib/trade-profile/content/focus-areas";
import { domains, facets, traitName } from "@/lib/trade-profile/content/traits";
import { suggestedGoalFor } from "@/lib/trade-profile/focus";
import type { FocusAreaId } from "@/lib/trade-profile/focus-rules";
import { traitScore } from "@/lib/trade-profile/scoring";
import { DOMAINS, type Direction, type FacetCode, type TraitCode } from "@/lib/trade-profile/types";
import { Eyebrow, ScaleBar, Score, Segmented, Tile } from "@/components/trade-profile/primitives";
import { useDerived, useTradeProfile } from "@/components/trade-profile/store";
import { useProfileNav } from "@/components/trade-profile/nav";

/** Excitement-Seeking can be channelled rather than raised or lowered. */
const directionsFor = (trait: TraitCode): Direction[] => (trait === "E5" ? ["channel", "decrease", "increase"] : ["increase", "decrease"]);

function Field({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-foreground/85">{label}</span>
      <Textarea value={value} placeholder={hint} onChange={(e) => onChange(e.target.value)} className="min-h-16 rounded-xl bg-background/40" />
    </label>
  );
}

export function GoalView() {
  const { state, saveGoal } = useTradeProfile();
  const { profile, focus } = useDerived();
  const nav = useProfileNav();
  const t = copy.goal;

  const primary = focus?.primary;
  const recommended = primary ? suggestedGoalFor(primary.id) : null;
  const existing = state.goal;

  const [trait, setTrait] = useState<TraitCode | "">(existing?.trait ?? recommended?.trait ?? "");
  const [direction, setDirection] = useState<Direction>(existing?.direction ?? recommended?.direction ?? "increase");
  const [outcome, setOutcome] = useState(existing?.outcome ?? "");
  const [obstacle, setObstacle] = useState(existing?.obstacle ?? "");
  const [ifCue, setIfCue] = useState(existing?.ifCue ?? "");
  const [thenAction, setThenAction] = useState(existing?.thenAction ?? "");
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!profile || !focus) return null;
  const valid = !!trait && !!outcome.trim() && !!obstacle.trim() && !!ifCue.trim() && !!thenAction.trim();

  /** The focus area this goal belongs to; it weights which exercises the program picks. */
  function areaFor(tr: TraitCode, dir: Direction): FocusAreaId | null {
    for (const r of [focus!.primary, focus!.secondary]) {
      const g = r && suggestedGoalFor(r.id);
      if (g && g.trait === tr && g.direction === dir) return r!.id;
    }
    return focus!.primary.id === "maintain" ? "maintain" : null;
  }

  async function save() {
    setTried(true);
    if (!valid) return;
    setSaving(true);
    try {
      const tr = trait as TraitCode;
      await saveGoal({ trait: tr, direction, area: areaFor(tr, direction), outcome, obstacle, ifCue, thenAction });
      nav.goTab("today");
    } catch {
      // The store shows the save error banner; stay on the form.
    } finally {
      setSaving(false);
    }
  }

  function pickTrait(v: TraitCode) {
    setTrait(v);
    if (v === "E5") setDirection("channel");
    else if (direction === "channel") setDirection("increase");
  }

  const current = trait ? traitScore(profile, trait) : undefined;
  const isRecommended = recommended && trait === recommended.trait && direction === recommended.direction;

  return (
    <div className="space-y-4">
      <div>
        <Eyebrow tone="primary">{t.eyebrow}</Eyebrow>
        <h2 className="mt-1.5 font-heading text-xl font-bold tracking-tight">{t.title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t.lead}</p>
      </div>

      <AccentPanel accent="primary" eyebrow={t.recommended}>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {recommended ? (
              <>
                <p className="inline-flex items-center gap-2 font-heading text-lg font-bold tracking-tight">
                  <Sparkles className="size-4 text-primary" />
                  {t.directions[recommended.direction]} · {traitName(recommended.trait)}
                </p>
                <p className="mt-1 max-w-prose text-xs leading-relaxed text-muted-foreground">{focusAreas[primary!.id].goalRationale}</p>
              </>
            ) : (
              <p className="max-w-prose text-xs leading-relaxed text-muted-foreground">{focusAreas.maintain.goalRationale}</p>
            )}
            <p className="mt-2 text-[11px] text-muted-foreground">{t.recommendedNote}</p>
          </div>
          {recommended && !isRecommended && (
            <Button variant="outline" onClick={() => {
                setTrait(recommended.trait);
                setDirection(recommended.direction);
              }}>
              {t.useSuggestion}
            </Button>
          )}
        </div>
      </AccentPanel>

      <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-foreground/85">{t.traitLabel}</span>
          <select
            value={trait}
            onChange={(e) => pickTrait(e.target.value as TraitCode)}
            className="h-11 w-full rounded-xl border border-input bg-background/40 px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="" disabled>
              {t.pickTrait}
            </option>
            {DOMAINS.map((d) => (
              <optgroup key={d} label={domains[d].name}>
                <option value={d}>
                  {domains[d].name} {t.wholeTrait}
                </option>
                {([1, 2, 3, 4, 5, 6] as const).map((n) => {
                  const f = `${d}${n}` as FacetCode;
                  return (
                    <option key={f} value={f}>
                      {facets[f].name}
                    </option>
                  );
                })}
              </optgroup>
            ))}
          </select>
        </label>

        {trait && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 sm:items-end">
            <div>
              <span className="mb-1.5 block text-xs font-semibold text-foreground/85">{t.directionLabel}</span>
              <Segmented label={t.directionLabel} value={direction} onChange={setDirection} options={directionsFor(trait).map((d) => ({ value: d, label: d === "channel" ? t.channelShort : t.directions[d] }))} />
            </div>
            {current !== undefined && (
              <Tile className="!p-3">
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-muted-foreground">{t.current}</span>
                  <Score value={current} />
                </div>
                <ScaleBar value={current} size="sm" />
              </Tile>
            )}
          </div>
        )}
        {direction === "channel" && <p className="mt-2 text-xs text-muted-foreground">{t.directions.channel}.</p>}
      </div>

      <AccentPanel accent="cyan" eyebrow={t.woopTitle} subtitle={t.woopLead}>
        <div className="mt-4 space-y-3.5">
          <Field label={t.outcome} hint={t.outcomeHint} value={outcome} onChange={setOutcome} />
          <Field label={t.obstacle} hint={t.obstacleHint} value={obstacle} onChange={setObstacle} />
          <div className="rounded-xl border border-border/50 p-3.5">
            <Eyebrow className="mb-3">{t.plan}</Eyebrow>
            <div className="space-y-3">
              <Field label={t.ifLabel} hint={t.ifHint} value={ifCue} onChange={setIfCue} />
              <Field label={t.thenLabel} hint={t.thenHint} value={thenAction} onChange={setThenAction} />
            </div>
          </div>
        </div>
      </AccentPanel>

      {existing && <p className="text-xs text-muted-foreground">{t.restartWarning}</p>}
      {tried && !valid && <p className="text-xs text-loss">{t.required}</p>}
      <Button size="lg" className="w-full sm:w-auto" onClick={save} disabled={saving}>
        {saving ? copy.common.saving : existing ? t.update : t.start}
      </Button>
    </div>
  );
}
