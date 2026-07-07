"use client";

import { Ship } from "./Ship";
import { WaterPlane } from "./WaterPlane";
import { TREND_META } from "@/lib/news-city/ui";
import type { Commodity } from "@/lib/news-city/types";
import type { CitySelection } from "../selection";

const LAYOUT: Record<Commodity["id"], { position: [number, number, number]; rotationY: number; color: string }> = {
  oil: { position: [5.2, 0, -8], rotationY: 0.15, color: "#2c241c" },
  gold: { position: [7.8, 0, -5.4], rotationY: -0.35, color: "#b8923f" },
};

const BOLLARDS: [number, number][] = [
  [4.1, -9.1],
  [4.5, -3.9],
  [9.5, -8.9],
];

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
      <WaterPlane position={[6.5, 0.008, -6.5]} size={5.6} />

      {/* Wooden pier along the dock edge */}
      <mesh position={[3.85, 0.05, -6.5]} receiveShadow castShadow>
        <boxGeometry args={[0.5, 0.1, 5.8]} />
        <meshStandardMaterial color="#5a4630" roughness={0.85} />
      </mesh>
      {BOLLARDS.map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, 0.16, z]} castShadow>
          <cylinderGeometry args={[0.05, 0.06, 0.22, 8]} />
          <meshStandardMaterial color="#2a2119" roughness={0.8} />
        </mesh>
      ))}

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
