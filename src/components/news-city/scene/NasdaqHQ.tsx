"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh, MeshBasicMaterial } from "three";
import { Building } from "./Building";
import { SkylineTower } from "./BuildingBodies";
import { SENTIMENT_META } from "@/lib/news-city/ui";
import type { MarketHQ } from "@/lib/news-city/types";
import type { CitySelection } from "../selection";

/** Animated energy rings climbing (risk-on) or descending (risk-off) the HQ
 *  tower — the building visibly reacts to the current market regime. */
function EnergyRings({ height, radius, color, up }: { height: number; radius: number; color: string; up: boolean }) {
  const refs = useRef<(Mesh | null)[]>([]);
  const COUNT = 3;

  useFrame((state) => {
    for (let i = 0; i < COUNT; i++) {
      const m = refs.current[i];
      if (!m) continue;
      const t = (state.clock.elapsedTime * 0.22 + i / COUNT) % 1;
      const f = up ? t : 1 - t;
      m.position.y = 0.3 + f * height;
      // The tower tapers, so the ring shrinks as it climbs.
      const s = 1 - 0.55 * f;
      m.scale.set(s, s, s);
      (m.material as MeshBasicMaterial).opacity = 0.55 * Math.sin(Math.PI * t);
    }
  });

  return (
    <>
      {Array.from({ length: COUNT }).map((_, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius, 0.02, 8, 48]} />
          <meshBasicMaterial color={color} transparent toneMapped={false} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

export function NasdaqHQ({
  hq,
  selected,
  onSelect,
}: {
  hq: MarketHQ;
  selected: CitySelection | null;
  onSelect: () => void;
}) {
  const meta = SENTIMENT_META[hq.sentiment];
  const active = selected?.kind === "hq";
  const nq = hq.indices.find((i) => i.id === "nq");
  const bullish = hq.sentiment === "risk-on";

  return (
    <group position={[8.4, 0, 7.8]}>
      {/* Main tower — the exchange itself. */}
      <Building
        position={[0, 0, 0]}
        width={1.9}
        depth={1.9}
        height={4.0}
        variant="setback"
        biasColor={meta.hex}
        label="Nasdaq / ES HQ"
        sublabel={`${nq?.price ?? ""} · ${meta.label}`}
        active={active}
        onSelect={onSelect}
      />
      {/* Market energy visibly climbing (risk-on) or sinking (risk-off). */}
      <EnergyRings height={4.0} radius={1.25} color={meta.hex} up={bullish} />

      {/* Decorative skyline towers around the exchange (non-interactive). */}
      <group position={[-2.9, 0, -1.5]}>
        <SkylineTower width={0.9} height={2.1} />
      </group>
      <group position={[2.9, 0, -1.2]}>
        <SkylineTower width={0.8} height={1.7} />
      </group>
      <group position={[2.5, 0, 2.1]}>
        <SkylineTower width={0.7} height={1.3} />
      </group>
    </group>
  );
}
