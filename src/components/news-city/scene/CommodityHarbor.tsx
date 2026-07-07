"use client";

import { Ship } from "./Ship";
import { WaterPlane } from "./WaterPlane";
import { TREND_META } from "@/lib/news-city/ui";
import type { Commodity } from "@/lib/news-city/types";
import type { CitySelection } from "../selection";

const LAYOUT: Record<Commodity["id"], { position: [number, number, number]; rotationY: number; color: string }> = {
  oil: { position: [5.2, 0, -8], rotationY: 0.15, color: "#2b3440" },
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
      {/* Contained liquid basin with a glowing rim — a commodity reservoir. */}
      <WaterPlane position={[6.5, 0.008, -6.5]} size={5.4} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[6.5, 0.02, -6.5]}>
        <ringGeometry args={[2.72, 2.8, 64]} />
        <meshBasicMaterial color="#5fc0d8" transparent opacity={0.6} toneMapped={false} depthWrite={false} />
      </mesh>

      {/* Docking platform — dark glass deck with an accent edge light */}
      <mesh position={[3.7, 0.05, -6.5]} castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.62, 0.1, 6]} />
        <meshStandardMaterial color="#161c25" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[3.7, 0.11, -6.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.48, 6]} />
        <meshBasicMaterial color="#f97316" transparent opacity={0.7} toneMapped={false} />
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
