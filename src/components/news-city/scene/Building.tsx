"use client";

import { useCityObject } from "./useCityObject";
import { ClickHintRing } from "./ClickHintRing";
import { BiasLamp } from "./BiasLamp";
import { CityLabel } from "./CityLabel";
import { ClassicalHall, GlassTower, DomedHall, SetbackTower, lampHeightFor, type BuildingVariant } from "./BuildingBodies";

export function Building({
  position,
  width = 1.5,
  depth = 1.5,
  height,
  variant,
  biasColor,
  label,
  sublabel,
  active,
  onSelect,
}: {
  position: [number, number, number];
  width?: number;
  depth?: number;
  height: number;
  variant: BuildingVariant;
  biasColor: string;
  label: string;
  sublabel?: string;
  active: boolean;
  onSelect: () => void;
}) {
  const { groupRef, ringRef, hovered, onPointerOver, onPointerOut, onClick } = useCityObject(active, onSelect);
  const glow = hovered || active;

  const body =
    variant === "classical" ? (
      <ClassicalHall width={width} depth={depth} height={height} glow={glow} />
    ) : variant === "glass" ? (
      <GlassTower width={width} depth={depth} height={height} glow={glow} />
    ) : variant === "domed" ? (
      <DomedHall width={width} depth={depth} height={height} glow={glow} />
    ) : (
      <SetbackTower width={width} depth={depth} height={height} glow={glow} />
    );

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      <ClickHintRing ringRef={ringRef} radius={Math.max(width, depth) * 0.95} color={biasColor} />
      {body}
      <BiasLamp position={[0, lampHeightFor(variant, height), 0]} color={biasColor} />
      <CityLabel y={lampHeightFor(variant, height) + 0.45} label={label} sublabel={sublabel} accent={biasColor} emphasized={glow} />
    </group>
  );
}
