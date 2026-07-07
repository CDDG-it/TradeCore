"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";

/**
 * A glowing status light in the object's bias colour (green / amber / red),
 * placed on top of every building, ship, and tank. `toneMapped={false}` keeps
 * the emissive colour pure and bright so it reads as a real lamp against the
 * light scene, with a soft halo and a small point light for local glow.
 */
export function BiasLamp({
  position,
  color,
  radius = 0.11,
}: {
  position: [number, number, number];
  color: string;
  radius?: number;
}) {
  const coreRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (!coreRef.current) return;
    // Gentle beacon-style pulse.
    const s = 1 + Math.sin(state.clock.elapsedTime * 2.6) * 0.14;
    coreRef.current.scale.setScalar(s);
  });

  return (
    <group position={position}>
      <mesh ref={coreRef}>
        <sphereGeometry args={[radius, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
      {/* Soft halo */}
      <mesh>
        <sphereGeometry args={[radius * 1.9, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.16} depthWrite={false} toneMapped={false} />
      </mesh>
      <pointLight color={color} intensity={0.5} distance={2.6} decay={2} />
    </group>
  );
}
