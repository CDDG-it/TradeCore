"use client";

import { Building } from "./Building";
import type { BuildingVariant } from "./BuildingBodies";
import { DIRECTION_META } from "@/lib/news-city/ui";
import type { CentralBank } from "@/lib/news-city/types";
import type { CitySelection } from "../selection";

const LAYOUT: Record<CentralBank["id"], { position: [number, number, number]; height: number; width: number; variant: BuildingVariant }> = {
  fed: { position: [-7.7, 0, -7.5], height: 2.6, width: 1.9, variant: "classical" },
  ecb: { position: [-5.4, 0, -5.3], height: 3.0, width: 1.3, variant: "glass" },
  boj: { position: [-6.7, 0, -8.9], height: 2.1, width: 1.6, variant: "domed" },
};

export function CentralBankDistrict({
  banks,
  selected,
  onSelect,
}: {
  banks: CentralBank[];
  selected: CitySelection | null;
  onSelect: (id: CentralBank["id"]) => void;
}) {
  return (
    <group>
      {banks.map((bank) => {
        const layout = LAYOUT[bank.id];
        const meta = DIRECTION_META[bank.direction];
        const active = selected?.kind === "bank" && selected.id === bank.id;
        return (
          <Building
            key={bank.id}
            position={layout.position}
            width={layout.width}
            depth={layout.width}
            height={layout.height}
            variant={layout.variant}
            biasColor={meta.hex}
            label={bank.shortName}
            sublabel={meta.label}
            active={active}
            onSelect={() => onSelect(bank.id)}
          />
        );
      })}
    </group>
  );
}
