"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { getFacadeTexture } from "./buildingTexture";

export type BuildingVariant = "classical" | "glass" | "domed" | "setback" | "skyline";

/** Where the bias lamp should sit for each silhouette (fraction of height + abs). */
export function lampHeightFor(variant: BuildingVariant, height: number): number {
  switch (variant) {
    case "setback":
      return height + 1.25; // spire tip
    case "domed":
      return height + 0.95; // above dome
    case "classical":
      return height + 0.55; // above the pediment ridge
    case "glass":
      return height + 0.4;
    default:
      return height + 0.4;
  }
}

/** A box whose four vertical faces carry a windowed facade texture; the top and
 *  bottom stay a plain structural colour. The texture is cloned per box so
 *  boxes that share a colour palette but differ in height don't fight over the
 *  shared cached texture's repeat. */
function WindowBox({
  args,
  position,
  base,
  windowColor,
  glow,
  rows = 2.2,
}: {
  args: [number, number, number];
  position: [number, number, number];
  base: string;
  windowColor: string;
  glow: boolean;
  rows?: number;
}) {
  const [w, h] = args;
  const facade = useMemo(() => {
    const t = getFacadeTexture(base, windowColor).clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(Math.max(1, Math.round(w / 1.2)), Math.max(1, Math.round(h / rows)));
    t.needsUpdate = true;
    return t;
  }, [base, windowColor, w, h, rows]);

  const sideProps = {
    map: facade,
    color: "#ffffff",
    emissive: windowColor,
    emissiveMap: facade,
    emissiveIntensity: glow ? 0.5 : 0.22,
    roughness: 0.5,
    metalness: 0.2,
  } as const;

  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial attach="material-0" {...sideProps} />
      <meshStandardMaterial attach="material-1" {...sideProps} />
      <meshStandardMaterial attach="material-2" color={base} roughness={0.6} metalness={0.2} />
      <meshStandardMaterial attach="material-3" color={base} roughness={0.6} metalness={0.2} />
      <meshStandardMaterial attach="material-4" {...sideProps} />
      <meshStandardMaterial attach="material-5" {...sideProps} />
    </mesh>
  );
}

// ── Classical central-bank hall: stepped base, colonnade, low pediment ────────
export function ClassicalHall({ width, depth, height, glow }: { width: number; depth: number; height: number; glow: boolean }) {
  const stone = "#d8ccb2";
  const stoneLight = "#e7dcc4";
  const cols = 6;
  const colY = height * 0.55;
  return (
    <group>
      {/* stepped stylobate */}
      <mesh position={[0, 0.08, 0]} receiveShadow castShadow>
        <boxGeometry args={[width * 1.3, 0.16, depth * 1.3]} />
        <meshStandardMaterial color={stone} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.24, 0]} receiveShadow castShadow>
        <boxGeometry args={[width * 1.15, 0.16, depth * 1.15]} />
        <meshStandardMaterial color={stoneLight} roughness={0.8} />
      </mesh>
      {/* main cella */}
      <mesh position={[0, 0.32 + (height * 0.7) / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height * 0.7, depth]} />
        <meshStandardMaterial color={stone} roughness={0.75} emissive="#e7dcc4" emissiveIntensity={glow ? 0.12 : 0.04} />
      </mesh>
      {/* colonnade across the front */}
      {Array.from({ length: cols }).map((_, i) => {
        const x = -width / 2 + (width / (cols - 1)) * i;
        return (
          <mesh key={i} position={[x, 0.32 + colY / 2, depth / 2 + 0.06]} castShadow>
            <cylinderGeometry args={[width * 0.05, width * 0.05, colY, 12]} />
            <meshStandardMaterial color={stoneLight} roughness={0.7} />
          </mesh>
        );
      })}
      {/* entablature */}
      <mesh position={[0, 0.32 + height * 0.7 + 0.08, 0]}>
        <boxGeometry args={[width * 1.06, 0.18, depth * 1.06]} />
        <meshStandardMaterial color={stoneLight} roughness={0.7} />
      </mesh>
      {/* pediment — triangular prism spanning the width */}
      <mesh position={[0, 0.32 + height * 0.7 + 0.28, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[depth * 0.5, depth * 0.5, width * 1.02, 3]} />
        <meshStandardMaterial color={stone} roughness={0.75} />
      </mesh>
    </group>
  );
}

