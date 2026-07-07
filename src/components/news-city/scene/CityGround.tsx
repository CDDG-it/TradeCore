"use client";

import { Html } from "@react-three/drei";
import { Tree } from "./Tree";

const DISTRICTS: { center: [number, number]; radius: number; color: string; label: string; plaza: string | null }[] = [
  { center: [-6.5, -6.5], radius: 3.6, color: "#e8862e", label: "Central Bank District", plaza: "#d2cab6" },
  { center: [6.5, -6.5], radius: 3.6, color: "#3aa0c9", label: "Commodity Harbor", plaza: null },
  { center: [0, 6.8], radius: 4.2, color: "#c9573a", label: "Macro Battlefield", plaza: "#c8b48c" },
  { center: [0, 0], radius: 3.2, color: "#e0533d", label: "Nasdaq / ES HQ", plaza: "#cfc7b6" },
];

// Roads run from the central roundabout out to each district plaza.
const ROADS: [[number, number], [number, number]][] = [
  [[0, 0], [-6.5, -6.5]],
  [[0, 0], [6.5, -6.5]],
  [[0, 0], [0, 6.8]],
];

// Trees scattered through the parkland between districts.
const TREES: [number, number, number][] = [
  [-11, -1, 1.05], [-11, 3, 0.9], [-9.2, 4.4, 1.1], [11, -1, 1.0], [11, 3, 0.95],
  [10, 4.6, 1.1], [-4.2, 3.8, 0.85], [4.2, 3.8, 0.9], [-5.4, 10, 1.15], [5.4, 10, 1.0],
  [-9.4, 9, 1.1], [9.4, 9, 1.05], [0, -10.2, 1.0], [-2.6, -11, 0.9], [2.6, -11, 0.95],
  [-12, -6, 1.1], [12, -6, 1.05],
];

function Road({ from, to, width = 1.15 }: { from: [number, number]; to: [number, number]; width?: number }) {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const len = Math.hypot(dx, dz) + width * 0.5;
  const angle = Math.atan2(dx, dz);
  const mid: [number, number, number] = [(from[0] + to[0]) / 2, 0.02, (from[1] + to[1]) / 2];
  const dashes = Math.max(2, Math.round(len / 0.9));
  return (
    <group position={mid} rotation={[0, angle, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, len]} />
        <meshStandardMaterial color="#5a5f67" roughness={0.95} metalness={0.05} />
      </mesh>
      {Array.from({ length: dashes }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, -len / 2 + (len / dashes) * (i + 0.5)]}>
          <planeGeometry args={[0.06, len / dashes / 2]} />
          <meshStandardMaterial color="#e6d59a" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

export function CityGround() {
  return (
    <group>
      {/* Grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
        <planeGeometry args={[44, 44]} />
        <meshStandardMaterial color="#7f9e55" roughness={1} metalness={0} />
      </mesh>

      {/* Central roundabout */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[2.9, 3.7, 48]} />
        <meshStandardMaterial color="#5a5f67" roughness={0.95} />
      </mesh>

      {ROADS.map((r, i) => (
        <Road key={i} from={r[0]} to={r[1]} />
      ))}

      {/* District plazas + labels */}
      {DISTRICTS.map((d) => (
        <group key={d.label}>
          {d.plaza && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[d.center[0], 0.008, d.center[1]]} receiveShadow>
              <circleGeometry args={[d.radius, 48]} />
              <meshStandardMaterial color={d.plaza} roughness={0.9} />
            </mesh>
          )}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[d.center[0], 0.012, d.center[1]]}>
            <ringGeometry args={[d.radius - 0.12, d.radius, 48]} />
            <meshStandardMaterial color={d.color} transparent opacity={0.5} />
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

      {/* Parkland trees */}
      {TREES.map(([x, z, s], i) => (
        <Tree key={i} position={[x, 0, z]} scale={s} tone={i % 3 === 0 ? "#568f45" : i % 3 === 1 ? "#4f8b52" : "#639a4a"} />
      ))}
    </group>
  );
}
