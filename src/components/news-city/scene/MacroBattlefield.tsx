"use client";

import { Tank } from "./Tank";
import { TREND_META } from "@/lib/news-city/ui";
import type { MacroForce } from "@/lib/news-city/types";
import type { CitySelection } from "../selection";

const LAYOUT: Record<MacroForce["id"], { position: [number, number, number]; rotationY: number }> = {
  inflation: { position: [-2.2, 0, 7.4], rotationY: 0.3 },
  employment: { position: [0.2, 0, 8.4], rotationY: -0.1 },
  growth: { position: [2.4, 0, 7.2], rotationY: -0.35 },
};

const BASE_COLOR = "#5a4630";

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
          <Tank
            key={f.id}
            position={layout.position}
            rotationY={layout.rotationY}
            color={BASE_COLOR}
            accentColor={meta.hex}
            label={f.name}
            sublabel={f.metric}
            active={active}
            onSelect={() => onSelect(f.id)}
          />
        );
      })}
    </group>
  );
}
