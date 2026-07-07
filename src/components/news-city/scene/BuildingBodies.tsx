"use client";

/**
 * Market City structures in the cyber-holographic theme: dark night-glass
 * bodies with dozens of individually lit floor rings, colonnades, seam
 * lights, and faint holo-wireframe overlays. The buildings are luminous —
 * like a real financial skyline at night rendered as a hologram — so they
 * stay clearly visible against the dark backdrop. Brand colours only:
 * warm floor light + orange seams, ice-blue data bands.
 */

export type BuildingVariant = "classical" | "glass" | "domed" | "setback" | "skyline";

const BODY = "#10161f";
const BODY_LIGHT = "#1b2532";
const FLOOR_WARM = "#ffd9a8"; // lit office floors
const FLOOR_ICE = "#bfe4f2"; // ice-blue data bands
const SEAM = "#f97316"; // brand orange structural seams

/** Where the bias lamp should sit for each silhouette. */
export function lampHeightFor(variant: BuildingVariant, height: number): number {
  switch (variant) {
    case "setback":
      return height + 1.15;
    case "domed":
      return height * 0.5 + 1.0; // just above the central dome
    case "glass":
      return height * 1.12 + 0.45;
    case "classical":
      return height * 0.8 + 0.45; // just above the flat parapet roof
    default:
      return height + 0.4;
  }
}

/** A stack of thin glowing rings — individually lit floors of a tower. */
function Floors({
  y0,
  h,
  count,
  rAt,
  color = FLOOR_WARM,
  opacity = 0.6,
}: {
  y0: number;
  h: number;
  count: number;
  rAt: (f: number) => number;
  color?: string;
  opacity?: number;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const f = (i + 0.5) / count;
        return (
          <mesh key={i} position={[0, y0 + f * h, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[rAt(f), 0.011, 6, 48]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} toneMapped={false} depthWrite={false} />
          </mesh>
        );
      })}
    </>
  );
}

function SeamRing({ y, radius, opacity = 0.9 }: { y: number; radius: number; opacity?: number }) {
  return (
    <mesh position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.02, 8, 48]} />
      <meshBasicMaterial color={SEAM} transparent opacity={opacity} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

function glassMat(glow: boolean, color = BODY) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={0.32}
      metalness={0.5}
      emissive={BODY_LIGHT}
      emissiveIntensity={glow ? 1.1 : 0.45}
    />
  );
}

/** Faint holographic wireframe skin over a tower volume. */
function HoloWire({
  rBottom,
  rTop,
  h,
  y0,
  opacity = 0.07,
}: {
  rBottom: number;
  rTop: number;
  h: number;
  y0: number;
  opacity?: number;
}) {
  return (
    <mesh position={[0, y0 + h / 2, 0]}>
      <cylinderGeometry args={[rTop * 1.01, rBottom * 1.01, h, 20, 6]} />
      <meshBasicMaterial color={FLOOR_ICE} wireframe transparent opacity={opacity} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

/** Straight row of columns — the portico front of a monumental facade. */
function ColumnRow({ count, width, height, y0, z }: { count: number; width: number; height: number; y0: number; z: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const x = -width / 2 + (width / (count - 1)) * i;
        return (
          <mesh key={i} position={[x, y0 + height / 2, z]} castShadow>
            <cylinderGeometry args={[0.035, 0.045, height, 10]} />
            <meshStandardMaterial color={BODY_LIGHT} roughness={0.4} metalness={0.5} emissive={FLOOR_WARM} emissiveIntensity={0.3} />
          </mesh>
        );
      })}
    </>
  );
}

/** Glowing floor bands wrapped around a rectangular block — lit office rows. */
function BoxFloors({
  y0,
  h,
  count,
  w,
  d,
  color = FLOOR_WARM,
  opacity = 0.55,
}: {
  y0: number;
  h: number;
  count: number;
  w: number;
  d: number;
  color?: string;
  opacity?: number;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const f = (i + 0.5) / count;
        return (
          <mesh key={i} position={[0, y0 + f * h, 0]}>
            <boxGeometry args={[w + 0.015, 0.012, d + 0.015]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} toneMapped={false} depthWrite={false} />
          </mesh>
        );
      })}
    </>
  );
}

