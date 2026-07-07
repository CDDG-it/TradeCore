"use client";

import { useCityObject } from "./useCityObject";
import { CityLabel } from "./CityLabel";

export function Building({
  position,
  width = 1.5,
  depth = 1.5,
  height,
  color,
  accentColor,
  label,
  sublabel,
  active,
  onSelect,
}: {
  position: [number, number, number];
  width?: number;
  depth?: number;
  height: number;
  color: string;
  accentColor: string;
  label: string;
  sublabel?: string;
  active: boolean;
  onSelect: () => void;
}) {
  const { groupRef, hovered, onPointerOver, onPointerOut, onClick } = useCityObject(active, onSelect);
  const glow = hovered || active;

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={glow ? 0.45 : 0.14}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
      {/* Roof accent — reads as the "flag" of each building's stance/category. */}
      <mesh position={[0, height + 0.1, 0]}>
        <boxGeometry args={[width * 0.82, 0.2, depth * 0.82]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={glow ? 0.7 : 0.4} />
      </mesh>
      <CityLabel y={height + 0.75} label={label} sublabel={sublabel} accent={accentColor} emphasized={glow} />
    </group>
  );
}
