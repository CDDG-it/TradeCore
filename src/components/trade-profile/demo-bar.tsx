"use client";

import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/trade-profile/content/copy";
import { personaText } from "@/lib/trade-profile/content/personas";
import { addDays, daysBetween, today } from "@/lib/trade-profile/dates";
import { personas } from "@/lib/trade-profile/personas";
import { useTradeProfile } from "@/components/trade-profile/store";

/** The demo preview's controls: which trader, which week, and the way out. */
export function DemoBar() {
  const { demo, state, startDemo, exitDemo, setDayOffset } = useTradeProfile();
  if (!demo) return null;
  const realToday = today();
  const jump = (week: number) => state.programStart && setDayOffset(daysBetween(realToday, addDays(state.programStart, (week - 1) * 7)));

  return (
    <div className="rounded-2xl border border-ice/25 bg-ice/[0.06] p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-2 text-xs font-semibold text-ice">
          <FlaskConical className="size-3.5" /> {copy.demo.banner}
        </p>
        <Button variant="ghost" size="sm" onClick={exitDemo}>
          {copy.demo.exit}
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {personas.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => startDemo(p.id)}
            className={cn(
              "press rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              demo.personaId === p.id ? "border-ice/40 bg-ice/15 text-foreground" : "border-border/60 text-foreground/70 hover:text-foreground",
            )}
          >
            {personaText[p.id].name}
          </button>
        ))}
      </div>
      {state.programStart && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="mr-1 text-muted-foreground">{copy.demo.simulate}</span>
          <button type="button" onClick={() => setDayOffset(0)} className={cn("press rounded-full border px-2.5 py-1", demo.dayOffset === 0 ? "border-primary/40 text-primary" : "border-border/60 text-foreground/70")}>
            {copy.demo.realDate}
          </button>
          {[6, 12].map((w) => (
            <button key={w} type="button" onClick={() => jump(w)} className="press rounded-full border border-border/60 px-2.5 py-1 text-foreground/70 hover:text-foreground">
              {copy.demo.jump(w)}
            </button>
          ))}
          <span className="ml-auto tabular-nums text-muted-foreground">{today(demo.dayOffset)}</span>
        </div>
      )}
    </div>
  );
}
