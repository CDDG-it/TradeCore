"use client";

import { ChevronRight } from "lucide-react";
import { AccentPanel } from "@/components/ui/accent-panel";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/trade-profile/content/copy";
import { focusAreas } from "@/lib/trade-profile/content/focus-areas";
import { traitName } from "@/lib/trade-profile/content/traits";
import type { FocusResult } from "@/lib/trade-profile/focus";
import { Pill, Tile } from "@/components/trade-profile/primitives";
import { useDerived } from "@/components/trade-profile/store";
import { useProfileNav } from "@/components/trade-profile/nav";

function because(r: FocusResult) {
  const parts = r.hits.map((h) => `${traitName(h.trait)} = ${Math.round(h.score)}`);
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} ${copy.common.and} ${parts.at(-1)}` : parts[0];
}

function AreaPanel({ result, rank }: { result: FocusResult; rank: "primary" | "secondary" }) {
  const a = focusAreas[result.id];
  const t = copy.focus;
  return (
    <AccentPanel
      accent={rank === "primary" ? "primary" : "cyan"}
      eyebrow={rank === "primary" ? t.primary : t.secondary}
      title={a.title}
      subtitle={a.summary}
    >
      <Tile className="mt-4">
        {result.hits.length ? (
          <p className="text-sm text-foreground/85">
            {t.because} <span className="font-semibold text-foreground">{because(result)}</span>
            <span className="text-muted-foreground"> ({copy.common.positionShort})</span>.
          </p>
        ) : (
          <p className="text-sm text-foreground/85">{t.noTrigger}</p>
        )}
        {result.hits.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {result.hits.map((h) => (
              <Pill key={h.trait} tone={rank === "primary" ? "primary" : "ice"}>
                {traitName(h.trait)} {h.op === ">=" ? "≥" : "≤"} {h.threshold}
              </Pill>
            ))}
          </div>
        )}
      </Tile>
      <dl className="mt-4 grid gap-3 text-xs leading-relaxed sm:grid-cols-2">
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t.pattern}</dt>
          <dd className="mt-0.5 text-foreground/80">{a.pattern}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t.problem}</dt>
          <dd className="mt-0.5 text-foreground/80">{a.tradingProblem}</dd>
        </div>
      </dl>
    </AccentPanel>
  );
}

export function FocusView() {
  const { focus } = useDerived();
  const nav = useProfileNav();
  if (!focus) return null;
  const t = copy.focus;
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-xl font-bold tracking-tight">{t.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.lead}</p>
      </div>
      <AreaPanel result={focus.primary} rank="primary" />
      {focus.secondary && <AreaPanel result={focus.secondary} rank="secondary" />}
      <p className="text-[11px] leading-relaxed text-muted-foreground">{t.hypothesis}</p>
      <Button size="lg" onClick={() => nav.goTab("goal")}>
        {t.cta} <ChevronRight />
      </Button>
    </div>
  );
}
