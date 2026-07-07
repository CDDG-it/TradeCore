"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Mesh } from "three";

/**
 * The city floor is a dark reflective deck with a faint holographic grid —
 * a trading-terminal "digital twin", not a natural landscape. Districts are
 * marked by thin glowing rings, and animated light pulses travel along data
 * conduits between the HQ and each district.
 */

const DISTRICTS: { center: [number, number]; radius: number; color: string; label: string }[] = [
  { center: [-6.5, -6.5], radius: 3.4, color: "#f0954f", label: "Central Bank District" },
  { center: [6.5, -6.5], radius: 3.4, color: "#5fc0d8", label: "Commodity Harbor" },
  { center: [0, 6.8], radius: 3.8, color: "#e0705c", label: "Macro Battlefield" },
  { center: [0, 0], radius: 3.0, color: "#f97316", label: "Nasdaq / ES HQ" },
];

const CONDUITS: [[number, number], [number, number]][] = [
  [[0, 0], [-6.5, -6.5]],
  [[0, 0], [6.5, -6.5]],
  [[0, 0], [0, 6.8]],
];

/** A thin glowing line on the deck with a light pulse travelling along it. */
function Conduit({ from, to, phase }: { from: [number, number]; to: [number, number]; phase: number }) {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const len = Math.hypot(dx, dz);
  const angle = Math.atan2(dx, dz);
  const pulseRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (!pulseRef.current) return;
    const t = (state.clock.elapsedTime * 0.22 + phase) % 1;
    pulseRef.current.position.set(from[0] + dx * t, 0.06, from[1] + dz * t);
  });

  return (
    <group>
      <group position={[(from[0] + to[0]) / 2, 0.03, (from[1] + to[1]) / 2]} rotation={[0, angle, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.05, len]} />
          <meshBasicMaterial color="#f97316" transparent opacity={0.35} toneMapped={false} depthWrite={false} />
        </mesh>
      </group>
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshBasicMaterial color="#ffb673" toneMapped={false} />
      </mesh>
    </group>
  );
}

export function CityGround() {
  return (
    <group>
      {/* Reflective deck */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
        <planeGeometry args={[46, 46]} />
        <meshStandardMaterial color="#0d1015" roughness={0.35} metalness={0.65} />
      </mesh>
      {/* Holographic grid */}
      <gridHelper args={[46, 46, "#232a35", "#151a22"]} position={[0, 0.002, 0]} />

      {CONDUITS.map((c, i) => (
        <Conduit key={i} from={c[0]} to={c[1]} phase={i * 0.33} />
      ))}

      {/* District halo rings + labels */}
      {DISTRICTS.map((d) => (
        <group key={d.label}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[d.center[0], 0.015, d.center[1]]}>
            <ringGeometry args={[d.radius - 0.06, d.radius, 64]} />
            <meshBasicMaterial color={d.color} transparent opacity={0.55} toneMapped={false} depthWrite={false} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[d.center[0], 0.012, d.center[1]]}>
            <circleGeometry args={[d.radius, 64]} />
            <meshBasicMaterial color={d.color} transparent opacity={0.045} toneMapped={false} depthWrite={false} />
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
              style={{ color: d.color, textShadow: `0 0 12px ${d.color}66` }}
            >
              {d.label}
            </p>
          </Html>
        </group>
      ))}
    </group>
  );
}
