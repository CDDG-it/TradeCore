"use client";

import { Html } from "@react-three/drei";

const DISTRICTS: { center: [number, number]; radius: number; color: string; label: string }[] = [
  { center: [-6.5, -6.5], radius: 3.6, color: "#e8862e", label: "Central Bank District" },
  { center: [6.5, -6.5], radius: 3.6, color: "#3aa0c9", label: "Commodity Harbor" },
  { center: [0, 6.8], radius: 4.2, color: "#c9573a", label: "Macro Battlefield" },
  { center: [0, 0], radius: 3.2, color: "#e0533d", label: "Nasdaq / ES HQ" },
];

export function CityGround() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#eeeae1" roughness={0.95} metalness={0.02} />
      </mesh>
      <gridHelper args={[40, 40, "#d8d0c0", "#e2dccf"]} position={[0, 0, 0]} />

      {DISTRICTS.map((d) => (
        <group key={d.label}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[d.center[0], 0.005, d.center[1]]}>
            <circleGeometry args={[d.radius, 48]} />
            <meshStandardMaterial color={d.color} transparent opacity={0.1} />
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
              style={{ color: d.color }}
            >
              {d.label}
            </p>
          </Html>
        </group>
      ))}
    </group>
  );
}
