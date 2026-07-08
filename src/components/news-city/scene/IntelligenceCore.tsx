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
 * The Market Intelligence Core — the brain of the hub. A levitating
 * holographic globe with two counter-rotating gyroscope rings, glowing in
 * the current sentiment colour. Every category node's data stream flows
 * into it.
 */
export function IntelligenceCore({
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
      <ClickHintRing ringRef={ringRef} radius={1.9} color={sentiment.hex} />

      {/* Pedestal */}
      <mesh position={[0, 0.09, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.0, 1.2, 0.18, 48]} />
        <meshStandardMaterial color="#141b26" roughness={0.35} metalness={0.6} emissive="#1b2532" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.72, 0.82, 48]} />
        <meshBasicMaterial color="#14B8A6" transparent opacity={0.75} toneMapped={false} />
      </mesh>

      {/* Levitating holographic globe: glowing core inside a wireframe shell */}
      <mesh ref={coreRef} position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.38, 28, 20]} />
        <meshStandardMaterial
          color={sentiment.hex}
          emissive={sentiment.hex}
          emissiveIntensity={glow ? 1.7 : 1.2}
          roughness={0.3}
          metalness={0.2}
          toneMapped={false}
        />
      </mesh>
      {/* Wireframe globe shell — latitude/longitude hologram */}
      <mesh position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.58, 22, 14]} />
        <meshBasicMaterial color="#7fd4ea" wireframe transparent opacity={glow ? 0.55 : 0.4} toneMapped={false} depthWrite={false} />
      </mesh>
      {/* Halo */}
      <mesh position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.72, 24, 18]} />
        <meshBasicMaterial color={sentiment.hex} transparent opacity={0.1} toneMapped={false} depthWrite={false} />
      </mesh>
      <pointLight position={[0, 1.55, 0]} color={sentiment.hex} intensity={1.1} distance={8} decay={2} />

      {/* Counter-rotating gyroscope rings */}
      <mesh ref={gyroA} position={[0, 1.55, 0]}>
        <torusGeometry args={[0.84, 0.022, 8, 64]} />
        <meshStandardMaterial color="#2c3948" roughness={0.3} metalness={0.6} emissive="#14B8A6" emissiveIntensity={0.9} toneMapped={false} />
      </mesh>
      <mesh ref={gyroB} position={[0, 1.55, 0]} rotation={[Math.PI / 3, 0, Math.PI / 5]}>
        <torusGeometry args={[1.02, 0.018, 8, 64]} />
        <meshStandardMaterial color="#2c3948" roughness={0.3} metalness={0.6} emissive="#5fc0d8" emissiveIntensity={0.9} toneMapped={false} />
      </mesh>

      <CityLabel
        y={2.75}
        label="Market Intelligence Core"
        sublabel={`${sentiment.label} · Risk ${risk.label}`}
        accent={sentiment.hex}
        emphasized={glow}
      />
    </group>
  );
}
