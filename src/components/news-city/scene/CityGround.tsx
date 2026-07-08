"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Group } from "three";

/**
 * The cyber intelligence deck: a levitating dark platform with a glowing
 * radar grid, luminous district halos, an orange rim light, and slow-drifting
 * data particles in the air — the brand's cyber-holographic theme (deep navy
 * with orange + ice-blue light), matching the rest of the site's palette.
 */

const DISTRICTS: { center: [number, number]; radius: number; color: string; label: string }[] = [
  { center: [-8.4, -8.4], radius: 3.9, color: "#f9a15c", label: "Central Bank District" },
  { center: [8.4, -7.8], radius: 3.9, color: "#5fc0d8", label: "Commodity Harbor" },
  { center: [-8.4, 7.8], radius: 3.9, color: "#e0705c", label: "Macro Intelligence Zone" },
  { center: [8.4, 7.8], radius: 3.9, color: "#f97316", label: "Nasdaq / ES HQ" },
];

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
      const r = 4 + rand() * 14;
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

export function CityGround() {
  return (
    <group>
      {/* Levitating platform deck */}
      <mesh position={[0, -0.31, 0]} receiveShadow>
        <cylinderGeometry args={[17.6, 16.0, 0.62, 96]} />
        <meshStandardMaterial color="#151c29" roughness={0.35} metalness={0.6} />
      </mesh>
      {/* Lower hull segment */}
      <mesh position={[0, -0.78, 0]}>
        <cylinderGeometry args={[15.1, 13.2, 0.34, 96]} />
        <meshStandardMaterial color="#101623" roughness={0.4} metalness={0.55} />
      </mesh>
      {/* Brand-orange rim light plus an ice underline */}
      <mesh position={[0, -0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[17.5, 0.038, 8, 96]} />
        <meshBasicMaterial color="#f97316" transparent opacity={0.75} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[15.0, 0.028, 8, 96]} />
        <meshBasicMaterial color="#5fc0d8" transparent opacity={0.45} toneMapped={false} />
      </mesh>
      {/* Radar-style polar grid */}
      <polarGridHelper args={[17.3, 16, 8, 64, "#35486a", "#22304a"]} position={[0, 0.012, 0]} />

      {/* Ambient data particles — orange + ice */}
      <DataParticles count={140} color="#f9a15c" seed={7} />
      <DataParticles count={120} color="#7fd4ea" seed={31} size={0.05} />

      {/* District halo rings + labels */}
      {DISTRICTS.map((d) => (
        <group key={d.label}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[d.center[0], 0.015, d.center[1]]}>
            <ringGeometry args={[d.radius - 0.06, d.radius, 64]} />
            <meshBasicMaterial color={d.color} transparent opacity={0.6} toneMapped={false} depthWrite={false} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[d.center[0], 0.013, d.center[1]]}>
            <circleGeometry args={[d.radius, 64]} />
            <meshBasicMaterial color={d.color} transparent opacity={0.05} toneMapped={false} depthWrite={false} />
          </mesh>
          <Html
            position={[d.center[0], 0.02, d.center[1] - d.radius + 0.3]}
            center
            distanceFactor={13}
            occlude={false}
            zIndexRange={[1, 0]}
          >
            <p
              className="pointer-events-none select-none whitespace-nowrap font-heading text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: d.color, textShadow: `0 0 14px ${d.color}99` }}
            >
              {d.label}
            </p>
          </Html>
        </group>
      ))}
    </group>
  );
}
