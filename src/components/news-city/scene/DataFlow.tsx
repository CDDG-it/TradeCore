"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";

/**
 * A curved, glowing information pathway between a category node and the
 * Market Intelligence Core, with light pulses travelling along it — how
 * each signal source feeds the core in real time.
 */
export function DataFlow({
  from,
  to,
  color,
  lift = 1.6,
  speed = 0.16,
  pulses = 2,
}: {
  from: [number, number];
  to: [number, number];
  color: string;
  lift?: number;
  speed?: number;
  pulses?: number;
}) {
  const curve = useMemo(
    () =>
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(from[0], 0.12, from[1]),
        new THREE.Vector3((from[0] + to[0]) / 2, lift, (from[1] + to[1]) / 2),
        new THREE.Vector3(to[0], 0.12, to[1])
      ),
    [from, to, lift]
  );

  const pulseRefs = useRef<(Mesh | null)[]>([]);

  useFrame((state) => {
    for (let i = 0; i < pulses; i++) {
      const m = pulseRefs.current[i];
      if (!m) continue;
      const t = (state.clock.elapsedTime * speed + i / pulses) % 1;
      const p = curve.getPoint(t);
      m.position.copy(p);
      // Fade in/out at the ends so pulses don't pop.
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.sin(Math.PI * t) * 0.95;
    }
  });

  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 48, 0.014, 8, false]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} toneMapped={false} depthWrite={false} />
      </mesh>
      {Array.from({ length: pulses }).map((_, i) => (
        <mesh key={i} ref={(el) => { pulseRefs.current[i] = el; }}>
          <sphereGeometry args={[0.075, 10, 10]} />
          <meshBasicMaterial color={color} transparent toneMapped={false} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
