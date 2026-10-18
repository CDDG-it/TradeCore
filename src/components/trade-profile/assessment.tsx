"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { thresholds } from "@/lib/trade-profile/config";
import { copy } from "@/lib/trade-profile/content/copy";
import { items as allItems } from "@/lib/trade-profile/items";
import type { Answer, Answers, Item } from "@/lib/trade-profile/types";
import { useTradeProfile } from "@/components/trade-profile/store";
import { ProgressLine } from "@/components/trade-profile/primitives";
import { currentEntry, pushEntry, useProfileNav, type ProfileView } from "@/components/trade-profile/nav";

const SHOW_FILL = process.env.NODE_ENV !== "production";

/**
 * The paged Likert questionnaire. Without props it is the full test, saved as
 * the trader goes; with props it runs a one-domain retest on local answers.
 */
export function AssessmentView(props: {
  items?: Item[];
  answers?: Answers;
  onAnswer?: (id: number, a: Answer) => void;
  onFill?: (answers: Answers) => void;
  onFinish?: () => void;
  title?: string;
  instructions?: string;
  finishLabel?: string;
  /** The view this questionnaire is shown in; page turns are history entries of it. */
  view?: ProfileView;
  /** Where "Back" on the first page goes when there is no earlier entry. */
  backTo?: ProfileView;
}) {
  const store = useTradeProfile();
  const nav = useProfileNav();
  const view: ProfileView = props.view ?? { kind: "assessment" };
  const list = props.items ?? allItems;
  const answers = props.answers ?? store.state.answers;
  const pages = Math.ceil(list.length / thresholds.pageSize);
  const [localPage, setLocalPage] = useState(0);
  const page = props.items ? localPage : Math.min(store.state.page, pages - 1);
  const t = copy.assessment;

  const showPage = (p: number) => {
    if (props.items) setLocalPage(p);
    else store.setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  /** A page turn forward is a history entry, so the browser back button returns to the last page. */
  const setPage = (p: number) => {
    showPage(p);
    pushEntry({ view, page: p });
  };
  /** Back one page: through history when the page was an entry, otherwise in place. */
  const goBack = () => {
    if (page === 0) return nav.back(props.backTo ?? { kind: "intro" });
    if (currentEntry()?.page === page) window.history.back();
    else {
      showPage(page - 1);
      pushEntry({ view, page: page - 1 }, undefined, true);
    }
  };

  // Browser back/forward between pages: the entry carries the page to show.
  const viewKey = JSON.stringify(view);
  useEffect(() => {
    const onPop = () => {
      const e = currentEntry();
      if (!e || JSON.stringify(e.view) !== viewKey) return;
      const p = e.page ?? 0;
      if (props.items) setLocalPage(p);
      else store.setPage(p);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [viewKey, props.items, store]);

  const answer = (id: number, a: Answer) => (props.onAnswer ? props.onAnswer(id, a) : store.answer(id, a));

  const slice = list.slice(page * thresholds.pageSize, (page + 1) * thresholds.pageSize);
  const done = useMemo(() => list.filter((i) => answers[i.id] !== undefined).length, [list, answers]);
  const pageDone = slice.every((i) => answers[i.id] !== undefined);
  const last = page === pages - 1;

  function finish() {
    if (props.onFinish) props.onFinish();
    else store.completeAssessment();
    window.scrollTo({ top: 0 });
  }

  function fillRandom() {
    const filled: Answers = { ...answers };
    for (const i of list) filled[i.id] ??= (1 + Math.floor(Math.random() * 5)) as Answer;
    if (props.onFill) props.onFill(filled);
    else store.fillAnswers(filled);
    setPage(pages - 1);
  }

  return (
    <div>
      <div className="sticky top-14 z-20 -mx-3 mb-5 border-b border-border/40 bg-background/85 px-3 pb-3 pt-2 backdrop-blur-md sm:-mx-1 sm:px-1 lg:top-16">
        <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="font-semibold uppercase tracking-wider">{t.page(page + 1, pages)}</span>
          <span className="tabular-nums">{t.progress(done, list.length)}</span>
        </div>
        <ProgressLine value={done / list.length} />
      </div>

      {page === 0 && (
        <header className="mb-5">
          <h2 className="font-heading text-xl font-bold tracking-tight">{props.title ?? t.title}</h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{props.instructions ?? t.instructions}</p>
        </header>
      )}

      <ol className="space-y-2.5">
        {slice.map((item, i) => (
          <li key={item.id} className="rise-in rounded-2xl border border-border/60 bg-card p-4 sm:p-5" style={{ ["--i" as string]: i }}>
            <p className="mb-3.5 text-base font-semibold leading-snug tracking-tight">
              <span className="mr-2 text-xs font-medium tabular-nums text-muted-foreground">{page * thresholds.pageSize + i + 1}.</span>
              {item.text}
            </p>
            <div role="radiogroup" aria-label={item.text} className="grid grid-cols-5 gap-1.5">
              {([1, 2, 3, 4, 5] as Answer[]).map((a) => {
                const on = answers[item.id] === a;
                return (
                  <button
                    key={a}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={t.scale[a - 1]}
                    title={t.scale[a - 1]}
                    onClick={() => answer(item.id, a)}
                    className={cn(
                      "press flex min-h-12 flex-col items-center justify-center rounded-xl border px-1 text-center transition-colors",
                      on ? "border-primary bg-primary text-primary-foreground" : "border-border/60 bg-background/40 text-foreground/75 hover:border-primary/50",
                    )}
                  >
                    <span className="text-sm font-bold tabular-nums">{a}</span>
                    <span className={cn("hidden text-[10px] leading-tight sm:block", on ? "text-primary-foreground/80" : "text-muted-foreground")}>{t.scaleShort[a - 1]}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground sm:hidden">
              <span>{t.scaleShort[0]}</span>
              <span>{t.scaleShort[4]}</span>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex items-center gap-2.5">
        <Button variant="outline" size="lg" onClick={goBack} aria-label={copy.common.back}>
          <ChevronLeft /> <span className="hidden sm:inline">{copy.common.back}</span>
        </Button>
        {last ? (
          <Button size="lg" className="flex-1" disabled={done < list.length} onClick={finish}>
            {props.finishLabel ?? t.finish}
          </Button>
        ) : (
          <Button size="lg" className="flex-1" disabled={!pageDone} onClick={() => setPage(page + 1)}>
            {copy.common.next}
          </Button>
        )}
      </div>
      {!pageDone && <p className="mt-3 text-center text-xs text-muted-foreground">{t.unanswered}</p>}

      <div className="mt-8 flex flex-col items-center gap-2 text-[11px] text-muted-foreground">
        <span>
          {!props.items && <>{t.autosaved} · </>}
          {t.sourceNote}
        </span>
        {SHOW_FILL && (
          <button type="button" onClick={fillRandom} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-muted/50 hover:text-foreground">
            <Dices className="size-3.5" /> {t.fillRandom}
          </button>
        )}
      </div>
    </div>
  );
}
