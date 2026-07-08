"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

/**
 * The hub's HUD floor: a levitating dark platform with a glowing radar grid,
 * an orange rim light, an ice-blue underline, and slow-drifting data
 * particles in the air — the brand's cyber-holographic theme (deep navy with
 * orange + ice-blue light), matching the rest of the site's palette. Pure
 * ambient backdrop for the intelligence hub — no fixed districts or labels.
 */

/** Slow-drifting luminous specks — ambient market data in the air. */
function DataParticles({ count, color, seed, size = 0.055 }: { count: number; color: string; seed: number; size?: number }) {
  const ref = useRef<Group>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    let s = seed;
    const rand = () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return (s % 10000) / 10000;
    };
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2;
      const r = 2 + rand() * 12;
      arr[i * 3] = Math.cos(a) * r;
      arr[i * 3 + 1] = 0.5 + rand() * 7;
      arr[i * 3 + 2] = Math.sin(a) * r;
    }
    return arr;
  }, [count, seed]);

  useFrame((state, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.012;
  });

  return (
    <group ref={ref}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={size} color={color} transparent opacity={0.45} sizeAttenuation depthWrite={false} />
      </points>
    </group>
  );
}

export function IntelligenceGrid() {
  return (
    <group>
      {/* Levitating platform deck */}
      <mesh position={[0, -0.31, 0]} receiveShadow>
        <cylinderGeometry args={[13.6, 12.4, 0.62, 96]} />
        <meshStandardMaterial color="#151c29" roughness={0.35} metalness={0.6} />
      </mesh>
      {/* Lower hull segment */}
      <mesh position={[0, -0.78, 0]}>
        <cylinderGeometry args={[11.7, 10.2, 0.34, 96]} />
        <meshStandardMaterial color="#101623" roughness={0.4} metalness={0.55} />
      </mesh>
      {/* Brand-orange rim light plus an ice underline */}
      <mesh position={[0, -0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[13.5, 0.038, 8, 96]} />
        <meshBasicMaterial color="#f97316" transparent opacity={0.75} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[11.6, 0.028, 8, 96]} />
        <meshBasicMaterial color="#5fc0d8" transparent opacity={0.45} toneMapped={false} />
      </mesh>
      {/* Radar-style polar grid */}
      <polarGridHelper args={[13.3, 16, 8, 64, "#35486a", "#22304a"]} position={[0, 0.012, 0]} />

      {/* Ambient data particles — orange + ice */}
      <DataParticles count={140} color="#f9a15c" seed={7} />
      <DataParticles count={120} color="#7fd4ea" seed={31} size={0.05} />
    </group>
  );
}
