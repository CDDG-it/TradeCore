"use client";

import { useEffect, useState } from "react";
import { clearDraft, loadDraft, writeDraft } from "@/lib/drafts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/trade-profile/content/copy";
import { focusAreas } from "@/lib/trade-profile/content/focus-areas";
import { domains, facets, traitName } from "@/lib/trade-profile/content/traits";
import { suggestedGoalFor } from "@/lib/trade-profile/focus";
import type { FocusAreaId } from "@/lib/trade-profile/focus-rules";
import { traitScore } from "@/lib/trade-profile/scoring";
import { DOMAINS, type Direction, type FacetCode, type TraitCode } from "@/lib/trade-profile/types";
import { ScaleBar, Score, Segmented } from "@/components/trade-profile/primitives";
import { useDerived, useTradeProfile } from "@/components/trade-profile/store";
import { useProfileNav } from "@/components/trade-profile/nav";

const GOAL_DRAFT = "trade-profile:goal";
type GoalDraft = { trait: TraitCode | ""; direction: Direction; outcome: string; ifCue: string; thenAction: string };

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

type Choice = { key: string; trait: TraitCode; direction: Direction; area: FocusAreaId; label: string; why: string };

export function GoalView() {
  const { state, saveGoal, demo } = useTradeProfile();
  const { profile, focus } = useDerived();
  const nav = useProfileNav();
  const t = copy.goal;
  const existing = state.goal;

  // The goals the profile points to: the primary area's, then the secondary's.
  const choices: Choice[] = [];
  for (const r of [focus?.primary, focus?.secondary]) {
    const g = r && suggestedGoalFor(r.id);
    if (!r || !g || choices.some((c) => c.trait === g.trait && c.direction === g.direction)) continue;
    choices.push({ key: r.id, trait: g.trait, direction: g.direction, area: r.id, label: `${t.directions[g.direction]} ${traitName(g.trait)}`, why: focusAreas[r.id].goalRationale });
  }
  const matching = (tr: TraitCode | "", dir: Direction) => choices.find((c) => c.trait === tr && c.direction === dir);

  // Unsaved goal text is kept as a local draft, so switching sections and coming back keeps it.
  const draft = demo ? null : (loadDraft<GoalDraft>(GOAL_DRAFT)?.data ?? null);
  const first = choices[0];
  const [trait, setTrait] = useState<TraitCode | "">(draft?.trait ?? existing?.trait ?? first?.trait ?? "");
  const [direction, setDirection] = useState<Direction>(draft?.direction ?? existing?.direction ?? first?.direction ?? "increase");
  const [custom, setCustom] = useState(() => !!trait && !matching(trait, direction));
  const [outcome, setOutcome] = useState(draft?.outcome ?? existing?.outcome ?? "");
  const [ifCue, setIfCue] = useState(draft?.ifCue ?? existing?.ifCue ?? "");
  const [thenAction, setThenAction] = useState(draft?.thenAction ?? existing?.thenAction ?? "");
  useEffect(() => {
    if (demo || !(outcome || ifCue || thenAction)) return;
    writeDraft<GoalDraft>(GOAL_DRAFT, { trait, direction, outcome, ifCue, thenAction });
  }, [demo, trait, direction, outcome, ifCue, thenAction]);
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!profile || !focus) return null;
  const valid = !!trait && !!outcome.trim() && !!ifCue.trim() && !!thenAction.trim();

  async function save() {
    setTried(true);
    if (!valid) return;
    setSaving(true);
    try {
      const tr = trait as TraitCode;
      // The focus area weights which exercises the program picks.
      const area = matching(tr, direction)?.area ?? (focus!.primary.id === "maintain" ? "maintain" : null);
      await saveGoal({ trait: tr, direction, area, outcome, obstacle: existing?.obstacle ?? "", ifCue, thenAction });
      clearDraft(GOAL_DRAFT);
      nav.goTab("today");
    } catch {
      // The store shows the save error banner; stay on the form.
    } finally {
      setSaving(false);
    }
  }

  function pick(c: Choice) {
    setCustom(false);
    setTrait(c.trait);
    setDirection(c.direction);
  }

  function pickTrait(v: TraitCode) {
    setTrait(v);
    if (v === "E5") setDirection("channel");
    else if (direction === "channel") setDirection("increase");
  }

  const current = trait ? traitScore(profile, trait) : undefined;
  const showPicker = custom || choices.length === 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
      {/* ── What to train ───────────────────────────────────── */}
      <section className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
        <h2 className="font-heading text-xl font-bold tracking-tight">{t.title}</h2>
        <p className="mt-1 max-w-[60ch] text-xs leading-relaxed text-muted-foreground">{t.lead}</p>

        <div role="radiogroup" aria-label={t.title} className="mt-4 space-y-2">
          {choices.map((c, i) => {
            const on = !custom && trait === c.trait && direction === c.direction;
            return (
              <button
                key={c.key}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => pick(c)}
                className={cn(
                  "press block w-full rounded-xl border p-3.5 text-left transition-colors",
                  on ? "border-primary/50 bg-primary/[0.07]" : "border-border/60 hover:border-primary/30",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{c.label}</span>
                  {i === 0 && <span className="text-[11px] font-medium text-primary">{t.recommended}</span>}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{c.why}</span>
              </button>
            );
          })}
          {choices.length > 0 && (
            <button
              type="button"
              role="radio"
              aria-checked={custom}
              onClick={() => setCustom(true)}
              className={cn(
                "press block w-full rounded-xl border p-3.5 text-left text-sm font-semibold transition-colors",
                custom ? "border-primary/50 bg-primary/[0.07]" : "border-border/60 text-foreground/75 hover:border-primary/30",
              )}
            >
              {t.other}
            </button>
          )}
          {choices.length === 0 && <p className="text-sm leading-relaxed text-foreground/85">{focusAreas.maintain.goalRationale}</p>}
        </div>

        {showPicker && (
          <div className="mt-4 space-y-4">
            <select
              aria-label={t.traitLabel}
              value={trait}
              onChange={(e) => pickTrait(e.target.value as TraitCode)}
              className="h-11 w-full rounded-xl border border-input bg-background/40 px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
            {trait && (
              <Segmented
                label={t.directionLabel}
                value={direction}
                onChange={setDirection}
                options={directionsFor(trait).map((d) => ({ value: d, label: d === "channel" ? t.channelShort : t.directions[d] }))}
              />
            )}
          </div>
        )}

        {current !== undefined && (
          <div className="mt-4 border-t border-border/50 pt-3.5">
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="text-muted-foreground">
                {t.current}: {traitName(trait as TraitCode)}
              </span>
              <Score value={current} />
            </div>
            <ScaleBar value={current} size="sm" />
          </div>
        )}
      </section>

      {/* ── How it will happen ──────────────────────────────── */}
      <section className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 sm:p-6">
        <h3 className="font-heading text-lg font-bold tracking-tight">{t.woopTitle}</h3>
        <p className="mt-1 max-w-[60ch] text-xs leading-relaxed text-muted-foreground">{t.woopLead}</p>
        <div className="mt-4 space-y-4">
          <Field label={t.outcome} hint={t.outcomeHint} value={outcome} onChange={setOutcome} />
          <fieldset className="space-y-3 rounded-xl border border-primary/20 bg-primary/[0.03] p-3.5">
            <legend className="px-1 text-xs font-semibold text-primary">{t.plan}</legend>
            <Field label={t.ifLabel} hint={t.ifHint} value={ifCue} onChange={setIfCue} />
            <Field label={t.thenLabel} hint={t.thenHint} value={thenAction} onChange={setThenAction} />
          </fieldset>
        </div>

        <div className="mt-5 space-y-2 border-t border-border/50 pt-4">
          {existing && <p className="text-xs text-muted-foreground">{t.restartWarning}</p>}
          {tried && !valid && <p className="text-xs text-loss">{t.required}</p>}
          <Button size="lg" className="w-full" onClick={save} disabled={saving}>
            {saving ? copy.common.saving : existing ? t.update : t.start}
          </Button>
        </div>
      </section>
    </div>
  );
}
