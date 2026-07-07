"use client";

import { useCityObject } from "./useCityObject";
import { ClickHintRing } from "./ClickHintRing";
import { BiasLamp } from "./BiasLamp";
import { CityLabel } from "./CityLabel";

const CONTAINER_COLORS = ["#7a3f36", "#31566e", "#3e6b4f", "#8a6a30"];

/** A realistic night-lit cargo vessel: long low hull with a stepped tapering
 *  bow, dark waterline, white stern superstructure with lit bridge windows,
 *  funnel with an accent band, deck cargo, and running lights — a working
 *  ship, not a toy. */
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
  const hullMat = (
    <meshStandardMaterial color={color} roughness={0.55} metalness={0.4} emissive={color} emissiveIntensity={glow ? 0.35 : 0.08} />
  );

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

      {/* Waterline band — dark draft below the hull */}
      <mesh position={[-0.15, 0.07, 0]}>
        <boxGeometry args={[2.5, 0.1, 0.74]} />
        <meshStandardMaterial color="#080b10" roughness={0.9} />
      </mesh>
      {/* Main hull */}
      <mesh position={[-0.25, 0.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.34, 0.72]} />
        {hullMat}
      </mesh>
      {/* Stepped tapering bow */}
      <mesh position={[1.05, 0.29, 0]} castShadow>
        <boxGeometry args={[0.5, 0.3, 0.58]} />
        {hullMat}
      </mesh>
      <mesh position={[1.4, 0.3, 0]} castShadow>
        <boxGeometry args={[0.24, 0.26, 0.38]} />
        {hullMat}
      </mesh>
      <mesh position={[1.57, 0.31, 0]} castShadow>
        <boxGeometry args={[0.12, 0.22, 0.2]} />
        {hullMat}
      </mesh>
      {/* Deck plate */}
      <mesh position={[-0.25, 0.465, 0]}>
        <boxGeometry args={[2.18, 0.03, 0.66]} />
        <meshStandardMaterial color="#1c242f" roughness={0.7} metalness={0.3} />
      </mesh>
      {/* Running-light strips along the deck edges */}
      {[-0.34, 0.34].map((z) => (
        <mesh key={z} position={[-0.2, 0.475, z]}>
          <boxGeometry args={[2.1, 0.012, 0.018]} />
          <meshBasicMaterial color="#ffd9a8" transparent opacity={0.55} toneMapped={false} depthWrite={false} />
        </mesh>
      ))}

      {/* Stern superstructure — white castle with lit bridge windows */}
      <mesh position={[-1.05, 0.72, 0]} castShadow>
        <boxGeometry args={[0.44, 0.5, 0.6]} />
        <meshStandardMaterial color="#8f99a5" roughness={0.5} metalness={0.25} emissive="#3a4552" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[-1.05, 1.06, 0]} castShadow>
        <boxGeometry args={[0.34, 0.18, 0.48]} />
        <meshStandardMaterial color="#9aa5b1" roughness={0.5} metalness={0.25} emissive="#3a4552" emissiveIntensity={0.3} />
      </mesh>
      {/* Bridge window band */}
      <mesh position={[-0.87, 1.08, 0]}>
        <boxGeometry args={[0.015, 0.07, 0.44]} />
        <meshBasicMaterial color="#bfe4f2" transparent opacity={0.9} toneMapped={false} />
      </mesh>
      {/* Deck-house window rows */}
      {[0.62, 0.8].map((y) => (
        <mesh key={y} position={[-0.82, y, 0]}>
          <boxGeometry args={[0.012, 0.04, 0.52]} />
          <meshBasicMaterial color="#ffd9a8" transparent opacity={0.65} toneMapped={false} />
        </mesh>
      ))}
      {/* Funnel with accent band */}
      <mesh position={[-1.28, 1.08, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.3, 12]} />
        <meshStandardMaterial color="#232b36" roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh position={[-1.28, 1.16, 0]}>
        <cylinderGeometry args={[0.085, 0.085, 0.07, 12]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={glow ? 0.9 : 0.5} toneMapped={false} />
      </mesh>

      {/* Deck cargo — muted container stacks */}
      {[0.05, 0.42, 0.79].map((x, row) =>
        [0, 1].map((layer) => (
          <mesh key={`${x}-${layer}`} position={[x, 0.56 + layer * 0.15, layer % 2 ? 0.14 : -0.14]} castShadow>
            <boxGeometry args={[0.32, 0.14, 0.3]} />
            <meshStandardMaterial
              color={CONTAINER_COLORS[(row + layer) % CONTAINER_COLORS.length]}
              roughness={0.75}
              metalness={0.2}
              emissive={CONTAINER_COLORS[(row + layer) % CONTAINER_COLORS.length]}
              emissiveIntensity={0.12}
            />
          </mesh>
        ))
      )}

      {/* Foremast with the bias lamp */}
      <mesh position={[1.15, 0.62, 0]}>
        <cylinderGeometry args={[0.014, 0.018, 0.45, 8]} />
        <meshStandardMaterial color="#2c3542" roughness={0.6} metalness={0.5} />
      </mesh>
      <BiasLamp position={[1.15, 0.9, 0]} color={accentColor} radius={0.075} />

      <CityLabel y={1.65} label={label} sublabel={sublabel} accent={accentColor} emphasized={glow} />
    </group>
  );
}
