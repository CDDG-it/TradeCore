"use client";

import type { RefObject } from "react";
import type { Mesh } from "three";

/** A slowly pulsing ring on the ground under a clickable object — makes
 *  "this is interactive" obvious at a glance, before the user ever hovers. */
export function ClickHintRing({
  ringRef,
  radius,
  color,
}: {
  ringRef: RefObject<Mesh | null>;
  radius: number;
  color: string;
}) {
  return (
    <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
      <ringGeometry args={[radius * 0.82, radius, 40]} />
      <meshBasicMaterial color={color} transparent opacity={0.3} depthWrite={false} />
    </mesh>
  );
}
