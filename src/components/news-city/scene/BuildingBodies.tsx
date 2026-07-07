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
      return height + 0.8;
    case "glass":
      return height * 1.12 + 0.45;
    case "classical":
      return height + 0.5;
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

/** Ring of slim columns — a colonnade base for the institutional buildings. */
function Colonnade({ radius, count, height, y0 }: { radius: number; count: number; height: number; y0: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * radius, y0 + height / 2, Math.sin(a) * radius]} castShadow>
            <cylinderGeometry args={[0.035, 0.045, height, 8]} />
            <meshStandardMaterial color={BODY_LIGHT} roughness={0.4} metalness={0.5} emissive={FLOOR_WARM} emissiveIntensity={0.25} />
          </mesh>
        );
      })}
    </>
  );
}

// ── Fed: tiered reserve tower with colonnade base and lit tiers ───────────────
export function ClassicalHall({ width, height, glow }: { width: number; depth?: number; height: number; glow: boolean }) {
  const tiers = [
    { r: width * 0.6, h: height * 0.42, y0: 0.55, floors: 5 },
    { r: width * 0.47, h: height * 0.32, y0: 0.55 + height * 0.42, floors: 4 },
    { r: width * 0.34, h: height * 0.26, y0: 0.55 + height * 0.74, floors: 3 },
  ];
  return (
    <group>
      {/* Plinth + colonnade arcade */}
      <mesh position={[0, 0.07, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[width * 0.82, width * 0.9, 0.14, 48]} />
        {glassMat(glow, BODY_LIGHT)}
      </mesh>
      <Colonnade radius={width * 0.68} count={12} height={0.42} y0={0.14} />
      <mesh position={[0, 0.55, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[width * 0.66, width * 0.74, 0.1, 48]} />
        {glassMat(glow, BODY_LIGHT)}
      </mesh>

      {tiers.map((t, i) => (
        <group key={i}>
          <mesh position={[0, t.y0 + t.h / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[t.r * 0.94, t.r, t.h, 48]} />
            {glassMat(glow)}
          </mesh>
          <Floors y0={t.y0} h={t.h} count={t.floors} rAt={(f) => t.r - (t.r - t.r * 0.94) * f + 0.008} opacity={glow ? 0.85 : 0.55} />
          <SeamRing y={t.y0 + t.h} radius={t.r * 0.94} opacity={glow ? 1 : 0.75} />
        </group>
      ))}
      <HoloWire rBottom={tiers[0].r} rTop={tiers[2].r * 0.94} h={height} y0={0.55} />
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

// ── BoJ: dome pavilion with pillar ring and glowing ribs ─────────────────────
export function DomedHall({ width, height, glow }: { width: number; depth?: number; height: number; glow: boolean }) {
  const plinthH = height * 0.55;
  const domeR = width * 0.52;
  return (
    <group>
      <mesh position={[0, plinthH / 2 + 0.02, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[width * 0.56, width * 0.66, plinthH, 48]} />
        {glassMat(glow)}
      </mesh>
      <Colonnade radius={width * 0.62} count={10} height={plinthH * 0.7} y0={0.05} />
      <Floors y0={0.05} h={plinthH - 0.1} count={3} rAt={() => width * 0.6} opacity={glow ? 0.8 : 0.5} />

      <mesh position={[0, plinthH, 0]} castShadow>
        <sphereGeometry args={[domeR, 36, 22, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={BODY_LIGHT}
          roughness={0.25}
          metalness={0.55}
          emissive="#1e3242"
          emissiveIntensity={glow ? 1 : 0.45}
        />
      </mesh>
      {/* Glowing latitude ribs on the dome */}
      {[0.25, 0.55].map((f) => {
        const y = plinthH + domeR * f;
        const r = Math.sqrt(Math.max(domeR * domeR - (domeR * f) ** 2, 0.001));
        return (
          <mesh key={f} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r + 0.005, 0.012, 6, 48]} />
            <meshBasicMaterial color={FLOOR_ICE} transparent opacity={glow ? 0.85 : 0.55} toneMapped={false} depthWrite={false} />
          </mesh>
        );
      })}
      <SeamRing y={plinthH + 0.01} radius={domeR + 0.01} opacity={glow ? 0.95 : 0.7} />
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
