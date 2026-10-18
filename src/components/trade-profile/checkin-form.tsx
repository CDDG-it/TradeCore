"use client";

import { useState } from "react";
import { Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/trade-profile/content/copy";
import { stateItemFor } from "@/lib/trade-profile/content/reflection";
import type { CheckinDone, GoalTarget } from "@/lib/trade-profile/types";
import { Pill, Segmented } from "@/components/trade-profile/primitives";
import { useTradeProfile } from "@/components/trade-profile/store";

/** The 30-second daily check-in: done, how hard, and one state rating of the goal trait. */
export function CheckinForm({ date, exerciseId, goal }: { date: string; exerciseId: string; goal: GoalTarget }) {
  const { state, saveCheckin } = useTradeProfile();
  const existing = state.checkins[date];
  const [editing, setEditing] = useState(!existing);
  const [done, setDone] = useState<CheckinDone | undefined>(existing?.done);
  const [difficulty, setDifficulty] = useState<number | undefined>(existing?.difficulty);
  const [rating, setRating] = useState<number | undefined>(existing?.state);
  const [saving, setSaving] = useState(false);
  const t = copy.checkin;
  const item = stateItemFor(goal.trait, goal.direction);

  if (existing && !editing) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-win/25 bg-win/[0.06] p-3.5">
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="mr-1 inline-flex items-center gap-1.5 font-semibold text-win">
            <Check className="size-4" /> {t.saved}
          </span>
          <Pill>{t.doneOptions[existing.done]}</Pill>
          <Pill>
            {t.hard} {existing.difficulty}/5
          </Pill>
          <Pill tone="ice">
            {t.state} {existing.state}/7
          </Pill>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
          <Pencil /> {t.edit}
        </Button>
      </div>
    );
  }

  const ready = done && difficulty && rating;
  async function save() {
    if (!ready) return;
    setSaving(true);
    try {
      await saveCheckin(date, { exerciseId, done: done!, difficulty: difficulty!, state: rating! });
      setEditing(false);
    } catch {
      // Error banner is shown by the page; keep the form open.
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-xs font-semibold text-foreground/85">{t.did}</p>
        <Segmented label={t.did} value={done} onChange={setDone} options={(["yes", "partly", "no"] as const).map((v) => ({ value: v, label: t.doneOptions[v] }))} />
      </div>
      <div>
        <p className="mb-1.5 text-xs font-semibold text-foreground/85">{t.hard}</p>
        <Segmented label={t.hard} value={difficulty} onChange={setDifficulty} options={[1, 2, 3, 4, 5].map((v) => ({ value: v, label: v }))} />
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>{t.hardLabels[0]}</span>
          <span>{t.hardLabels[1]}</span>
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-xs font-semibold text-foreground/85">{item.question}</p>
        <Segmented label={item.question} value={rating} onChange={setRating} options={[1, 2, 3, 4, 5, 6, 7].map((v) => ({ value: v, label: v }))} />
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>{item.low}</span>
          <span>{item.high}</span>
        </div>
      </div>
      <Button size="lg" className="w-full" disabled={!ready || saving} onClick={save}>
        {saving ? copy.common.saving : t.submit}
      </Button>
    </div>
  );
}