// ── ECB-style glass tower: twin slabs with a slanted crown ───────────────────
export function GlassTower({ width, depth, height, glow }: { width: number; depth: number; height: number; glow: boolean }) {
  const base = "#6f8fa2";
  const glass = "#cfe6f2";
  return (
    <group>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[width * 1.2, 0.1, depth * 1.2]} />
        <meshStandardMaterial color="#8a9aa4" roughness={0.7} />
      </mesh>
      {/* front slab */}
      <WindowBox args={[width, height, depth * 0.62]} position={[0, height / 2 + 0.1, depth * 0.18]} base={base} windowColor={glass} glow={glow} rows={1.9} />
      {/* rear slab, taller, offset — twin-tower silhouette */}
      <WindowBox args={[width * 0.7, height * 1.12, depth * 0.5]} position={[width * 0.12, (height * 1.12) / 2 + 0.1, -depth * 0.22]} base={base} windowColor={glass} glow={glow} rows={1.9} />
      {/* slanted glass crown on the taller slab */}
      <mesh position={[width * 0.12, height * 1.12 + 0.16, -depth * 0.22]} rotation={[0.5, 0, 0]}>
        <boxGeometry args={[width * 0.7, 0.06, depth * 0.5]} />
        <meshStandardMaterial color={glass} emissive={glass} emissiveIntensity={glow ? 0.5 : 0.28} roughness={0.25} metalness={0.4} />
      </mesh>
      {/* connecting sky-bridge */}
      <mesh position={[width * 0.06, height * 0.5, -depth * 0.02]}>
        <boxGeometry args={[width * 0.5, height * 0.12, depth * 0.18]} />
        <meshStandardMaterial color={glass} emissive={glass} emissiveIntensity={0.3} roughness={0.3} metalness={0.4} />
      </mesh>
    </group>
  );
}

// ── Bank-of-Japan-style neoclassical hall with a central dome ────────────────
export function DomedHall({ width, depth, height, glow }: { width: number; depth: number; height: number; glow: boolean }) {
  const stone = "#d6cab0";
  const stoneLight = "#e6dcc5";
  const dome = "#7fa896"; // verdigris copper
  return (
    <group>
      <mesh position={[0, 0.09, 0]} receiveShadow castShadow>
        <boxGeometry args={[width * 1.25, 0.18, depth * 1.25]} />
        <meshStandardMaterial color={stone} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.18 + (height * 0.82) / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height * 0.82, depth]} />
        <meshStandardMaterial color={stoneLight} roughness={0.75} emissive="#efe4c8" emissiveIntensity={glow ? 0.12 : 0.04} />
      </mesh>
      {/* pilasters on the front */}
      {Array.from({ length: 4 }).map((_, i) => {
        const x = -width / 2 + (width / 3) * i;
        return (
          <mesh key={i} position={[x, 0.18 + (height * 0.82) / 2, depth / 2 + 0.03]}>
            <boxGeometry args={[width * 0.07, height * 0.72, 0.08]} />
            <meshStandardMaterial color={stone} roughness={0.7} />
          </mesh>
        );
      })}
      {/* drum + dome */}
      <mesh position={[0, 0.18 + height * 0.82 + 0.08, 0]}>
        <cylinderGeometry args={[width * 0.3, width * 0.34, 0.2, 20]} />
        <meshStandardMaterial color={stoneLight} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.18 + height * 0.82 + 0.18, 0]}>
        <sphereGeometry args={[width * 0.32, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={dome} roughness={0.5} metalness={0.35} emissive={dome} emissiveIntensity={glow ? 0.25 : 0.1} />
      </mesh>
    </group>
  );
}

// ── Art-deco setback skyscraper (Nasdaq / ES HQ), the city's tallest ─────────
export function SetbackTower({ width, depth, height, glow }: { width: number; depth: number; height: number; glow: boolean }) {
  const base = "#39414d";
  const glass = "#bcd6ea";
  const t1 = height * 0.52;
  const t2 = height * 0.3;
  const t3 = height * 0.18;
  return (
    <group>
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[width * 1.2, 0.12, depth * 1.2]} />
        <meshStandardMaterial color="#2b3038" roughness={0.7} />
      </mesh>
      <WindowBox args={[width, t1, depth]} position={[0, t1 / 2 + 0.12, 0]} base={base} windowColor={glass} glow={glow} rows={2.4} />
      <WindowBox args={[width * 0.74, t2, depth * 0.74]} position={[0, t1 + t2 / 2 + 0.12, 0]} base={base} windowColor={glass} glow={glow} rows={2.4} />
      <WindowBox args={[width * 0.5, t3, depth * 0.5]} position={[0, t1 + t2 + t3 / 2 + 0.12, 0]} base={base} windowColor={glass} glow={glow} rows={2.4} />
      {/* crown */}
      <mesh position={[0, t1 + t2 + t3 + 0.24, 0]}>
        <cylinderGeometry args={[width * 0.16, width * 0.26, 0.4, 8]} />
        <meshStandardMaterial color="#586472" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* spire */}
      <mesh position={[0, t1 + t2 + t3 + 0.7, 0]}>
        <cylinderGeometry args={[0.02, 0.05, 0.7, 8]} />
        <meshStandardMaterial color="#8a97a6" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

// ── Simple decorative skyline tower (non-interactive background) ──────────────
export function SkylineTower({ width, depth, height, base = "#4a5360", glass = "#cdd9e6" }: { width: number; depth: number; height: number; base?: string; glass?: string }) {
  return <WindowBox args={[width, height, depth]} position={[0, height / 2, 0]} base={base} windowColor={glass} glow={false} rows={2.4} />;
}
