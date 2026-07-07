"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import { useCityObject } from "./useCityObject";
import { ClickHintRing } from "./ClickHintRing";
import { CityLabel } from "./CityLabel";
import { SENTIMENT_META, RISK_META } from "@/lib/news-city/ui";
import type { CityOverview } from "@/lib/news-city/types";

/**
 * The Market Core — the brain of Market City. A levitating arc-reactor style
 * sphere with two counter-rotating gyroscope rings, glowing in the current
 * sentiment colour. Every district's data stream flows into or out of it.
 */
export function MarketCore({
  overview,
  active,
  onSelect,
}: {
  overview: CityOverview;
  active: boolean;
  onSelect: () => void;
}) {
  const { groupRef, ringRef, hovered, onPointerOver, onPointerOut, onClick } = useCityObject(active, onSelect);
  const glow = hovered || active;
  const sentiment = SENTIMENT_META[overview.sentiment];
  const risk = RISK_META[overview.riskLevel];

  const gyroA = useRef<Mesh>(null);
  const gyroB = useRef<Mesh>(null);
  const coreRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (gyroA.current) {
      gyroA.current.rotation.x += delta * 0.5;
      gyroA.current.rotation.y += delta * 0.32;
    }
    if (gyroB.current) {
      gyroB.current.rotation.z -= delta * 0.42;
      gyroB.current.rotation.y -= delta * 0.26;
    }
    if (coreRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.1) * 0.06;
      coreRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group
      ref={groupRef}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      <ClickHintRing ringRef={ringRef} radius={1.6} color={sentiment.hex} />

      {/* Pedestal */}
      <mesh position={[0, 0.09, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.85, 1.05, 0.18, 48]} />
        <meshStandardMaterial color="#dde3e9" roughness={0.45} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.62, 0.7, 48]} />
        <meshBasicMaterial color="#f97316" transparent opacity={0.65} toneMapped={false} />
      </mesh>

      {/* Levitating core sphere */}
      <mesh ref={coreRef} position={[0, 1.35, 0]} castShadow>
        <sphereGeometry args={[0.42, 32, 24]} />
        <meshStandardMaterial
          color={sentiment.hex}
          emissive={sentiment.hex}
          emissiveIntensity={glow ? 1.6 : 1.1}
          roughness={0.3}
          metalness={0.2}
          toneMapped={false}
        />
      </mesh>
      {/* Halo */}
      <mesh position={[0, 1.35, 0]}>
        <sphereGeometry args={[0.58, 24, 18]} />
        <meshBasicMaterial color={sentiment.hex} transparent opacity={0.12} toneMapped={false} depthWrite={false} />
      </mesh>
      <pointLight position={[0, 1.35, 0]} color={sentiment.hex} intensity={0.9} distance={6} decay={2} />

      {/* Counter-rotating gyroscope rings */}
      <mesh ref={gyroA} position={[0, 1.35, 0]}>
        <torusGeometry args={[0.72, 0.02, 8, 64]} />
        <meshStandardMaterial color="#aab6c2" roughness={0.3} metalness={0.6} emissive="#f97316" emissiveIntensity={0.25} />
      </mesh>
      <mesh ref={gyroB} position={[0, 1.35, 0]} rotation={[Math.PI / 3, 0, Math.PI / 5]}>
        <torusGeometry args={[0.88, 0.016, 8, 64]} />
        <meshStandardMaterial color="#aab6c2" roughness={0.3} metalness={0.6} emissive="#2b93b4" emissiveIntensity={0.3} />
      </mesh>

      <CityLabel
        y={2.45}
        label="Market Core"
        sublabel={`${sentiment.label} · Risk ${risk.label}`}
        accent={sentiment.hex}
        emphasized={glow}
      />
    </group>
  );
}
