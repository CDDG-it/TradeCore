"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Line, Html } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "@/lib/theme-context";
import {
  FINANCIAL_CENTERS, HUB_CENTER_ID, latLngToVec3, groupNewsByCenter, type CenterNews,
} from "@/lib/news-city/geo";
import type { NewsItem } from "@/lib/news-city/types";
// Real-world country outlines (coastlines + borders), decoded from the
// world-atlas 110m TopoJSON into flat [lng,lat] polylines.
import WORLD_ARCS from "@/lib/news-city/world-arcs.json";

const R = 5; // globe radius

const TONE_HEX: Record<CenterNews["tone"], string> = {
  up: "#22C55E",
  down: "#EF4444",
  neutral: "#EAB308",
};
const TURQUOISE = "#14B8A6";
const CYAN = "#06B6D4";

// Reusable scratch vectors for per-frame facing checks (avoid allocations).
const _wp = new THREE.Vector3();
const _nrm = new THREE.Vector3();
const _cam = new THREE.Vector3();

/* ── Real country outlines — coastlines + borders drawn on the globe ────── */
function CountryBorders({ color }: { color: string }) {
  const geometry = useMemo(() => {
    const pts: number[] = [];
    const RR = R * 1.004; // sit just above the ocean sphere
    for (const arc of WORLD_ARCS as [number, number][][]) {
      for (let i = 1; i < arc.length; i++) {
        const [lng0, lat0] = arc[i - 1];
        const [lng1, lat1] = arc[i];
        const a = latLngToVec3(lat0, lng0, RR);
        const b = latLngToVec3(lat1, lng1, RR);
        pts.push(a[0], a[1], a[2], b[0], b[1], b[2]);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.85} />
    </lineSegments>
  );
}

/* ── Latitude / longitude wireframe ─────────────────────────────────────── */
function Graticule({ color }: { color: string }) {
  const geometry = useMemo(() => {
    const pts: number[] = [];
    const push = (v: THREE.Vector3) => pts.push(v.x, v.y, v.z);
    const seg = 64;
    // Latitude rings
    for (let lat = -60; lat <= 60; lat += 30) {
      const prev = new THREE.Vector3();
      for (let i = 0; i <= seg; i++) {
        const lng = -180 + (360 / seg) * i;
        const [x, y, z] = latLngToVec3(lat, lng, R);
        const v = new THREE.Vector3(x, y, z);
        if (i > 0) { push(prev); push(v); }
        prev.copy(v);
      }
    }
    // Longitude rings
    for (let lng = -180; lng < 180; lng += 30) {
      const prev = new THREE.Vector3();
      for (let i = 0; i <= seg; i++) {
        const lat = -90 + (180 / seg) * i;
        const [x, y, z] = latLngToVec3(lat, lng, R);
        const v = new THREE.Vector3(x, y, z);
        if (i > 0) { push(prev); push(v); }
        prev.copy(v);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.1} />
    </lineSegments>
  );
}

/* ── One financial-centre marker ────────────────────────────────────────── */
function Marker({
  data, selected, onSelect,
}: {
  data: CenterNews; selected: boolean; onSelect: (id: string) => void;
}) {
  const glow = useRef<THREE.Mesh>(null);
  const posGroup = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const [hovered, setHovered] = useState(false);
  // Whether the city currently faces the camera — drives label visibility so
  // far-side labels don't bleed through the globe.
  const [front, setFront] = useState(true);
  const hex = TONE_HEX[data.tone];
  const surface = useMemo<[number, number, number]>(
    () => latLngToVec3(data.center.lat, data.center.lng, R),
    [data.center.lat, data.center.lng]
  );
  const outward = useMemo(() => new THREE.Vector3(...surface).normalize(), [surface]);
  const beamEnd = useMemo<[number, number, number]>(
    () => [outward.x * R * 1.35, outward.y * R * 1.35, outward.z * R * 1.35],
    [outward]
  );

  useFrame(({ clock }) => {
    if (glow.current) {
      const t = clock.getElapsedTime();
      const base = selected ? 1.5 : hovered ? 1.3 : 1;
      const pulse = 1 + Math.sin(t * 2.4 + surface[0]) * 0.18;
      glow.current.scale.setScalar(base * pulse);
    }
    // Facing test: outward normal at the marker vs. the direction to the camera.
    if (posGroup.current) {
      posGroup.current.getWorldPosition(_wp);
      _nrm.copy(_wp).normalize();
      _cam.copy(camera.position).sub(_wp).normalize();
      const f = _nrm.dot(_cam) > 0.02;
      setFront((prev) => (prev === f ? prev : f));
    }
  });

  const active = selected || hovered;

  return (
    <group>
      {/* Outward beam */}
      <Line points={[surface, beamEnd]} color={hex} lineWidth={active ? 2.2 : 1.2} transparent opacity={active ? 0.9 : 0.5} />

      {/* Core dot + soft glow */}
      <group ref={posGroup} position={surface}>
        <mesh
          onClick={(e) => { e.stopPropagation(); onSelect(data.center.id); }}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto"; }}
        >
          <sphereGeometry args={[0.11, 16, 16]} />
          <meshBasicMaterial color={hex} />
        </mesh>
        <mesh ref={glow}>
          <sphereGeometry args={[0.19, 16, 16]} />
          <meshBasicMaterial color={hex} transparent opacity={0.28} />
        </mesh>

        {/* Label — only while the city faces the camera */}
        {(front || active) && (
          <Html center distanceFactor={11} position={[0, 0.42, 0]} pointerEvents="none" zIndexRange={[20, 0]}>
            <div
              className="select-none whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-semibold"
              style={{
                color: active ? "#fff" : "rgba(255,255,255,0.82)",
                background: active ? `${hex}` : "rgba(11,17,32,0.55)",
                border: `1px solid ${active ? hex : "rgba(255,255,255,0.12)"}`,
              }}
            >
              {data.center.name}
              <span className="ml-1 opacity-70">· {data.items.length}</span>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

/* ── Data-flow arc from the hub to a centre ─────────────────────────────── */
function FlowArc({ from, to, color }: { from: [number, number, number]; to: [number, number, number]; color: string }) {
  const dot = useRef<THREE.Mesh>(null);
  const curve = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const lift = 1 + a.distanceTo(b) / (R * 2.4);
    mid.normalize().multiplyScalar(R * lift);
    return new THREE.QuadraticBezierCurve3(a, mid, b);
  }, [from, to]);
  const points = useMemo(() => curve.getPoints(48), [curve]);

  useFrame(({ clock }) => {
    if (!dot.current) return;
    const t = (clock.getElapsedTime() * 0.32) % 1;
    const p = curve.getPointAt(t);
    dot.current.position.copy(p);
  });

  return (
    <group>
      <Line points={points} color={color} lineWidth={1} transparent opacity={0.28} />
      <mesh ref={dot}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

/* ── The rotating globe assembly ────────────────────────────────────────── */
function Globe({
  centers, selected, onSelect, dark,
}: {
  centers: CenterNews[]; selected: string | null; onSelect: (id: string) => void; dark: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current && !selected) group.current.rotation.y += delta * 0.045;
  });

  const hub = useMemo<[number, number, number]>(() => {
    const c = FINANCIAL_CENTERS.find((x) => x.id === HUB_CENTER_ID)!;
    return latLngToVec3(c.lat, c.lng, R);
  }, []);

  return (
    <group ref={group}>
      {/* Base sphere (ocean) */}
      <mesh>
        <sphereGeometry args={[R, 48, 48]} />
        <meshPhongMaterial
          color={dark ? "#0e1a33" : "#dbe6f5"}
          emissive={dark ? "#0a1428" : "#c3d4ea"}
          transparent
          opacity={0.92}
          shininess={8}
        />
      </mesh>
      {/* Atmosphere shell */}
      <mesh>
        <sphereGeometry args={[R * 1.06, 48, 48]} />
        <meshBasicMaterial color={TURQUOISE} transparent opacity={0.05} side={THREE.BackSide} />
      </mesh>

      {/* Faint lat/long grid behind the land for a globe feel */}
      <Graticule color={dark ? CYAN : "#7d8ba1"} />
      {/* The real world map — country borders + coastlines */}
      <CountryBorders color={dark ? "#4fe6cf" : "#1f6f7d"} />

      {/* Arcs from the New York hub */}
      {centers
        .filter((c) => c.center.id !== HUB_CENTER_ID)
        .map((c) => (
          <FlowArc key={`arc-${c.center.id}`} from={hub} to={latLngToVec3(c.center.lat, c.center.lng, R)} color={CYAN} />
        ))}

      {/* Markers */}
      {centers.map((c) => (
        <Marker key={c.center.id} data={c} selected={selected === c.center.id} onSelect={onSelect} />
      ))}
    </group>
  );
}

/* ── Public component ───────────────────────────────────────────────────── */
export function WorldMap3D({
  news, selected, onSelect,
}: {
  news: NewsItem[]; selected: string | null; onSelect: (id: string | null) => void;
}) {
  const { theme } = useTheme();
  const dark = theme !== "light";
  const centers = useMemo(() => groupNewsByCenter(news), [news]);

  return (
    <Canvas camera={{ position: [0, 3, R * 3.1], fov: 42 }} onPointerMissed={() => onSelect(null)}>
      <ambientLight intensity={dark ? 0.6 : 0.9} />
      <directionalLight position={[8, 6, 10]} intensity={dark ? 1.1 : 1.3} color={dark ? "#bfe9ff" : "#ffffff"} />
      <pointLight position={[-10, -4, -8]} intensity={0.5} color={TURQUOISE} />

      <Globe centers={centers} selected={selected} onSelect={onSelect} dark={dark} />

      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={R * 1.6}
        maxDistance={R * 5}
        rotateSpeed={0.5}
        autoRotate={false}
      />
    </Canvas>
  );
}
