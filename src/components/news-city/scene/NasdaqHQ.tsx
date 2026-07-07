"use client";

import { useMemo } from "react";
import { Building } from "./Building";
import { getFacadeTexture } from "./buildingTexture";
import { SENTIMENT_META } from "@/lib/news-city/ui";
import type { MarketHQ } from "@/lib/news-city/types";
import type { CitySelection } from "../selection";

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
  const skylineFacade = useMemo(() => getFacadeTexture("#2c2013", "#e8b878"), []);

  return (
    <group>
      {/* Main tower — the tallest structure in the city, so it always reads as "home base". */}
      <Building
        position={[0, 0, 0]}
        width={2.1}
        depth={2.1}
        height={4.6}
        color="#3a2a18"
        accentColor={meta.hex}
        label="Nasdaq / ES HQ"
        sublabel={`${nq?.price ?? ""} · ${meta.label}`}
        active={active}
        onSelect={onSelect}
      />
      {/* Two flanking towers, purely decorative skyline context. */}
      <mesh position={[-2.1, 1.1, -1.1]} castShadow receiveShadow>
        <boxGeometry args={[1, 2.2, 1]} />
        <meshStandardMaterial map={skylineFacade} color="#ffffff" roughness={0.55} metalness={0.2} emissive="#e8b878" emissiveMap={skylineFacade} emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[2.2, 0.9, -0.8]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 1.8, 0.9]} />
        <meshStandardMaterial map={skylineFacade} color="#ffffff" roughness={0.55} metalness={0.2} emissive="#e8b878" emissiveMap={skylineFacade} emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
}
