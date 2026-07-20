"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { IntelligenceGrid } from "./scene/IntelligenceGrid";
import { IntelligenceCore } from "./scene/IntelligenceCore";
import { CategoryNode } from "./scene/CategoryNode";
import { DataFlow } from "./scene/DataFlow";
import { NEWS_CATEGORY_META, SENTIMENT_META } from "@/lib/news-city/ui";
import type { NewsCategory, NewsCityData } from "@/lib/news-city/types";
import type { CitySelection } from "./selection";
import { selectionKey } from "./selection";
import { useTheme } from "@/lib/theme-context";

// Sky/fog per theme — navy in dark, a soft slate in light so the hub sits on a
// light background that matches the rest of the UI.
const SKY_DARK = "#0b1120";
const SKY_LIGHT = "#EEF3F8";

/** The five signal sources the hub visualises, arranged as a pentagon around
 *  the Market Intelligence Core — matches the reading order Macro → Central
 *  Banks → Commodities → Earnings → Nasdaq/ES Impact. */
const NODE_CATEGORIES: NewsCategory[] = ["macro", "central-bank", "commodity", "earnings", "markets"];
const NODE_RADIUS = 7.2;

function nodePosition(index: number): [number, number, number] {
  const angle = -Math.PI / 2 + index * ((2 * Math.PI) / NODE_CATEGORIES.length);
  return [Math.cos(angle) * NODE_RADIUS, 0, Math.sin(angle) * NODE_RADIUS];
}

/** Default "sit above the whole hub" establishing view. Pulled back far enough
 *  that the entire hub — core, node ring and outer grid — frames on load rather
 *  than opening zoomed into the core. */
const OVERVIEW = {
  position: new THREE.Vector3(0, 17, 29),
  target: new THREE.Vector3(0, 0.6, 0),
};

function easeInOutCubic(x: number) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/**
 * Drives the camera: a one-time cinematic descent into the hub on load, then
 * hands full rotate/zoom control to the user via OrbitControls. Selecting a
 * node dollies the camera toward it along the current viewing angle.
 */
function CameraRig({
  selected,
  focusTargets,
  eventCategory,
}: {
  selected: CitySelection | null;
  focusTargets: Record<string, [number, number, number]>;
  /** Resolves an "event" selection to the category node it belongs to. */
  eventCategory: (eventId: string) => NewsCategory | null;
}) {
  const { camera } = useThree();
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null);

  const introDone = useRef(false);
  const introT = useRef(0);
  const introFrom = useRef({
    pos: new THREE.Vector3(2, 30, 40),
    target: new THREE.Vector3(0, 2, 0),
  });

  const focusT = useRef(1);
  const focusFromPos = useRef(new THREE.Vector3());
  const focusFromTarget = useRef(new THREE.Vector3());
  const focusToPos = useRef(new THREE.Vector3());
  const focusToTarget = useRef(new THREE.Vector3());
  const prevKey = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    camera.position.copy(introFrom.current.pos);
    if (controls.current) {
      controls.current.target.copy(introFrom.current.target);
      controls.current.enabled = false;
      controls.current.update();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const key = selectionKey(selected);
    if (key === prevKey.current) return;
    prevKey.current = key;
    if (!introDone.current || !controls.current) return;

    const dir = new THREE.Vector3().subVectors(camera.position, controls.current.target);
    if (dir.lengthSq() < 1e-6) dir.set(0, 6, 10);
    dir.normalize();

    focusFromPos.current.copy(camera.position);
    focusFromTarget.current.copy(controls.current.target);

    if (key === null) {
      focusToTarget.current.copy(OVERVIEW.target);
      focusToPos.current.copy(OVERVIEW.position);
    } else {
      let lookupKey = key;
      if (selected?.kind === "event") {
        const cat = eventCategory(selected.id);
        lookupKey = cat ? `category:${cat}` : "core";
      }
      const point = focusTargets[lookupKey] ?? [0, 1, 0];
      const targetVec = new THREE.Vector3(...point);
      focusToTarget.current.copy(targetVec);
      focusToPos.current.copy(targetVec).addScaledVector(dir, 6.2);
      focusToPos.current.y = Math.max(focusToPos.current.y, targetVec.y + 3);
    }

    focusT.current = 0;
    controls.current.enabled = false;
  }, [selected, camera, focusTargets, eventCategory]);

  useFrame((_, delta) => {
    if (!introDone.current) {
      introT.current = Math.min(introT.current + delta / 2.8, 1);
      const e = easeInOutCubic(introT.current);
      camera.position.lerpVectors(introFrom.current.pos, OVERVIEW.position, e);
      if (controls.current) {
        controls.current.target.lerpVectors(introFrom.current.target, OVERVIEW.target, e);
        controls.current.update();
      }
      if (introT.current >= 1) {
        introDone.current = true;
        if (controls.current) controls.current.enabled = true;
      }
      return;
    }

    if (focusT.current < 1) {
      focusT.current = Math.min(focusT.current + delta / 1.1, 1);
      const e = easeInOutCubic(focusT.current);
      camera.position.lerpVectors(focusFromPos.current, focusToPos.current, e);
      if (controls.current) {
        controls.current.target.lerpVectors(focusFromTarget.current, focusToTarget.current, e);
        controls.current.update();
      }
      if (focusT.current >= 1 && controls.current) {
        controls.current.enabled = true;
      }
    }
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.5}
      zoomSpeed={0.7}
      minDistance={5}
      maxDistance={42}
      minPolarAngle={0.3}
      maxPolarAngle={1.4}
    />
  );
}

