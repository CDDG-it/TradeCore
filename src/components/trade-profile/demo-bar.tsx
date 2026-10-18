"use client";

import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/trade-profile/content/copy";
import { personaText } from "@/lib/trade-profile/content/personas";
import { addDays, daysBetween, today } from "@/lib/trade-profile/dates";
import { personas } from "@/lib/trade-profile/personas";
import { useTradeProfile } from "@/components/trade-profile/store";

const chip = "press shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors";

/** The demo preview's controls in one line: which trader, which week, and the way out. */
export function DemoBar() {
  const { demo, state, startDemo, exitDemo, setDayOffset } = useTradeProfile();
  if (!demo) return null;
  const realToday = today();
  const jump = (week: number) => state.programStart && setDayOffset(daysBetween(realToday, addDays(state.programStart, (week - 1) * 7)));
  const atWeek = (week: number) => state.programStart !== null && today(demo.dayOffset) === addDays(state.programStart, (week - 1) * 7);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-ice/25 bg-ice/[0.05] px-3 py-2.5 sm:px-4">
      <p className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-ice">
        <FlaskConical className="size-3.5" /> {copy.demo.banner}
      </p>
      <div className="flex min-w-0 flex-wrap gap-1.5">
        {personas.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => startDemo(p.id)}
            className={cn(chip, demo.personaId === p.id ? "border-ice/40 bg-ice/15 text-foreground" : "border-border/60 text-foreground/65 hover:text-foreground")}
          >
            {personaText[p.id].name}
          </button>
        ))}
      </div>
      {state.programStart && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{copy.demo.simulate}</span>
          <button type="button" onClick={() => setDayOffset(0)} className={cn(chip, demo.dayOffset === 0 ? "border-primary/40 text-primary" : "border-border/60 text-foreground/65")}>
            {copy.demo.realDate}
          </button>
          {[6, 12].map((w) => (
            <button key={w} type="button" onClick={() => jump(w)} className={cn(chip, atWeek(w) ? "border-primary/40 text-primary" : "border-border/60 text-foreground/65 hover:text-foreground")}>
              {copy.demo.jump(w)}
            </button>
          ))}
        </div>
      )}
      <button type="button" onClick={exitDemo} className="ml-auto text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        {copy.demo.exit}
      </button>
    </div>
  );
}
