"use client";

import { useCityObject } from "./useCityObject";
import { ClickHintRing } from "./ClickHintRing";
import { BiasLamp } from "./BiasLamp";
import { CityLabel } from "./CityLabel";

const ARMOR = "#9aa5b1";
const ARMOR_DARK = "#6e7a87";

/** A macro-force hover drone: flattened elliptical body, dome turret, smooth
 *  barrel, and a glowing anti-grav ring instead of tracks. */
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
      <ClickHintRing ringRef={ringRef} radius={1.05} color={accentColor} />

      {/* Anti-grav ring + underglow */}
      <mesh position={[0, 0.22, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.52, 0.035, 10, 40]} />
        <meshBasicMaterial color="#1f8fb4" transparent opacity={glow ? 0.95 : 0.7} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0.18, 0]} color="#7fd4ea" intensity={0.4} distance={1.8} decay={2} />

      {/* Body — flattened ellipsoid hovering above the deck */}
      <mesh position={[0, 0.46, 0]} scale={[1, 0.42, 1.15]} castShadow>
        <sphereGeometry args={[0.56, 28, 18]} />
        <meshStandardMaterial color={ARMOR} roughness={0.4} metalness={0.3} emissive="#ffffff" emissiveIntensity={glow ? 0.2 : 0.04} />
      </mesh>
      {/* Turret dome */}
      <mesh position={[0, 0.62, -0.06]} castShadow>
        <sphereGeometry args={[0.26, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={ARMOR_DARK} roughness={0.3} metalness={0.35} emissive="#bfe4f2" emissiveIntensity={glow ? 0.3 : 0.08} />
      </mesh>
      {/* Barrel — smooth tapered tube */}
      <mesh position={[0, 0.62, 0.55]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.05, 0.95, 14]} />
        <meshStandardMaterial color={ARMOR_DARK} roughness={0.4} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.62, 1.04]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.045, 0.012, 8, 20]} />
        <meshBasicMaterial color={accentColor} toneMapped={false} transparent opacity={0.9} />
      </mesh>

      <BiasLamp position={[0, 0.98, -0.06]} color={accentColor} radius={0.08} />

      <CityLabel y={1.45} label={label} sublabel={sublabel} accent={accentColor} emphasized={glow} />
    </group>
  );
}
