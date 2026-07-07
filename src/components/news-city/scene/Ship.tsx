"use client";

import { useCityObject } from "./useCityObject";
import { CityLabel } from "./CityLabel";

/** A harbor vessel: low hull + small cabin block, wider than it is tall. */
export function Ship({
  position,
  rotationY = 0,
  color,
  accentColor,
  label,
  sublabel,
  active,
  onSelect,
}: {
  position: [number, number, number];
  rotationY?: number;
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
      rotation={[0, rotationY, 0]}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      {/* Hull */}
      <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.56, 0.9]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow ? 0.4 : 0.12} roughness={0.5} metalness={0.35} />
      </mesh>
      {/* Cabin */}
      <mesh position={[-0.9, 0.66, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.7]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={glow ? 0.6 : 0.25} />
      </mesh>
      {/* Cargo blocks */}
      {[0.1, 0.7].map((x) => (
        <mesh key={x} position={[x, 0.62, 0]}>
          <boxGeometry args={[0.42, 0.4, 0.7]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={glow ? 0.4 : 0.15} />
        </mesh>
      ))}
      <CityLabel y={1.5} label={label} sublabel={sublabel} accent={accentColor} emphasized={glow} />
    </group>
  );
}
