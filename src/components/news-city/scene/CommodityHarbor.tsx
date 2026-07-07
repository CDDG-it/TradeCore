"use client";

import { Ship } from "./Ship";
import { TREND_META } from "@/lib/news-city/ui";
import type { Commodity } from "@/lib/news-city/types";
import type { CitySelection } from "../selection";

const LAYOUT: Record<Commodity["id"], { position: [number, number, number]; rotationY: number; color: string }> = {
  oil: { position: [5.2, 0, -8], rotationY: 0.15, color: "#2c241c" },
  gold: { position: [7.8, 0, -5.4], rotationY: -0.35, color: "#b8923f" },
};

export function CommodityHarbor({
  commodities,
  selected,
  onSelect,
}: {
  commodities: Commodity[];
  selected: CitySelection | null;
  onSelect: (id: Commodity["id"]) => void;
}) {
  return (
    <group>
      {/* Water / dock plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[6.5, 0.008, -6.5]} receiveShadow>
        <planeGeometry args={[5.6, 5.6]} />
        <meshStandardMaterial color="#0f2a33" roughness={0.3} metalness={0.4} transparent opacity={0.85} />
      </mesh>

      {commodities.map((c) => {
        const layout = LAYOUT[c.id];
        const meta = TREND_META[c.direction];
        const active = selected?.kind === "commodity" && selected.id === c.id;
        return (
          <Ship
            key={c.id}
            position={layout.position}
            rotationY={layout.rotationY}
            color={layout.color}
            accentColor={meta.hex}
            label={c.name}
            sublabel={`${c.price} · ${meta.label}`}
            active={active}
            onSelect={() => onSelect(c.id)}
          />
        );
      })}
    </group>
  );
}
