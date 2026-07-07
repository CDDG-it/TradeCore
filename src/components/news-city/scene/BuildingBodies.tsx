"use client";

/**
 * Futuristic building silhouettes — smooth cylinders, tapers, and domes
 * instead of boxes. Structures are bright brushed silver and glass on a light
 * studio backdrop; saturated "data bands" and the bias lamp (added by
 * Building.tsx) carry the colour, so the city reads as a premium holographic
 * trading environment with clearly visible buildings.
 */

export type BuildingVariant = "classical" | "glass" | "domed" | "setback" | "skyline";

const STEEL = "#c9d1da";
const STEEL_LIGHT = "#e0e5eb";
const GLASS = "#8fc2d9";
const BAND = "#1f8fb4"; // deep ice-blue data bands (dashboard primary family)

/** Where the bias lamp should sit for each silhouette. */
export function lampHeightFor(variant: BuildingVariant, height: number): number {
  switch (variant) {
    case "setback":
      return height + 1.15; // spire tip
    case "domed":
      return height + 0.8;
    case "glass":
      return height * 1.12 + 0.45;
    case "classical":
      return height + 0.5;
    default:
      return height + 0.4;
  }
}

function BandRing({ y, radius, color = BAND, opacity = 0.9 }: { y: number; radius: number; color?: string; opacity?: number }) {
  return (
    <mesh position={[0, y, 0]}>
      <torusGeometry args={[radius, 0.018, 8, 48]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} toneMapped={false} />
    </mesh>
  );
}

function bodyMat(glow: boolean, color = STEEL) {
  // Low metalness: with no environment map, metallic surfaces render nearly
  // black — matte silver keeps the towers bright and clearly visible.
  return (
    <meshStandardMaterial
      color={color}
      roughness={0.45}
      metalness={0.25}
      emissive="#ffffff"
      emissiveIntensity={glow ? 0.22 : 0.04}
    />
  );
}

// ── Fed: tiered cylindrical reserve tower with glowing seams ─────────────────
export function ClassicalHall({ width, height, glow }: { width: number; depth?: number; height: number; glow: boolean }) {
  const tiers = [
    { r: width * 0.62, h: height * 0.42, y0: 0.12 },
    { r: width * 0.48, h: height * 0.32, y0: 0.12 + height * 0.42 },
    { r: width * 0.34, h: height * 0.26, y0: 0.12 + height * 0.74 },
  ];
  return (
    <group>
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <cylinderGeometry args={[width * 0.78, width * 0.85, 0.12, 40]} />
        {bodyMat(glow, STEEL_LIGHT)}
      </mesh>
      {tiers.map((t, i) => (
        <group key={i}>
          <mesh position={[0, t.y0 + t.h / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[t.r * 0.94, t.r, t.h, 40]} />
            {bodyMat(glow)}
          </mesh>
          <BandRing y={t.y0 + t.h} radius={t.r * 0.94} opacity={glow ? 1 : 0.7} />
        </group>
      ))}
    </group>
  );
}

// ── ECB: tapered elliptical glass tower with a glowing crown ─────────────────
export function GlassTower({ width, height, glow }: { width: number; depth?: number; height: number; glow: boolean }) {
  const h = height * 1.12;
  return (
    <group>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[width * 0.7, width * 0.78, 0.1, 40]} />
        {bodyMat(glow, STEEL_LIGHT)}
      </mesh>
      <group scale={[1, 1, 0.72]}>
        <mesh position={[0, h / 2 + 0.1, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[width * 0.3, width * 0.58, h, 40]} />
          <meshStandardMaterial
            color={GLASS}
            roughness={0.2}
            metalness={0.35}
            emissive="#bfe4f2"
            emissiveIntensity={glow ? 0.35 : 0.15}
          />
        </mesh>
        {[0.3, 0.55, 0.8].map((f) => (
          <BandRing key={f} y={h * f + 0.1} radius={width * (0.58 - 0.28 * f) + 0.01} opacity={glow ? 0.9 : 0.55} />
        ))}
        <BandRing y={h + 0.12} radius={width * 0.3} color="#f97316" opacity={glow ? 1 : 0.8} />
      </group>
    </group>
  );
}

// ── BoJ: low dome pavilion on a smooth plinth ────────────────────────────────
export function DomedHall({ width, height, glow }: { width: number; depth?: number; height: number; glow: boolean }) {
  const plinthH = height * 0.55;
  return (
    <group>
      <mesh position={[0, plinthH / 2 + 0.02, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[width * 0.58, width * 0.66, plinthH, 40]} />
        {bodyMat(glow)}
      </mesh>
      <BandRing y={plinthH * 0.55} radius={width * 0.63} opacity={glow ? 0.9 : 0.55} />
      <mesh position={[0, plinthH, 0]} castShadow>
        <sphereGeometry args={[width * 0.52, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={STEEL_LIGHT}
          roughness={0.3}
          metalness={0.3}
          emissive="#bfe4f2"
          emissiveIntensity={glow ? 0.3 : 0.1}
        />
      </mesh>
      <BandRing y={plinthH + width * 0.28} radius={width * 0.435} opacity={glow ? 1 : 0.7} />
    </group>
  );
}

// ── Nasdaq / ES HQ: tall tapered spire with data bands ───────────────────────
export function SetbackTower({ width, height, glow }: { width: number; depth?: number; height: number; glow: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.07, 0]} receiveShadow>
        <cylinderGeometry args={[width * 0.66, width * 0.74, 0.14, 48]} />
        {bodyMat(glow, STEEL_LIGHT)}
      </mesh>
      <mesh position={[0, height / 2 + 0.14, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[width * 0.24, width * 0.56, height, 48]} />
        <meshStandardMaterial
          color="#b6c0cb"
          roughness={0.4}
          metalness={0.3}
          emissive="#ffffff"
          emissiveIntensity={glow ? 0.22 : 0.05}
        />
      </mesh>
      {[0.22, 0.42, 0.62, 0.82].map((f) => (
        <BandRing key={f} y={height * f + 0.14} radius={width * (0.56 - 0.32 * f) + 0.012} color="#f97316" opacity={glow ? 1 : 0.85} />
      ))}
      {/* Crown + spire */}
      <mesh position={[0, height + 0.3, 0]}>
        <cylinderGeometry args={[width * 0.1, width * 0.22, 0.36, 32]} />
        {bodyMat(glow, STEEL_LIGHT)}
      </mesh>
      <mesh position={[0, height + 0.75, 0]}>
        <cylinderGeometry args={[0.015, 0.05, 0.65, 12]} />
        <meshStandardMaterial color="#8a97a6" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ── Decorative skyline: slender cylinders with a faint band ──────────────────
export function SkylineTower({ width, height }: { width: number; depth?: number; height: number }) {
  return (
    <group>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[width * 0.38, width * 0.5, height, 28]} />
        {bodyMat(false)}
      </mesh>
      <BandRing y={height * 0.85} radius={width * (0.5 - 0.12 * 0.85)} opacity={0.4} />
    </group>
  );
}
