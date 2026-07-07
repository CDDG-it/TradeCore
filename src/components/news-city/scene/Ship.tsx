"use client";

import { useCityObject } from "./useCityObject";
import { ClickHintRing } from "./ClickHintRing";
import { BiasLamp } from "./BiasLamp";
import { CityLabel } from "./CityLabel";

/** A sleek hover freighter: capsule hull, cockpit dome, cargo pods, and a
 *  glowing engine strip — smooth surfaces only, no boxes. */
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

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, rotationY, 0]}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      <ClickHintRing ringRef={ringRef} radius={1.7} color={accentColor} />

      {/* Hull — capsule laid along X, hovering above the liquid */}
      <mesh position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.32, 1.5, 6, 20]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.7} emissive={color} emissiveIntensity={glow ? 0.35 : 0.12} />
      </mesh>
      {/* Cockpit dome toward the stern */}
      <mesh position={[-0.72, 0.72, 0]} castShadow>
        <sphereGeometry args={[0.26, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#101c26" roughness={0.12} metalness={0.85} emissive="#9fd8ea" emissiveIntensity={glow ? 0.5 : 0.25} />
      </mesh>
      {/* Cargo pods amidships — rounded capsules */}
      {[0.05, 0.62].map((x, i) => (
        <mesh key={x} position={[x, 0.82, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <capsuleGeometry args={[0.14, 0.36, 4, 14]} />
          <meshStandardMaterial
            color={i === 0 ? "#33404e" : accentColor}
            roughness={0.4}
            metalness={0.6}
            emissive={i === 0 ? "#33404e" : accentColor}
            emissiveIntensity={glow ? 0.4 : 0.15}
          />
        </mesh>
      ))}
      {/* Engine strip under the hull */}
      <mesh position={[0, 0.32, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.06, 1.4, 4, 10]} />
        <meshBasicMaterial color="#7fd4ea" transparent opacity={glow ? 0.95 : 0.75} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0.28, 0]} color="#7fd4ea" intensity={0.5} distance={2.4} decay={2} />

      {/* Bias lamp on a short mast above the cockpit */}
      <mesh position={[-0.72, 1.02, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.3, 8]} />
        <meshStandardMaterial color="#2c3542" roughness={0.5} metalness={0.6} />
      </mesh>
      <BiasLamp position={[-0.72, 1.24, 0]} color={accentColor} radius={0.085} />

      <CityLabel y={1.65} label={label} sublabel={sublabel} accent={accentColor} emphasized={glow} />
    </group>
  );
}
