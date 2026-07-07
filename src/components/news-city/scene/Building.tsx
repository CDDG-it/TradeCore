"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useCityObject } from "./useCityObject";
import { ClickHintRing } from "./ClickHintRing";
import { CityLabel } from "./CityLabel";
import { getFacadeTexture } from "./buildingTexture";

export function Building({
  position,
  width = 1.5,
  depth = 1.5,
  height,
  color,
  accentColor,
  label,
  sublabel,
  active,
  onSelect,
}: {
  position: [number, number, number];
  width?: number;
  depth?: number;
  height: number;
  color: string;
  accentColor: string;
  label: string;
  sublabel?: string;
  active: boolean;
  onSelect: () => void;
}) {
  const { groupRef, ringRef, hovered, onPointerOver, onPointerOut, onClick } = useCityObject(active, onSelect);
  const glow = hovered || active;

  const facade = useMemo(() => {
    const tex = getFacadeTexture(color, accentColor);
    tex.repeat.set(1, height / 2.6);
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, [color, accentColor, height]);

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      <ClickHintRing ringRef={ringRef} radius={Math.max(width, depth) * 0.85} color={accentColor} />

      {/* Plinth / base — gives the tower a footing instead of floating on the ground. */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[width * 1.18, 0.12, depth * 1.18]} />
        <meshStandardMaterial color="#2a241c" roughness={0.85} />
      </mesh>

      {/* Facade — 4 side faces get the windowed texture; top/bottom stay plain. */}
      <mesh position={[0, height / 2 + 0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial attach="material-0" map={facade} color="#ffffff" emissive={accentColor} emissiveMap={facade} emissiveIntensity={glow ? 0.6 : 0.28} roughness={0.55} metalness={0.15} />
        <meshStandardMaterial attach="material-1" map={facade} color="#ffffff" emissive={accentColor} emissiveMap={facade} emissiveIntensity={glow ? 0.6 : 0.28} roughness={0.55} metalness={0.15} />
        <meshStandardMaterial attach="material-2" color={color} roughness={0.6} metalness={0.2} />
        <meshStandardMaterial attach="material-3" color={color} roughness={0.6} metalness={0.2} />
        <meshStandardMaterial attach="material-4" map={facade} color="#ffffff" emissive={accentColor} emissiveMap={facade} emissiveIntensity={glow ? 0.6 : 0.28} roughness={0.55} metalness={0.15} />
        <meshStandardMaterial attach="material-5" map={facade} color="#ffffff" emissive={accentColor} emissiveMap={facade} emissiveIntensity={glow ? 0.6 : 0.28} roughness={0.55} metalness={0.15} />
      </mesh>

      {/* Roof accent — reads as the "flag" of each building's stance/category. */}
      <mesh position={[0, height + 0.22, 0]}>
        <boxGeometry args={[width * 0.82, 0.2, depth * 0.82]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={glow ? 0.7 : 0.4} />
      </mesh>
      {/* Rooftop antenna — small detail so tall towers don't look flat-topped. */}
      {height > 2.4 && (
        <mesh position={[width * 0.22, height + 0.55, depth * 0.22]}>
          <cylinderGeometry args={[0.02, 0.02, 0.5, 6]} />
          <meshStandardMaterial color="#6b5a42" roughness={0.7} />
        </mesh>
      )}

      <CityLabel y={height + 0.85} label={label} sublabel={sublabel} accent={accentColor} emphasized={glow} />
    </group>
  );
}
