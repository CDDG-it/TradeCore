"use client";

import { useCityObject } from "./useCityObject";
import { ClickHintRing } from "./ClickHintRing";
import { BiasLamp } from "./BiasLamp";
import { CityLabel } from "./CityLabel";

const OLIVE = "#5c633a";
const OLIVE_DARK = "#474d2c";

/** A macro-force "tank": tracked body + turret + barrel, in neutral olive, with
 *  the bias shown by the lamp on the turret. */
export function Tank({
  position,
  rotationY = 0,
  accentColor,
  label,
  sublabel,
  active,
  onSelect,
}: {
  position: [number, number, number];
  rotationY?: number;
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
      {/* Hull — sloped glacis at the front for a real-tank silhouette */}
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.4, 0.9]} />
        <meshStandardMaterial color={OLIVE} emissive={OLIVE} emissiveIntensity={glow ? 0.28 : 0.1} roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.36, 0.5]} rotation={[-0.5, 0, 0]} castShadow>
        <boxGeometry args={[1.1, 0.3, 0.28]} />
        <meshStandardMaterial color={OLIVE_DARK} roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Turret */}
      <mesh position={[0, 0.72, -0.05]} castShadow>
        <cylinderGeometry args={[0.32, 0.4, 0.28, 14]} />
        <meshStandardMaterial color={OLIVE} emissive={OLIVE} emissiveIntensity={glow ? 0.28 : 0.1} roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Barrel */}
      <mesh position={[0, 0.74, 0.7]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 1.0, 8]} />
        <meshStandardMaterial color={OLIVE_DARK} roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Antenna + bias lamp on the turret */}
      <mesh position={[0.2, 0.98, -0.15]}>
        <cylinderGeometry args={[0.012, 0.012, 0.3, 6]} />
        <meshStandardMaterial color="#2a2119" roughness={0.8} />
      </mesh>
      <BiasLamp position={[0, 1.05, -0.05]} color={accentColor} radius={0.085} />

      <CityLabel y={1.5} label={label} sublabel={sublabel} accent={accentColor} emphasized={glow} />
    </group>
  );
}
