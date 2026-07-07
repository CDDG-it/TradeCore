"use client";

import { useCityObject } from "./useCityObject";
import { ClickHintRing } from "./ClickHintRing";
import { CityLabel } from "./CityLabel";

/** A harbor vessel: a stepped hull that tapers to a bow, a bridge cabin,
 *  a mast, and cargo/cargo-tank detail — low-poly, but reads as a real boat. */
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
  const { groupRef, ringRef, hovered, onPointerOver, onPointerOut, onClick } = useCityObject(active, onSelect);
  const glow = hovered || active;
  const hullMat = <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow ? 0.4 : 0.12} roughness={0.5} metalness={0.35} />;

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, rotationY, 0]}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      <ClickHintRing ringRef={ringRef} radius={1.9} color={accentColor} />

      {/* Main hull */}
      <mesh position={[-0.35, 0.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.9, 0.56, 0.9]} />
        {hullMat}
      </mesh>
      {/* Stepped bow taper — two shrinking segments toward the front. */}
      <mesh position={[0.75, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.5, 0.72]} />
        {hullMat}
      </mesh>
      <mesh position={[1.22, 0.32, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 0.42, 0.46]} />
        {hullMat}
      </mesh>
      <mesh position={[1.48, 0.34, 0]} castShadow>
        <boxGeometry args={[0.14, 0.32, 0.24]} />
        {hullMat}
      </mesh>
      {/* Waterline hull-bottom, slightly darker, gives the hull some draft. */}
      <mesh position={[-0.3, 0.03, 0]}>
        <boxGeometry args={[2.0, 0.1, 0.86]} />
        <meshStandardMaterial color="#161109" roughness={0.9} />
      </mesh>

      {/* Bridge / cabin toward the stern */}
      <mesh position={[-1.0, 0.7, 0]}>
        <boxGeometry args={[0.42, 0.5, 0.66]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={glow ? 0.6 : 0.25} />
      </mesh>
      {/* Bridge windows */}
      <mesh position={[-1.0, 0.82, 0.34]}>
        <boxGeometry args={[0.3, 0.12, 0.02]} />
        <meshStandardMaterial color="#bfe6f2" emissive="#bfe6f2" emissiveIntensity={0.5} />
      </mesh>

      {/* Cargo blocks / tanks amidships */}
      {[0.05, 0.45].map((x) => (
        <mesh key={x} position={[x, 0.62, 0]}>
          <boxGeometry args={[0.36, 0.4, 0.7]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={glow ? 0.4 : 0.15} />
        </mesh>
      ))}

      {/* Mast + crossbar for a bit of silhouette detail */}
      <mesh position={[-1.0, 1.15, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.5, 6]} />
        <meshStandardMaterial color="#2a2119" roughness={0.8} />
      </mesh>
      <mesh position={[-1.0, 1.32, 0]}>
        <boxGeometry args={[0.28, 0.02, 0.02]} />
        <meshStandardMaterial color="#2a2119" roughness={0.8} />
      </mesh>

      <CityLabel y={1.7} label={label} sublabel={sublabel} accent={accentColor} emphasized={glow} />
    </group>
  );
}
