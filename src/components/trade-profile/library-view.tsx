"use client";

import { ArrowLeft, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/trade-profile/content/copy";
import { exercises } from "@/lib/trade-profile/content/exercises";
import { references } from "@/lib/trade-profile/content/references";
import { SourceLink, StatusPill } from "@/components/trade-profile/primitives";
import { useTradeProfile } from "@/components/trade-profile/store";
import { useProfileNav } from "@/components/trade-profile/nav";

/**
 * Opened from the profile: the trader's own data (export, delete) and the
 * evidence behind the exercises. The exercises themselves live in the program
 * on Today, so they are not listed again here.
 */
export function LibraryView() {
  const { state, demo, reset } = useTradeProfile();
  const nav = useProfileNav();
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
      <button type="button" onClick={() => nav.back({ kind: "tab", tab: "profile" })} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> {copy.results.title}
      </button>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
        <section className="min-w-0 space-y-3">
          <div className="px-1">
            <h2 className="font-heading text-lg font-bold tracking-tight">{t.referencesTitle}</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.referencesLead}</p>
          </div>
          {references.map((r) => {
            const n = exercises.filter((e) => e.referenceIds.includes(r.id)).length;
            return (
              <article key={r.id} className="rounded-2xl border border-border/60 bg-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={r.status} />
                  {n > 0 && <span className="text-[11px] text-muted-foreground">{t.usedBy(n)}</span>}
                </div>
                <p className="mt-2 text-sm leading-relaxed">{r.citation}</p>
                {r.doi && (
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                    <SourceLink reference={r} />
                    <span className="text-muted-foreground">doi: <span className="select-all">{r.doi}</span></span>
                  </p>
                )}
                <p className="mt-2 text-xs leading-relaxed text-foreground/80">{r.claim}</p>
              </article>
            );
          })}
        </section>

        <aside className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
          <h3 className="font-heading text-sm font-bold tracking-tight">{t.dataTitle}</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{demo ? copy.demo.banner : t.dataLead}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={download}>
              <Download /> {t.export}
            </Button>
            <Button variant="destructive" size="sm" onClick={() => confirm(t.resetConfirm) && void reset().catch(() => {})}>
              <Trash2 /> {t.reset}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
