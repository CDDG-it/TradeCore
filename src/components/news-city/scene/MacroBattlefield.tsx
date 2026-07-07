"use client";

import { Reactor } from "./Reactor";
import { TREND_META } from "@/lib/news-city/ui";
import type { MacroForce } from "@/lib/news-city/types";
import type { CitySelection } from "../selection";

/** The Macro Intelligence Zone: three levitating macro reactors whose energy
 *  scales with the strength of the force they represent. */
const LAYOUT: Record<MacroForce["id"], { position: [number, number, number] }> = {
  inflation: { position: [-8.6, 0, 5.1] },
  employment: { position: [-6.4, 0, 8.3] },
  growth: { position: [-4.2, 0, 5.2] },
};

export function MacroBattlefield({
  forces,
  selected,
  onSelect,
}: {
  forces: MacroForce[];
  selected: CitySelection | null;
  onSelect: (id: MacroForce["id"]) => void;
}) {
  return (
    <group>
      {forces.map((f) => {
        const layout = LAYOUT[f.id];
        const meta = TREND_META[f.direction];
        const active = selected?.kind === "macro" && selected.id === f.id;
        return (
          <Reactor
            key={f.id}
            position={layout.position}
            accentColor={meta.hex}
            intensity={f.intensity}
            label={f.name}
            sublabel={`${f.metric} · ${f.level}`}
            active={active}
            onSelect={() => onSelect(f.id)}
          />
        );
      })}
    </group>
  );
}
