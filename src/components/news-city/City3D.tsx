"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { CityGround } from "./scene/CityGround";
import { MarketCore } from "./scene/MarketCore";
import { CentralBankDistrict } from "./scene/CentralBankDistrict";
import { CommodityHarbor } from "./scene/CommodityHarbor";
import { MacroBattlefield } from "./scene/MacroBattlefield";
import { NasdaqHQ } from "./scene/NasdaqHQ";
import { FlowLink } from "./scene/FlowLink";
import { SENTIMENT_META } from "@/lib/news-city/ui";
import type { NewsCityData } from "@/lib/news-city/types";
import type { CitySelection } from "./selection";
import { selectionKey } from "./selection";

const SKY_BG = "#05070c";

/** Default "sit above the whole map" establishing view. */
const OVERVIEW = {
  position: new THREE.Vector3(0, 13.5, 21),
  target: new THREE.Vector3(0, 1, 0),
};

/** Where the camera dollies in to when a location is selected — mirrors the
 *  fixed world positions each district renders at. */
const FOCUS_TARGETS: Record<string, [number, number, number]> = {
  core: [0, 1.3, 0],
  "bank:fed": [-10.0, 1.2, -8.6],
  "bank:ecb": [-6.0, 1.5, -6.0],
  "bank:boj": [-8.6, 1.1, -11.0],
  "commodity:oil": [7.5, 0.6, -9.0],
  "commodity:gold": [9.7, 0.6, -6.6],
  "macro:inflation": [-10.2, 0.8, 6.4],
  "macro:employment": [-7.6, 0.8, 10.4],
  "macro:growth": [-5.4, 0.8, 6.4],
  hq: [8.4, 2.0, 7.8],
};

function easeInOutCubic(x: number) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/**
 * Drives the camera: a one-time cinematic descent into the world on load,
 * then hands full rotate/zoom control to the user via OrbitControls. Selecting
 * a location dollies the camera toward it along the current viewing angle
 * (rather than cutting or orbiting around it), so it reads as "the camera
 * moves through a fixed world" instead of "the world spins past the camera".
 */
function CameraRig({ selected }: { selected: CitySelection | null }) {
  const { camera } = useThree();
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null);

  const introDone = useRef(false);
  const introT = useRef(0);
  const introFrom = useRef({
    pos: new THREE.Vector3(2, 32, 44),
    target: new THREE.Vector3(0, 2, 0),
  });

  const focusT = useRef(1); // 1 = settled, nothing in flight
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
    // Intro/focus rig owns the camera imperatively; only run on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const key = selectionKey(selected);
    if (key === prevKey.current) return;
    prevKey.current = key;
    if (!introDone.current || !controls.current) return; // let the intro finish first

    const dir = new THREE.Vector3().subVectors(camera.position, controls.current.target);
    if (dir.lengthSq() < 1e-6) dir.set(0, 6, 10);
    dir.normalize();

    focusFromPos.current.copy(camera.position);
    focusFromTarget.current.copy(controls.current.target);

    if (key === null) {
      focusToTarget.current.copy(OVERVIEW.target);
      focusToPos.current.copy(OVERVIEW.position);
    } else {
      const point = FOCUS_TARGETS[key] ?? [0, 1, 0];
      const targetVec = new THREE.Vector3(...point);
      focusToTarget.current.copy(targetVec);
      focusToPos.current.copy(targetVec).addScaledVector(dir, 6.5);
      focusToPos.current.y = Math.max(focusToPos.current.y, targetVec.y + 3);
    }

    focusT.current = 0;
    controls.current.enabled = false;
  }, [selected, camera]);

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
      minDistance={5.5}
      maxDistance={34}
      minPolarAngle={0.3}
      maxPolarAngle={1.4}
    />
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
  const sentiment = SENTIMENT_META[data.marketHQ.sentiment];

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      className="!touch-none"
      camera={{ position: [2, 32, 44], fov: 42, near: 0.1, far: 120 }}
    >
      <color attach="background" args={[SKY_BG]} />
      <fog attach="fog" args={[SKY_BG, 20, 46]} />

      <ambientLight intensity={0.32} color="#7fa8c9" />
      <hemisphereLight args={["#1c2c42", "#05070c", 0.4]} />
      <directionalLight position={[10, 18, 8]} intensity={0.55} color="#bcd7ea" castShadow />
      <pointLight position={[0, 6, 0]} intensity={0.7} color={sentiment.hex} distance={30} decay={2} />

      <Stars radius={90} depth={40} count={2200} factor={2.4} saturation={0} fade speed={0.35} />

      <Suspense fallback={null}>
        <CityGround />

        {/* Data highways linking every district back to the Market Core. */}
        <FlowLink from={[0, 0]} to={[-8.4, -8.4]} color="#f9a15c" />
        <FlowLink from={[0, 0]} to={[8.4, -7.8]} color="#5fc0d8" />
        <FlowLink from={[0, 0]} to={[-8.4, 7.8]} color="#e0705c" />
        <FlowLink from={[0, 0]} to={[8.4, 7.8]} color="#f97316" />

        <MarketCore
          overview={data.overview}
          active={selected?.kind === "core"}
          onSelect={() => onSelect({ kind: "core" })}
        />

        <CentralBankDistrict
          banks={data.centralBanks}
          selected={selected}
          onSelect={(id) => onSelect({ kind: "bank", id })}
        />

        <CommodityHarbor
          commodities={data.commodities}
          selected={selected}
          onSelect={(id) => onSelect({ kind: "commodity", id })}
        />

        <MacroBattlefield
          forces={data.macroForces}
          selected={selected}
          onSelect={(id) => onSelect({ kind: "macro", id })}
        />

        <NasdaqHQ
          hq={data.marketHQ}
          selected={selected}
          onSelect={() => onSelect({ kind: "hq" })}
        />
      </Suspense>

      <CameraRig selected={selected} />
    </Canvas>
  );
}