// ── Fed: tiered reserve tower with colonnade base and lit tiers ───────────────
export function ClassicalHall({ width, height, glow }: { width: number; depth?: number; height: number; glow: boolean }) {
  // Modelled on the Marriner S. Eccles Building: a wide, low marble block
  // with a recessed colonnade portico between two projecting end pavilions
  // and a flat parapet roof.
  const w = width * 1.55;
  const d = width * 0.85;
  const blockH = height * 0.62;
  const pavW = w * 0.2;
  return (
    <group>
      {/* Stepped base */}
      <mesh position={[0, 0.06, 0]} receiveShadow castShadow>
        <boxGeometry args={[w * 1.12, 0.12, d * 1.25]} />
        {glassMat(glow, BODY_LIGHT)}
      </mesh>
      {/* Main block */}
      <mesh position={[0, 0.12 + blockH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, blockH, d]} />
        {glassMat(glow)}
      </mesh>
      <BoxFloors y0={0.12} h={blockH} count={4} w={w} d={d} opacity={glow ? 0.8 : 0.5} />
      {/* Projecting end pavilions */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (w / 2 - pavW / 2), 0.12 + (blockH * 1.06) / 2, d * 0.08]} castShadow receiveShadow>
          <boxGeometry args={[pavW, blockH * 1.06, d * 1.12]} />
          {glassMat(glow, BODY_LIGHT)}
        </mesh>
      ))}
      {/* Recessed colonnade portico across the front */}
      <ColumnRow count={8} width={w * 0.5} height={blockH * 0.78} y0={0.12} z={d / 2 + 0.05} />
      {/* Entablature + parapet */}
      <mesh position={[0, 0.12 + blockH + 0.05, 0]} castShadow>
        <boxGeometry args={[w * 1.02, 0.1, d * 1.06]} />
        {glassMat(glow, BODY_LIGHT)}
      </mesh>
      {/* Attic storey */}
      <mesh position={[0, 0.12 + blockH + 0.1 + (height * 0.18) / 2, 0]} castShadow>
        <boxGeometry args={[w * 0.6, height * 0.18, d * 0.7]} />
        {glassMat(glow)}
      </mesh>
      <BoxFloors y0={0.12 + blockH + 0.1} h={height * 0.18} count={1} w={w * 0.6} d={d * 0.7} opacity={glow ? 0.8 : 0.5} />
      {/* Orange cornice line under the parapet */}
      <mesh position={[0, 0.12 + blockH + 0.005, 0]}>
        <boxGeometry args={[w * 1.03, 0.014, d * 1.07]} />
        <meshBasicMaterial color={SEAM} transparent opacity={glow ? 0.95 : 0.7} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ── ECB: tapered elliptical glass tower, dense ice floors, orange crown ───────
