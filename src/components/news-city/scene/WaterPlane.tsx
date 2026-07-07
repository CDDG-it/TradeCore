"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import "./WaterMaterial";
import type { ShaderMaterial } from "three";

export function WaterPlane({ position, size = 5.6 }: { position: [number, number, number]; size?: number }) {
  const matRef = useRef<ShaderMaterial & { uTime: number }>(null);

  useFrame((_, delta) => {
    if (matRef.current) matRef.current.uTime += delta;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={position} receiveShadow>
      <planeGeometry args={[size, size, 48, 48]} />
      <waterMaterial ref={matRef} transparent />
    </mesh>
  );
}
