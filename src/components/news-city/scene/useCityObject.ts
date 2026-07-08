"use client";

import { useCallback, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import type { Group, Mesh, MeshBasicMaterial } from "three";

/**
 * Shared hover/click behaviour for every clickable object in the hub (nodes,
 * the core): a gentle scale-up on hover/active, a pointer cursor, a slow idle
 * bob so objects read as "alive" even before you touch them, and a pulsing
 * ground ring that hints "this is clickable" without needing a hover.
 */
export function useCityObject(active: boolean, onSelect: () => void) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<Group>(null);
  const ringRef = useRef<Mesh>(null);
  // Random phase so objects don't all bob/pulse in lockstep. Lazily
  // initialized on first animation frame (outside React's render phase) so
  // the impure Math.random() call never runs during render.
  const phaseRef = useRef<number | null>(null);

  useFrame((state, delta) => {
    if (phaseRef.current === null) phaseRef.current = Math.random() * Math.PI * 2;
    const t = state.clock.elapsedTime + phaseRef.current;
    const g = groupRef.current;
    if (g) {
      const targetXZ = hovered || active ? 1.1 : 1;
      const targetY = hovered || active ? 1.06 : 1;
      const k = Math.min(delta * 8, 1);
      g.scale.x += (targetXZ - g.scale.x) * k;
      g.scale.z += (targetXZ - g.scale.z) * k;
      g.scale.y += (targetY - g.scale.y) * k;
      // Subtle idle bob so the city feels alive at rest.
      g.position.y = Math.sin(t * 1.4) * 0.035;
    }
    if (ringRef.current) {
      const pulse = (Math.sin(t * 1.8) + 1) / 2; // 0..1
      const s = 1 + pulse * 0.4;
      ringRef.current.scale.set(s, s, s);
      const mat = ringRef.current.material as MeshBasicMaterial;
      mat.opacity = hovered || active ? 0 : 0.45 - pulse * 0.25;
    }
  });

  const onPointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = "pointer";
  }, []);

  const onPointerOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = "auto";
  }, []);

  const onClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onSelect();
    },
    [onSelect]
  );

  return { groupRef, ringRef, hovered, onPointerOver, onPointerOut, onClick };
}
