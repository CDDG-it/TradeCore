"use client";

import { Building } from "./Building";
import { SkylineTower } from "./BuildingBodies";
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

  return (
    <group>
      {/* Main tower — the tallest structure in the city, so it always reads as "home base". */}
      <Building
        position={[0, 0, 0]}
        width={2.0}
        depth={2.0}
        height={4.4}
        variant="setback"
        biasColor={meta.hex}
        label="Nasdaq / ES HQ"
        sublabel={`${nq?.price ?? ""} · ${meta.label}`}
        active={active}
        onSelect={onSelect}
      />
      {/* Decorative skyline towers flanking the HQ (non-interactive). */}
      <group position={[-2.5, 0, -1.2]}>
        <SkylineTower width={1.0} height={2.4} />
      </group>
      <group position={[2.5, 0, -0.9]}>
        <SkylineTower width={0.9} height={1.9} />
      </group>
      <group position={[2.1, 0, 1.4]}>
        <SkylineTower width={0.8} height={1.5} />
      </group>
      <group position={[-2.2, 0, 1.6]}>
        <SkylineTower width={0.85} height={1.7} />
      </group>
    </group>
  );
}
