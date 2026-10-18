"use client";

import { useEffect, useState } from "react";
import { clearDraft, loadDraft, writeDraft } from "@/lib/drafts";
import { ChevronLeft } from "lucide-react";
import { AccentPanel } from "@/components/ui/accent-panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { copy } from "@/lib/trade-profile/content/copy";
import { weeklyQuestions } from "@/lib/trade-profile/content/reflection";
import { useTradeProfile } from "@/components/trade-profile/store";
import { useProfileNav } from "@/components/trade-profile/nav";

export function ReflectionView({ week }: { week: number }) {
  const { state, saveReflection, demo } = useTradeProfile();
  const nav = useProfileNav();
  const draftKey = `trade-profile:reflection:${week}`;
  const [answers, setAnswers] = useState<string[]>(
    () => (!demo && loadDraft<string[]>(draftKey)?.data) || state.reflections[week]?.answers || weeklyQuestions.map(() => ""),
  );
  useEffect(() => {
    if (!demo && answers.some((a) => a.trim())) writeDraft(draftKey, answers);
  }, [demo, answers, draftKey]);
  const [saving, setSaving] = useState(false);
  const t = copy.reflection;

  async function save() {
    setSaving(true);
    try {
      await saveReflection(week, answers);
      clearDraft(draftKey);
      nav.back();
    } catch {
      // Banner shows the error; keep the answers on screen.
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => nav.back()} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-3.5" /> {copy.common.back}
      </button>
      <AccentPanel accent="primary" title={t.title(week)} subtitle={t.lead}>
        <div className="mt-4 space-y-4">
          {weeklyQuestions.map((q, i) => (
            <label key={q} className="block">
              <span className="mb-1.5 block text-xs font-semibold text-foreground/85">{q}</span>
              <Textarea
                rows={3}
                value={answers[i] ?? ""}
                onChange={(e) => setAnswers(answers.map((a, j) => (j === i ? e.target.value : a)))}
                className="rounded-xl bg-background/40"
              />
            </label>
          ))}
        </div>
      </AccentPanel>
      <Button size="lg" disabled={saving || answers.every((a) => !a.trim())} onClick={save}>
        {saving ? copy.common.saving : t.submit}
      </Button>
    </div>
  );
}
