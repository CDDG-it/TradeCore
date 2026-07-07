"use client";

import { useCallback, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import type { Group } from "three";

/**
 * Shared hover/click behaviour for every clickable object in the city (towers,
 * ships, tanks): a gentle scale-up on hover/active, a pointer cursor, and a
 * single onSelect callback. Kept as one hook so every location "feels" the
 * same to interact with.
 */
export function useCityObject(active: boolean, onSelect: () => void) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const targetXZ = hovered || active ? 1.08 : 1;
    const targetY = hovered || active ? 1.05 : 1;
    const k = Math.min(delta * 8, 1);
    g.scale.x += (targetXZ - g.scale.x) * k;
    g.scale.z += (targetXZ - g.scale.z) * k;
    g.scale.y += (targetY - g.scale.y) * k;
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

  return { groupRef, hovered, onPointerOver, onPointerOut, onClick };
}
