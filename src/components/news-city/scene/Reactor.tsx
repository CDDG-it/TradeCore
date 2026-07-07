"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import { useCityObject } from "./useCityObject";
import { ClickHintRing } from "./ClickHintRing";
import { CityLabel } from "./CityLabel";

/**
 * A macro-force reactor: a levitating energy core inside a spinning
 * containment ring on a small pedestal. The stronger the macro force
 * (`intensity` 0..1), the bigger the core, the brighter the glow, and the
 * faster the ring spins — scientific instrument, not military hardware.
 */
export function Reactor({
  position,
  accentColor,
  intensity,
  label,
  sublabel,
  active,
  onSelect,
}: {
  position: [number, number, number];
  accentColor: string;
  /** 0..1 — how much energy this force is putting into the market. */
  intensity: number;
  label: string;
  sublabel?: string;
  active: boolean;
  onSelect: () => void;
}) {
  const { groupRef, ringRef, hovered, onPointerOver, onPointerOut, onClick } = useCityObject(active, onSelect);
  const glow = hovered || active;

  const containment = useRef<Mesh>(null);
  const coreRef = useRef<Mesh>(null);
  const coreR = 0.16 + intensity * 0.14;

  useFrame((state, delta) => {
    if (containment.current) {
      containment.current.rotation.y += delta * (0.5 + intensity * 1.4);
      containment.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.6) * 0.25;
    }
    if (coreRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * (2 + intensity * 3)) * (0.05 + intensity * 0.09);
      coreRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      <ClickHintRing ringRef={ringRef} radius={0.95} color={accentColor} />

      {/* Pedestal */}
      <mesh position={[0, 0.07, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.42, 0.52, 0.14, 32]} />
        <meshStandardMaterial color="#141b26" roughness={0.35} metalness={0.6} emissive="#1b2532" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.36, 32]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.55} toneMapped={false} />
      </mesh>

      {/* Levitating energy core */}
      <mesh ref={coreRef} position={[0, 0.78, 0]} castShadow>
        <sphereGeometry args={[coreR, 24, 18]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={glow ? 2 : 1.2 + intensity * 0.6}
          roughness={0.3}
          metalness={0.2}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.78, 0]}>
        <sphereGeometry args={[coreR * 1.7, 18, 14]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.1 + intensity * 0.08} toneMapped={false} depthWrite={false} />
      </mesh>
      <pointLight position={[0, 0.78, 0]} color={accentColor} intensity={0.4 + intensity * 0.5} distance={3.2} decay={2} />

      {/* Spinning containment ring */}
      <mesh ref={containment} position={[0, 0.78, 0]}>
        <torusGeometry args={[0.42, 0.028, 10, 48]} />
        <meshStandardMaterial color="#2c3948" roughness={0.3} metalness={0.6} emissive={accentColor} emissiveIntensity={0.8} toneMapped={false} />
      </mesh>

      <CityLabel y={1.55} label={label} sublabel={sublabel} accent={accentColor} emphasized={glow} />
    </group>
  );
}
