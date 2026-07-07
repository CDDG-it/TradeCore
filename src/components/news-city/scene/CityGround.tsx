"use client";

import { Html } from "@react-three/drei";

/**
 * Market City floats on a levitating intelligence platform — a circular deck
 * with a radar-style polar grid, district halo rings, and open atmosphere all
 * around. A soft shadow far below sells the sense of altitude.
 */

const DISTRICTS: { center: [number, number]; radius: number; color: string; label: string }[] = [
  { center: [-6.5, -6.5], radius: 3.4, color: "#d97a2e", label: "Central Bank District" },
  { center: [6.5, -6.2], radius: 3.4, color: "#2b93b4", label: "Commodity Harbor" },
  { center: [-6.4, 6.2], radius: 3.4, color: "#c9573a", label: "Macro Intelligence Zone" },
  { center: [6.5, 6.2], radius: 3.4, color: "#f97316", label: "Nasdaq / ES HQ" },
];

export function CityGround() {
  return (
    <group>
      {/* Levitating platform deck */}
      <mesh position={[0, -0.31, 0]} receiveShadow>
        <cylinderGeometry args={[15.4, 14.0, 0.62, 96]} />
        <meshStandardMaterial color="#e2e8ee" roughness={0.55} metalness={0.08} />
      </mesh>
      {/* Lower hull segment — gives the platform techy depth from the side */}
      <mesh position={[0, -0.78, 0]}>
        <cylinderGeometry args={[13.2, 11.6, 0.34, 96]} />
        <meshStandardMaterial color="#c8d1da" roughness={0.6} metalness={0.12} />
      </mesh>
      {/* Accent edge light around the rim */}
      <mesh position={[0, -0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[15.32, 0.03, 8, 96]} />
        <meshBasicMaterial color="#2b93b4" transparent opacity={0.5} toneMapped={false} />
      </mesh>
      {/* Radar-style polar grid on the deck */}
      <polarGridHelper args={[15.1, 16, 8, 64, "#c0cad4", "#d6dde5"]} position={[0, 0.012, 0]} />

      {/* Soft drop shadow far below — the platform is airborne */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.4, 0]}>
        <circleGeometry args={[12.5, 48]} />
        <meshBasicMaterial color="#334155" transparent opacity={0.07} depthWrite={false} />
      </mesh>

      {/* District halo rings + labels */}
      {DISTRICTS.map((d) => (
        <group key={d.label}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[d.center[0], 0.015, d.center[1]]}>
            <ringGeometry args={[d.radius - 0.06, d.radius, 64]} />
            <meshBasicMaterial color={d.color} transparent opacity={0.5} toneMapped={false} depthWrite={false} />
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
              style={{ color: d.color, textShadow: "0 1px 2px rgba(255,255,255,0.7)" }}
            >
              {d.label}
            </p>
          </Html>
        </group>
      ))}
    </group>
  );
}
