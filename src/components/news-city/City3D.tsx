"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { Group } from "three";
import { Building } from "./scene/Building";
import { Ship } from "./scene/Ship";
import { Reactor } from "./scene/Reactor";
import { DIRECTION_META, TREND_META, SENTIMENT_META } from "@/lib/news-city/ui";
import type { NewsCityData } from "@/lib/news-city/types";
import type { CitySelection } from "./selection";

const SITE_BG = "#f6f5f4";
const SPACING = 4.7; // vertical gap between concepts on the reel
const CURVE = 0.5; // how much the reel recedes toward its edges (3D bend)
const TILT = 0.09; // how much each concept tilts as it leaves centre
const BASE_SPEED = 0.13; // concepts per second — one passes centre roughly every ~7.5s

type ReelItem = {
  key: string;
  /** Uniform scale so the different structures read as similar-sized symbols. */
  scale: number;
  /** Vertical offset (scaled half-height) so the structure sits centred. */
  offset: number;
  node: React.ReactNode;
};

/**
 * A vertical slot-machine reel. The concept structures ride a wrapping strip
 * that scrolls from the top of the frame, past the centre, and out the bottom
 * (with a subtle 3D bend + tilt so it reads like a casino reel rather than a
 * flat list). It idles slowly; scrolling over the canvas spins it faster (a
 * burst that decays back to the idle drift) and it spins up then settles on
 * entry.
 */
function SlotReel({ items }: { items: ReelItem[] }) {
  const refs = useRef<(Group | null)[]>([]);
  const t = useRef(0);
  const vel = useRef(4.5); // "pull the lever" intro spin, decelerating to idle
  const { gl } = useThree();

  useEffect(() => {
    const el = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      vel.current += e.deltaY * 0.004;
      vel.current = Math.max(Math.min(vel.current, 6), -6);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [gl]);

  useFrame((_, delta) => {
    t.current += (BASE_SPEED + vel.current) * delta;
    vel.current *= Math.exp(-delta * 1.8);
    const n = items.length;
    for (let i = 0; i < n; i++) {
      const g = refs.current[i];
      if (!g) continue;
      // Signed slot in [-n/2, n/2): 0 = centre of the window.
      let s = (((i - t.current) % n) + n) % n;
      if (s > n / 2) s -= n;
      g.position.set(0, s * SPACING, -CURVE * s * s);
      g.rotation.x = s * TILT;
    }
  });

  return (
    <>
      {items.map((it, i) => (
        <group key={it.key} ref={(el) => { refs.current[i] = el; }}>
          <group position={[0, -it.offset, 0]}>
            <group scale={it.scale}>{it.node}</group>
          </group>
        </group>
      ))}
    </>
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
  const fed = data.centralBanks.find((b) => b.id === "fed")!;
  const oil = data.commodities.find((c) => c.id === "oil")!;
  const inflation = data.macroForces.find((m) => m.id === "inflation")!;
  const nq = data.marketHQ.indices.find((i) => i.id === "nq");
  const sent = SENTIMENT_META[data.marketHQ.sentiment];

  // One structure per concept — clicking opens that concept's flagship panel.
  const items: ReelItem[] = [
    {
      key: "banks",
      scale: 1.0,
      offset: 1.3,
      node: (
        <Building
          position={[0, 0, 0]}
          width={1.8}
          depth={1.8}
          height={2.4}
          variant="classical"
          biasColor={DIRECTION_META[fed.direction].hex}
          label="Central Banks"
          sublabel="Fed · ECB · BoJ"
          active={selected?.kind === "bank"}
          onSelect={() => onSelect({ kind: "bank", id: "fed" })}
        />
      ),
    },
    {
      key: "commodities",
      scale: 1.25,
      offset: 0.75,
      node: (
        <Ship
          position={[0, 0, 0]}
          rotationY={-0.5}
          color="#1d242e"
          accentColor={TREND_META[oil.direction].hex}
          label="Commodities"
          sublabel="Oil · Gold"
          active={selected?.kind === "commodity"}
          onSelect={() => onSelect({ kind: "commodity", id: "oil" })}
        />
      ),
    },
    {
      key: "macro",
      scale: 1.8,
      offset: 1.35,
      node: (
        <Reactor
          position={[0, 0, 0]}
          accentColor={TREND_META[inflation.direction].hex}
          intensity={inflation.intensity}
          label="Macro"
          sublabel="CPI · Jobs · GDP"
          active={selected?.kind === "macro"}
          onSelect={() => onSelect({ kind: "macro", id: "inflation" })}
        />
      ),
    },
    {
      key: "indexes",
      scale: 0.62,
      offset: 1.55,
      node: (
        <Building
          position={[0, 0, 0]}
          width={1.9}
          depth={1.9}
          height={4.0}
          variant="setback"
          biasColor={sent.hex}
          label="Indexes"
          sublabel={`NQ ${nq?.price ?? ""} · ES`}
          active={selected?.kind === "hq"}
          onSelect={() => onSelect({ kind: "hq" })}
        />
      ),
    },
  ];

  return (
    <Canvas
      camera={{ position: [0, 0, 15], fov: 36 }}
      className="!touch-none"
      dpr={[1, 1.75]}
      onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
    >
      {/* Match the rest of the site's background. */}
      <color attach="background" args={[SITE_BG]} />
      <fog attach="fog" args={[SITE_BG, 13, 26]} />

      <ambientLight intensity={0.95} color="#ffffff" />
      <hemisphereLight args={["#ffffff", "#dfe3e8", 0.6]} />
      <directionalLight position={[6, 12, 10]} intensity={1.1} color="#ffffff" />
      {/* Front fill so the dark glass faces nearest the camera stay legible. */}
      <pointLight position={[0, 2, 14]} intensity={0.6} color="#ffffff" distance={40} decay={1.5} />

      <Suspense fallback={null}>
        <SlotReel items={items} />
      </Suspense>
    </Canvas>
  );
}
