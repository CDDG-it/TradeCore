"use client";

import { useCityObject } from "./useCityObject";
import { ClickHintRing } from "./ClickHintRing";
import { BiasLamp } from "./BiasLamp";
import { CityLabel } from "./CityLabel";

const CONTAINER_COLORS = ["#b5453a", "#2f6f9e", "#3f8f5c", "#c98a2e", "#7a5aa0"];

/** A harbor cargo vessel: a stepped hull that tapers to a bow, a steel bridge,
 *  a funnel, stacked shipping containers, a mast, and a bias lamp on top. */
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
  const hullMat = <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow ? 0.3 : 0.1} roughness={0.55} metalness={0.4} />;

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
      {/* Stepped bow taper — shrinking segments toward the front. */}
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
      {/* Waterline hull-bottom, darker, gives the hull some draft. */}
      <mesh position={[-0.3, 0.05, 0]}>
        <boxGeometry args={[2.0, 0.14, 0.86]} />
        <meshStandardMaterial color="#12100b" roughness={0.9} />
      </mesh>

      {/* Bridge / superstructure toward the stern (steel white) */}
      <mesh position={[-1.02, 0.72, 0]} castShadow>
        <boxGeometry args={[0.46, 0.54, 0.72]} />
        <meshStandardMaterial color="#e6e7ea" roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh position={[-1.02, 1.05, 0]} castShadow>
        <boxGeometry args={[0.34, 0.2, 0.5]} />
        <meshStandardMaterial color="#d5d7db" roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Bridge windows */}
      <mesh position={[-0.79, 0.82, 0]}>
        <boxGeometry args={[0.02, 0.14, 0.5]} />
        <meshStandardMaterial color="#243b48" emissive="#7fb4c8" emissiveIntensity={0.4} />
      </mesh>
      {/* Funnel with a bias-coloured band */}
      <mesh position={[-1.02, 1.34, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 0.34, 12]} />
        <meshStandardMaterial color="#33383e" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[-1.02, 1.4, 0]}>
        <cylinderGeometry args={[0.115, 0.115, 0.1, 12]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={glow ? 0.5 : 0.25} roughness={0.5} />
      </mesh>

      {/* Stacked shipping containers amidships */}
      {[0.0, 0.42, 0.84].map((x, row) =>
        [0, 1].map((layer) => (
          <mesh key={`${x}-${layer}`} position={[x, 0.62 + layer * 0.24, layer % 2 ? 0.18 : -0.18]} castShadow>
            <boxGeometry args={[0.36, 0.22, 0.34]} />
            <meshStandardMaterial color={CONTAINER_COLORS[(row * 2 + layer) % CONTAINER_COLORS.length]} roughness={0.7} />
          </mesh>
        ))
      )}

      {/* Foremast with the bias lamp on top */}
      <mesh position={[0.6, 0.85, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.75, 6]} />
        <meshStandardMaterial color="#2a2119" roughness={0.8} />
      </mesh>
      <BiasLamp position={[0.6, 1.28, 0]} color={accentColor} radius={0.085} />

      <CityLabel y={1.75} label={label} sublabel={sublabel} accent={accentColor} emphasized={glow} />
    </group>
  );
}
