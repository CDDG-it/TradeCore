"use client";

import { useEffect, useMemo, useState } from "react";
import { clearDraft, loadDraft, writeDraft } from "@/lib/drafts";
import { toAnswers } from "@/lib/trade-profile/rows";
import { ChevronLeft } from "lucide-react";
import { AccentPanel } from "@/components/ui/accent-panel";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/trade-profile/content/copy";
import { traitName } from "@/lib/trade-profile/content/traits";
import { items } from "@/lib/trade-profile/items";
import { dueRetests } from "@/lib/trade-profile/program";
import { retestDiff } from "@/lib/trade-profile/progress";
import { scoreProfile } from "@/lib/trade-profile/scoring";
import { domainOf, type Answers } from "@/lib/trade-profile/types";
import { AssessmentView } from "@/components/trade-profile/assessment";
import { BeforeAfter } from "@/components/trade-profile/charts";
import { Tile } from "@/components/trade-profile/primitives";
import { useDerived, useTradeProfile } from "@/components/trade-profile/store";
import { useProfileNav } from "@/components/trade-profile/nav";

/** Week 6 / 12: the goal domain's 24 items, then before vs. after. */
export function RetestView({ week }: { week: number }) {
  const { state, todayKey, saveRetest, demo } = useTradeProfile();
  const { profile, goalTarget } = useDerived();
  const nav = useProfileNav();
  // Retest answers are kept as a local draft until the retest is finished, so
  // leaving and coming back (or a reload) never loses them.
  const draftKey = `trade-profile:retest:${week}`;
  const [draft, setDraft] = useState<Answers>(() => (demo ? {} : toAnswers(loadDraft<Record<string, number>>(draftKey)?.data)));
  useEffect(() => {
    if (!demo && Object.keys(draft).length) writeDraft(draftKey, draft);
  }, [demo, draft, draftKey]);
  const domain = goalTarget ? domainOf(goalTarget.trait) : undefined;
  const list = useMemo(() => items.filter((i) => i.domain === domain), [domain]);
  const t = copy.retest;

  if (!profile || !domain || !state.programStart) return null;
  const taken = state.retests.find((r) => r.week === week);

  if (!taken) {
    if (!dueRetests(state.programStart, todayKey, state.retests.map((r) => r.week)).includes(week)) {
      return (
        <Tile>
          <p className="text-sm text-foreground/85">{t.notDue}</p>
          <Button variant="outline" className="mt-3" onClick={() => nav.back()}>
            {copy.common.back}
          </Button>
        </Tile>
      );
    }
    return (
      <AssessmentView
        items={list}
        answers={draft}
        onAnswer={(id, a) => setDraft((d) => ({ ...d, [id]: a }))}
        onFill={setDraft}
        onFinish={() =>
          void saveRetest(week, draft)
            .then(() => clearDraft(draftKey))
            .catch(() => {})
        }
        title={copy.assessment.retestTitle(week, traitName(domain))}
        instructions={copy.assessment.retestInstructions}
        finishLabel={copy.assessment.retestFinish}
        view={{ kind: "retest", week }}
        backTo={{ kind: "tab", tab: "today" }}
      />
    );
  }

  const rows = retestDiff(profile, scoreProfile(items, taken.answers), domain);
  const earlier = state.retests.find((r) => r.week < week);
  const earlierRow = earlier ? retestDiff(profile, scoreProfile(items, earlier.answers), domain)[0] : undefined;

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => nav.back()} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-3.5" /> {copy.common.back}
      </button>
      <AccentPanel accent="cyan" eyebrow={copy.common.positionOnScale} title={`${t.title(week)}: ${traitName(domain)}`}>
        <div className="mt-4">
          <BeforeAfter rows={rows} afterLabel={t.after(week)} />
          {earlierRow && earlier && (
            <p className="mt-4 border-t border-border/50 pt-3 text-xs text-muted-foreground">
              {t.after(earlier.week)}: {traitName(domain)} {Math.round(earlierRow.after)}
            </p>
          )}
        </div>
      </AccentPanel>
      <Tile>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t.caveatTitle}</p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">
          {t.caveat.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </Tile>
      <Button size="lg" onClick={() => nav.goTab("today")}>
        {t.toToday}
      </Button>
    </div>
  );
}