export function IntelligenceHub3D({
  data,
  selected,
  onSelect,
}: {
  data: NewsCityData;
  selected: CitySelection | null;
  onSelect: (sel: CitySelection) => void;
}) {
  const sentiment = SENTIMENT_META[data.marketHQ.sentiment];
  const { theme } = useTheme();
  const light = theme === "light";
  const skyBg = light ? SKY_LIGHT : SKY_DARK;

  const macroIntensity = useMemo(
    () => data.macroForces.reduce((sum, f) => sum + f.intensity, 0) / Math.max(data.macroForces.length, 1),
    [data.macroForces]
  );

  // Illustrative activity levels for the mock data layer — swap for a real
  // "how much is this category moving markets right now" score once a live
  // feed is wired up.
  const INTENSITY: Record<NewsCategory, number> = {
    macro: macroIntensity,
    "central-bank": 0.65,
    commodity: 0.5,
    earnings: 0.8,
    markets: data.marketHQ.sentiment === "risk-on" ? 0.75 : 0.55,
    geopolitics: 0.5,
  };

  const focusTargets = useMemo(() => {
    const targets: Record<string, [number, number, number]> = { core: [0, 1.55, 0] };
    NODE_CATEGORIES.forEach((cat, i) => {
      const [x, , z] = nodePosition(i);
      targets[`category:${cat}`] = [x, 1.05, z];
    });
    return targets;
  }, []);

  const eventCategory = useMemo(() => {
    const map = new Map(data.news.map((n) => [n.id, n.category]));
    return (eventId: string) => map.get(eventId) ?? null;
  }, [data.news]);

  const activeCategory: NewsCategory | null =
    selected?.kind === "category" ? selected.id : selected?.kind === "event" ? eventCategory(selected.id) : null;

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      className="!touch-none"
      camera={{ position: [2, 30, 40], fov: 42, near: 0.1, far: 120 }}
    >
      <color attach="background" args={[skyBg]} />
      <fog attach="fog" args={[skyBg, 22, 54]} />

      <ambientLight intensity={light ? 0.75 : 0.32} color={light ? "#ffffff" : "#7fa8c9"} />
      <hemisphereLight args={light ? ["#ffffff", "#cbd5e1", 0.9] : ["#1c2c42", "#05070c", 0.4]} />
      <directionalLight position={[10, 18, 8]} intensity={light ? 0.7 : 0.55} color={light ? "#ffffff" : "#bcd7ea"} castShadow />
      <pointLight position={[0, 6, 0]} intensity={0.7} color={sentiment.hex} distance={26} decay={2} />

      {/* Stars only read on a dark sky — skip them in light mode. */}
      {!light && <Stars radius={90} depth={40} count={2200} factor={2.4} saturation={0} fade speed={0.35} />}

      <Suspense fallback={null}>
        <IntelligenceGrid />

        {NODE_CATEGORIES.map((cat, i) => {
          const pos = nodePosition(i);
          const meta = NEWS_CATEGORY_META[cat];
          return <DataFlow key={cat} from={[pos[0], pos[2]]} to={[0, 0]} color={meta.hex} />;
        })}

        <IntelligenceCore
          overview={data.overview}
          active={selected?.kind === "core"}
          onSelect={() => onSelect({ kind: "core" })}
        />

        {NODE_CATEGORIES.map((cat, i) => {
          const pos = nodePosition(i);
          const meta = NEWS_CATEGORY_META[cat];
          const active = activeCategory === cat;
          const sublabel =
            cat === "central-bank"
              ? "Fed · ECB · BoJ"
              : cat === "commodity"
                ? "Oil · Gold"
                : cat === "macro"
                  ? "CPI · Jobs · GDP"
                  : cat === "earnings"
                    ? "NVDA · MSFT"
                    : "NQ · ES";
          return (
            <CategoryNode
              key={cat}
              position={pos}
              color={meta.hex}
              intensity={INTENSITY[cat]}
              label={meta.label}
              sublabel={sublabel}
              active={active}
              onSelect={() => onSelect({ kind: "category", id: cat })}
            />
          );
        })}
      </Suspense>

      <CameraRig selected={selected} focusTargets={focusTargets} eventCategory={eventCategory} />
    </Canvas>
  );
}
