"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { Group } from "three";
import { Building } from "./scene/Building";
import { Ship } from "./scene/Ship";
import { Reactor } from "./scene/Reactor";
import { MarketCore } from "./scene/MarketCore";
import { DIRECTION_META, TREND_META, SENTIMENT_META } from "@/lib/news-city/ui";
import type { NewsCityData } from "@/lib/news-city/types";
import type { CitySelection } from "./selection";

const SITE_BG = "#f6f5f4";
const RADIUS = 7;

/** Drives the carousel: a slow constant spin so structures drift past the
 *  front, plus a scroll-to-fast-forward impulse that decays back to the idle
 *  drift. Wheel events over the canvas scrub the wheel instead of the page. */
function WheelController({ spinRef }: { spinRef: React.RefObject<Group | null> }) {
  const vel = useRef(0);
  const intro = useRef(0);
  const { gl } = useThree();

  useEffect(() => {
    const el = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      vel.current += e.deltaY * 0.0012;
      vel.current = Math.max(Math.min(vel.current, 8), -8);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [gl]);

  useFrame((_, delta) => {
    const g = spinRef.current;
    if (!g) return;
    // Materialise intro: rise + scale up once.
    if (intro.current < 1) {
      intro.current = Math.min(intro.current + delta / 1.0, 1);
      const e = 1 - Math.pow(1 - intro.current, 3);
      g.scale.setScalar(0.9 + 0.1 * e);
      g.position.y = -1.2 * (1 - e);
    }
    const base = 0.16;
    g.rotation.y += (base + vel.current) * delta;
    vel.current *= Math.exp(-delta * 2.2);
  });

  return null;
}

/** The turntable the structures ride on — a light stage disc with a brand rim,
 *  an ice track line, radial spokes to the hub, and a hub ring under the core. */
function Turntable() {
  const spokes = 9;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
        <circleGeometry args={[RADIUS + 2.6, 96]} />
        <meshStandardMaterial color="#edeceb" roughness={0.9} metalness={0.04} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
        <ringGeometry args={[RADIUS + 2.4, RADIUS + 2.6, 96]} />
        <meshBasicMaterial color="#f97316" transparent opacity={0.55} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <ringGeometry args={[RADIUS - 0.03, RADIUS + 0.03, 96]} />
        <meshBasicMaterial color="#2b93b4" transparent opacity={0.4} toneMapped={false} />
      </mesh>
      {Array.from({ length: spokes }).map((_, i) => {
        const a = (i / spokes) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.sin(a) * (RADIUS / 2), -0.02, Math.cos(a) * (RADIUS / 2)]} rotation={[0, a, 0]}>
            <boxGeometry args={[0.03, 0.012, RADIUS]} />
            <meshBasicMaterial color="#c7c4c4" transparent opacity={0.6} />
          </mesh>
        );
      })}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <ringGeometry args={[1.0, 1.15, 48]} />
        <meshBasicMaterial color="#f97316" transparent opacity={0.5} toneMapped={false} />
      </mesh>
      {/* Soft float shadow below the stage */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, 0]}>
        <circleGeometry args={[RADIUS + 3, 48]} />
        <meshBasicMaterial color="#1a2333" transparent opacity={0.06} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function City3D({
  data,
  selected,
  onSelect,
}: {
  data: NewsCityData;
  selected: CitySelection | null;
  onSelect: (sel: CitySelection) => void;
}) {
  const spinRef = useRef<Group>(null);

  const fed = data.centralBanks.find((b) => b.id === "fed")!;
  const ecb = data.centralBanks.find((b) => b.id === "ecb")!;
  const boj = data.centralBanks.find((b) => b.id === "boj")!;
  const oil = data.commodities.find((c) => c.id === "oil")!;
  const gold = data.commodities.find((c) => c.id === "gold")!;
  const inflation = data.macroForces.find((m) => m.id === "inflation")!;
  const employment = data.macroForces.find((m) => m.id === "employment")!;
  const growth = data.macroForces.find((m) => m.id === "growth")!;
  const nq = data.marketHQ.indices.find((i) => i.id === "nq");
  const sent = SENTIMENT_META[data.marketHQ.sentiment];

  // Interleave types so the wheel stays varied as structures drift past.
  const items: React.ReactNode[] = [
    <Building
      key="hq"
      position={[0, 0, 0]}
      width={1.9}
      depth={1.9}
      height={4.0}
      variant="setback"
      biasColor={sent.hex}
      label="Nasdaq / ES HQ"
      sublabel={`${nq?.price ?? ""} · ${sent.label}`}
      active={selected?.kind === "hq"}
      onSelect={() => onSelect({ kind: "hq" })}
    />,
    <Building
      key="fed"
      position={[0, 0, 0]}
      width={1.8}
      depth={1.8}
      height={2.4}
      variant="classical"
      biasColor={DIRECTION_META[fed.direction].hex}
      label={fed.shortName}
      sublabel={`${fed.rate} · ${DIRECTION_META[fed.direction].label}`}
      active={selected?.kind === "bank" && selected.id === "fed"}
      onSelect={() => onSelect({ kind: "bank", id: "fed" })}
    />,
    <Reactor
      key="inflation"
      position={[0, 0, 0]}
      accentColor={TREND_META[inflation.direction].hex}
      intensity={inflation.intensity}
      label={inflation.name}
      sublabel={`${inflation.metric} · ${inflation.level}`}
      active={selected?.kind === "macro" && selected.id === "inflation"}
      onSelect={() => onSelect({ kind: "macro", id: "inflation" })}
    />,
    <Ship
      key="oil"
      position={[0, 0, 0]}
      color="#1d242e"
      accentColor={TREND_META[oil.direction].hex}
      label={oil.name}
      sublabel={`${oil.price} · ${TREND_META[oil.direction].label}`}
      active={selected?.kind === "commodity" && selected.id === "oil"}
      onSelect={() => onSelect({ kind: "commodity", id: "oil" })}
    />,
    <Building
      key="ecb"
      position={[0, 0, 0]}
      width={1.3}
      depth={1.3}
      height={3.0}
      variant="glass"
      biasColor={DIRECTION_META[ecb.direction].hex}
      label={ecb.shortName}
      sublabel={`${ecb.rate} · ${DIRECTION_META[ecb.direction].label}`}
      active={selected?.kind === "bank" && selected.id === "ecb"}
      onSelect={() => onSelect({ kind: "bank", id: "ecb" })}
    />,
    <Reactor
      key="employment"
      position={[0, 0, 0]}
      accentColor={TREND_META[employment.direction].hex}
      intensity={employment.intensity}
      label={employment.name}
      sublabel={`${employment.metric} · ${employment.level}`}
      active={selected?.kind === "macro" && selected.id === "employment"}
      onSelect={() => onSelect({ kind: "macro", id: "employment" })}
    />,
    <Ship
      key="gold"
      position={[0, 0, 0]}
      color="#6e5a28"
      accentColor={TREND_META[gold.direction].hex}
      label={gold.name}
      sublabel={`${gold.price} · ${TREND_META[gold.direction].label}`}
      active={selected?.kind === "commodity" && selected.id === "gold"}
      onSelect={() => onSelect({ kind: "commodity", id: "gold" })}
    />,
    <Building
      key="boj"
      position={[0, 0, 0]}
      width={1.6}
      depth={1.6}
      height={2.1}
      variant="domed"
      biasColor={DIRECTION_META[boj.direction].hex}
      label={boj.shortName}
      sublabel={`${boj.rate} · ${DIRECTION_META[boj.direction].label}`}
      active={selected?.kind === "bank" && selected.id === "boj"}
      onSelect={() => onSelect({ kind: "bank", id: "boj" })}
    />,
    <Reactor
      key="growth"
      position={[0, 0, 0]}
      accentColor={TREND_META[growth.direction].hex}
      intensity={growth.intensity}
      label={growth.name}
      sublabel={`${growth.metric} · ${growth.level}`}
      active={selected?.kind === "macro" && selected.id === "growth"}
      onSelect={() => onSelect({ kind: "macro", id: "growth" })}
    />,
  ];

  return (
    <Canvas
      shadows
      camera={{ position: [0, 7, 21], fov: 36 }}
      className="!touch-none"
      dpr={[1, 1.75]}
      onCreated={({ camera }) => camera.lookAt(0, 2, 0)}
    >
      {/* Match the rest of the site's background. */}
      <color attach="background" args={[SITE_BG]} />
      <fog attach="fog" args={[SITE_BG, 15, 34]} />

      <ambientLight intensity={0.9} color="#ffffff" />
      <hemisphereLight args={["#ffffff", "#dfe3e8", 0.6]} />
      <directionalLight
        position={[8, 15, 10]}
        intensity={1.15}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
      />
      {/* Front fill so the dark glass faces nearest the camera stay legible. */}
      <pointLight position={[0, 6, 15]} intensity={0.5} color="#ffffff" distance={40} decay={1.5} />

      <Suspense fallback={null}>
        <group ref={spinRef}>
          <Turntable />
          {items.map((node, i) => {
            const a = (i / items.length) * Math.PI * 2;
            return (
              <group key={i} position={[Math.sin(a) * RADIUS, 0, Math.cos(a) * RADIUS]} rotation={[0, a, 0]}>
                {node}
              </group>
            );
          })}
        </group>

        {/* The Market Core is the fixed hub at the centre of the wheel. */}
        <MarketCore
          overview={data.overview}
          active={selected?.kind === "core"}
          onSelect={() => onSelect({ kind: "core" })}
        />
      </Suspense>

      <WheelController spinRef={spinRef} />
    </Canvas>
  );
}