export function GlassTower({ width, height, glow }: { width: number; depth?: number; height: number; glow: boolean }) {
  const h = height * 1.12;
  const rB = width * 0.58;
  const rT = width * 0.3;
  return (
    <group>
      <mesh position={[0, 0.06, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[width * 0.7, width * 0.78, 0.12, 48]} />
        {glassMat(glow, BODY_LIGHT)}
      </mesh>
      <group scale={[1, 1, 0.72]}>
        <mesh position={[0, h / 2 + 0.12, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[rT, rB, h, 48]} />
          <meshStandardMaterial
            color={BODY}
            roughness={0.22}
            metalness={0.6}
            emissive="#1e3242"
            emissiveIntensity={glow ? 1.1 : 0.5}
          />
        </mesh>
        <Floors y0={0.12} h={h} count={13} rAt={(f) => rB + (rT - rB) * f + 0.01} color={FLOOR_ICE} opacity={glow ? 0.8 : 0.5} />
        <SeamRing y={h + 0.14} radius={rT + 0.01} opacity={glow ? 1 : 0.85} />
        <HoloWire rBottom={rB} rTop={rT} h={h} y0={0.12} />
      </group>
    </group>
  );
}

// ── BoJ: neo-baroque headquarters — stone base, side wings, central dome ─────
export function DomedHall({ width, height, glow }: { width: number; depth?: number; height: number; glow: boolean }) {
  // Modelled on the Bank of Japan head office: a symmetrical stone block with
  // two side wings and a central copper dome on an octagonal drum.
  const w = width * 1.4;
  const d = width * 0.85;
  const baseH = height * 0.5;
  const domeR = width * 0.3;
  const drumH = 0.16;
  const domeY = 0.1 + baseH + drumH;
  return (
    <group>
      {/* Base slab */}
      <mesh position={[0, 0.05, 0]} receiveShadow castShadow>
        <boxGeometry args={[w * 1.15, 0.1, d * 1.3]} />
        {glassMat(glow, BODY_LIGHT)}
      </mesh>
      {/* Central block */}
      <mesh position={[0, 0.1 + baseH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w * 0.55, baseH, d]} />
        {glassMat(glow)}
      </mesh>
      <BoxFloors y0={0.1} h={baseH} count={3} w={w * 0.55} d={d} opacity={glow ? 0.8 : 0.5} />
      {/* Side wings, slightly lower */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * w * 0.39, 0.1 + (baseH * 0.82) / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[w * 0.36, baseH * 0.82, d * 0.94]} />
            {glassMat(glow, BODY_LIGHT)}
          </mesh>
          <BoxFloors y0={0.1} h={baseH * 0.82} count={2} w={w * 0.36} d={d * 0.94} opacity={glow ? 0.7 : 0.45} />
        </group>
      ))}
      {/* Portico columns at the central entrance */}
      <ColumnRow count={4} width={w * 0.3} height={baseH * 0.72} y0={0.1} z={d / 2 + 0.05} />
      {/* Cornice */}
      <mesh position={[0, 0.1 + baseH + 0.04, 0]} castShadow>
        <boxGeometry args={[w * 0.58, 0.08, d * 1.04]} />
        {glassMat(glow, BODY_LIGHT)}
      </mesh>
      {/* Octagonal drum + central dome */}
      <mesh position={[0, domeY - drumH / 2 + 0.08, 0]} castShadow>
        <cylinderGeometry args={[domeR * 0.92, domeR, drumH, 8]} />
        {glassMat(glow, BODY_LIGHT)}
      </mesh>
      <mesh position={[0, domeY + 0.08, 0]} castShadow>
        <sphereGeometry args={[domeR, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={BODY_LIGHT}
          roughness={0.25}
          metalness={0.55}
          emissive="#1e3242"
          emissiveIntensity={glow ? 1 : 0.45}
        />
      </mesh>
      {/* Glowing rib + finial on the dome */}
      <mesh position={[0, domeY + 0.08 + domeR * 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[Math.sqrt(Math.max(domeR * domeR - (domeR * 0.4) ** 2, 0.001)) + 0.005, 0.011, 6, 40]} />
        <meshBasicMaterial color={FLOOR_ICE} transparent opacity={glow ? 0.85 : 0.55} toneMapped={false} depthWrite={false} />
      </mesh>
      <SeamRing y={domeY + 0.09} radius={domeR + 0.01} opacity={glow ? 0.95 : 0.7} />
    </group>
  );
}

// ── Nasdaq / ES HQ: segmented spire, dense warm floors, orange seams ──────────
export function SetbackTower({ width, height, glow }: { width: number; depth?: number; height: number; glow: boolean }) {
  const segs = [
    { rB: width * 0.56, rT: width * 0.44, h: height * 0.45, y0: 0.16, floors: 7 },
    { rB: width * 0.44, rT: width * 0.33, h: height * 0.32, y0: 0.16 + height * 0.45, floors: 5 },
    { rB: width * 0.33, rT: width * 0.24, h: height * 0.23, y0: 0.16 + height * 0.77, floors: 3 },
  ];
  return (
    <group>
      <mesh position={[0, 0.08, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[width * 0.66, width * 0.74, 0.16, 48]} />
        {glassMat(glow, BODY_LIGHT)}
      </mesh>
      {segs.map((s, i) => (
        <group key={i}>
          <mesh position={[0, s.y0 + s.h / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[s.rT, s.rB, s.h, 48]} />
            {glassMat(glow)}
          </mesh>
          <Floors y0={s.y0} h={s.h} count={s.floors} rAt={(f) => s.rB + (s.rT - s.rB) * f + 0.01} opacity={glow ? 0.85 : 0.6} />
          <SeamRing y={s.y0 + s.h} radius={s.rT + 0.008} opacity={glow ? 1 : 0.8} />
        </group>
      ))}
      <HoloWire rBottom={segs[0].rB} rTop={segs[2].rT} h={height} y0={0.16} opacity={0.09} />
      {/* Crown + beacon spire */}
      <mesh position={[0, height + 0.34, 0]}>
        <cylinderGeometry args={[width * 0.1, width * 0.2, 0.36, 32]} />
        {glassMat(glow, BODY_LIGHT)}
      </mesh>
      <mesh position={[0, height + 0.78, 0]}>
        <cylinderGeometry args={[0.015, 0.045, 0.62, 12]} />
        <meshStandardMaterial color="#5b6b7e" metalness={0.7} roughness={0.3} emissive={SEAM} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

// ── Decorative skyline: slim night towers with faint lit floors ───────────────
export function SkylineTower({ width, height }: { width: number; depth?: number; height: number }) {
  const rB = width * 0.5;
  const rT = width * 0.38;
  return (
    <group>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[rT, rB, height, 28]} />
        {glassMat(false)}
      </mesh>
      <Floors y0={0} h={height} count={5} rAt={(f) => rB + (rT - rB) * f + 0.008} opacity={0.32} />
    </group>
  );
}
