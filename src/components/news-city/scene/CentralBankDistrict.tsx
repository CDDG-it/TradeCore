"use client";

import { Building } from "./Building";
import { DIRECTION_META } from "@/lib/news-city/ui";
import type { CentralBank } from "@/lib/news-city/types";
import type { CitySelection } from "../selection";

const LAYOUT: Record<CentralBank["id"], { position: [number, number, number]; height: number; width: number }> = {
  fed: { position: [-7.6, 0, -7.4], height: 3.4, width: 1.7 },
  ecb: { position: [-5.6, 0, -5.4], height: 2.7, width: 1.5 },
  boj: { position: [-6.6, 0, -8.6], height: 2.3, width: 1.4 },
};

const BASE_COLOR = "#8a6a45";

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
            color={BASE_COLOR}
            accentColor={meta.hex}
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
