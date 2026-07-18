"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import { useCityObject } from "./useCityObject";
import { ClickHintRing } from "./ClickHintRing";
import { CityLabel } from "./CityLabel";

/**
 * A category node — one of the intelligence hub's five information sources
 * (Macro, Central Banks, Commodities, Earnings, Nasdaq/ES). A levitating
 * energy core inside a spinning containment ring, wrapped in a faint
 * holographic wireframe shell, on a small pedestal. The stronger the
 * category's current activity (`intensity` 0..1), the bigger the core, the
 * brighter the glow, and the faster the ring spins.
 */
export function CategoryNode({
  position,
  color,
  intensity,
  label,
  sublabel,
  active,
  onSelect,
}: {
  position: [number, number, number];
  color: string;
  /** 0..1 — how much activity this category is putting into the market right now. */
  intensity: number;
  label: string;
  sublabel?: string;
  active: boolean;
  onSelect: () => void;
}) {
  const { groupRef, ringRef, hovered, onPointerOver, onPointerOut, onClick } = useCityObject(active, onSelect);
  const glow = hovered || active;

  const containment = useRef<Mesh>(null);
  const shellRef = useRef<Mesh>(null);
  const coreRef = useRef<Mesh>(null);
  const coreR = 0.36 + intensity * 0.22;

  useFrame((state, delta) => {
    if (containment.current) {
      containment.current.rotation.y += delta * (0.5 + intensity * 1.4);
      containment.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.6) * 0.25;
    }
    if (shellRef.current) {
      shellRef.current.rotation.y -= delta * 0.18;
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
      <ClickHintRing ringRef={ringRef} radius={1.6} color={color} />

      {/* Invisible, generous hit-area so the entire node — core, ring, shell and
          the space between them — is a single reliable click target. Without it,
          raycasts slip between the thin ring/wireframe geometry and the click
          is lost. */}
      <mesh position={[0, 1.05, 0]}>
        <sphereGeometry args={[1.5, 16, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Pedestal */}
      <mesh position={[0, 0.09, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.58, 0.7, 0.16, 40]} />
        <meshStandardMaterial color="#141b26" roughness={0.35} metalness={0.6} emissive="#1b2532" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0.19, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.5, 40]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} toneMapped={false} />
      </mesh>

      {/* Levitating energy core */}
      <mesh ref={coreRef} position={[0, 1.05, 0]} castShadow>
        <sphereGeometry args={[coreR, 26, 20]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={glow ? 2 : 1.2 + intensity * 0.6}
          roughness={0.3}
          metalness={0.2}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <sphereGeometry args={[coreR * 1.7, 18, 14]} />
        <meshBasicMaterial color={color} transparent opacity={0.1 + intensity * 0.08} toneMapped={false} depthWrite={false} />
      </mesh>
      <pointLight position={[0, 1.05, 0]} color={color} intensity={0.6 + intensity * 0.6} distance={5} decay={2} />

      {/* Spinning containment ring */}
      <mesh ref={containment} position={[0, 1.05, 0]}>
        <torusGeometry args={[0.74, 0.038, 10, 48]} />
        <meshStandardMaterial color="#2c3948" roughness={0.3} metalness={0.6} emissive={color} emissiveIntensity={0.8} toneMapped={false} />
      </mesh>

      {/* Faint holographic wireframe shell */}
      <mesh ref={shellRef} position={[0, 1.05, 0]}>
        <icosahedronGeometry args={[1.04, 1]} />
        <meshBasicMaterial color="#7fd4ea" wireframe transparent opacity={glow ? 0.35 : 0.2} toneMapped={false} depthWrite={false} />
      </mesh>

      <CityLabel y={2.35} label={label} sublabel={sublabel} accent={color} emphasized={glow} />
    </group>
  );
}
