"use client";

import { useCityObject } from "./useCityObject";
import { ClickHintRing } from "./ClickHintRing";
import { CityLabel } from "./CityLabel";

/** A macro-force "tank": tracked body + rotating-feel turret + barrel. */
export function Tank({
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
  const { groupRef, ringRef, hovered, onPointerOver, onPointerOut, onClick } = useCityObject(active, onSelect);
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
      <ClickHintRing ringRef={ringRef} radius={1.1} color={accentColor} />

      {/* Tracks */}
      {[-0.5, 0.5].map((z) => (
        <mesh key={z} position={[0, 0.18, z]} castShadow>
          <boxGeometry args={[1.3, 0.28, 0.32]} />
          <meshStandardMaterial color="#2a2119" roughness={0.9} metalness={0.1} />
        </mesh>
      ))}
      {/* Hull */}
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.4, 0.9]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow ? 0.45 : 0.14} roughness={0.45} metalness={0.3} />
      </mesh>
      {/* Turret */}
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.34, 0.4, 0.26, 12]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={glow ? 0.6 : 0.25} />
      </mesh>
      {/* Barrel */}
      <mesh position={[0, 0.72, 0.75]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.9, 8]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={glow ? 0.5 : 0.2} />
      </mesh>
      <CityLabel y={1.35} label={label} sublabel={sublabel} accent={accentColor} emphasized={glow} />
    </group>
  );
}
