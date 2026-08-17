"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Line, Stars } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "@/lib/theme-context";
import {
  FINANCIAL_CENTERS, HUB_CENTER_ID, latLngToVec3, groupNewsByCenter, type CenterNews,
} from "@/lib/news-city/geo";
import { buildGlobeTextures } from "@/lib/news-city/globe-texture";
import type { NewsItem } from "@/lib/news-city/types";

const R = 5; // globe radius

const TONE_HEX: Record<CenterNews["tone"], string> = {
  up: "#22C55E",
  down: "#EF4444",
  neutral: "#EAB308",
};
const TURQUOISE = "#14B8A6";
const CYAN = "#06B6D4";
const ATMO = "#5fb4ff";

// The sun direction — fixed, so the globe has a stable day/night terminator.
const SUN = new THREE.Vector3(1, 0.35, 0.7).normalize().multiplyScalar(30);

// Scratch vectors for per-frame facing checks (no per-frame allocation).
const _wp = new THREE.Vector3();
const _nrm = new THREE.Vector3();
const _cam = new THREE.Vector3();

/* ── Earth surface — real coastlines drawn to a canvas, used as the map ──── */
function EarthSurface({ dark }: { dark: boolean }) {
  const { gl } = useThree();
  const { map, roughnessMap } = useMemo(() => {
    const { color, roughness } = buildGlobeTextures(dark);
    const m = new THREE.CanvasTexture(color);
    const r = new THREE.CanvasTexture(roughness);
    for (const t of [m, r]) {
      t.colorSpace = t === m ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
      t.needsUpdate = true;
    }
    return { map: m, roughnessMap: r };
  }, [dark, gl]);

  // Deliberately not disposed in an effect cleanup: React StrictMode runs
  // mount → cleanup → mount, which would dispose the very textures the live
  // material still points at. They are freed with the WebGL context instead.

  return (
    <mesh>
      <sphereGeometry args={[R, 96, 96]} />
      <meshStandardMaterial
        map={map}
        roughnessMap={roughnessMap}
        metalness={0.04}
        roughness={1}
        emissive={new THREE.Color(dark ? "#04263f" : "#0a3050")}
        emissiveIntensity={dark ? 0.18 : 0.08}
      />
    </mesh>
  );
}

/* ── Atmosphere — fresnel rim glow, inside and out ──────────────────────── */
const ATMO_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;
const ATMO_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uPower;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float f = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), uPower);
    gl_FragColor = vec4(uColor, clamp(f * uIntensity, 0.0, 1.0));
  }
`;

function Atmosphere({ intensity }: { intensity: number }) {
  // A single back-side shell with a steep falloff, so the glow reads as a thin
  // band of air hugging the limb rather than a bubble around the planet.
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(ATMO) },
      uPower: { value: 5.5 },
      uIntensity: { value: intensity },
    }),
    [intensity]
  );
  return (
    <mesh scale={1.02}>
      <sphereGeometry args={[R, 64, 64]} />
      <shaderMaterial
        vertexShader={ATMO_VERT}
        fragmentShader={ATMO_FRAG}
        uniforms={uniforms}
        transparent
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ── One financial-centre marker — a pin of light, no label ─────────────── */
function Marker({
  data, selected, onSelect,
}: {
  data: CenterNews; selected: boolean; onSelect: (id: string) => void;
}) {
  const glow = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const holder = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const [hovered, setHovered] = useState(false);
  const [front, setFront] = useState(true);
  const hex = TONE_HEX[data.tone];

  const surface = useMemo<[number, number, number]>(
    () => latLngToVec3(data.center.lat, data.center.lng, R),
    [data.center.lat, data.center.lng]
  );
  const outward = useMemo(() => new THREE.Vector3(...surface).normalize(), [surface]);
  const beamEnd = useMemo<[number, number, number]>(
    () => [outward.x * R * 1.28, outward.y * R * 1.28, outward.z * R * 1.28],
    [outward]
  );
  // Orient the halo ring flat against the surface.
  const ringQuat = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), outward);
    return q;
  }, [outward]);

  const active = selected || hovered;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (glow.current) {
      const base = selected ? 1.55 : hovered ? 1.3 : 1;
      glow.current.scale.setScalar(base * (1 + Math.sin(t * 2.4 + surface[0]) * 0.16));
    }
    // Expanding "ping" ring on the surface.
    if (ring.current) {
      const p = ((t * 0.55 + Math.abs(surface[1])) % 1);
      ring.current.scale.setScalar(0.5 + p * 2.2);
      const mat = ring.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - p) * (active ? 0.75 : 0.45);
    }
    // Only render the beam/marker chrome while the city faces the camera.
    if (holder.current) {
      holder.current.getWorldPosition(_wp);
      _nrm.copy(_wp).normalize();
      _cam.copy(camera.position).sub(_wp).normalize();
      const f = _nrm.dot(_cam) > -0.05;
      setFront((prev) => (prev === f ? prev : f));
    }
  });

  return (
    <group>
      {front && (
        <Line
          points={[surface, beamEnd]}
          color={hex}
          lineWidth={active ? 2.4 : 1.3}
          transparent
          opacity={active ? 0.95 : 0.55}
        />
      )}

      <group ref={holder} position={surface}>
        {/* Hit target + core dot */}
        <mesh
          onClick={(e) => { e.stopPropagation(); onSelect(data.center.id); }}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto"; }}
        >
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshBasicMaterial color={hex} toneMapped={false} />
        </mesh>
        <mesh ref={glow}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color={hex} transparent opacity={0.3} depthWrite={false} toneMapped={false} />
        </mesh>
        {/* Surface ping */}
        <mesh ref={ring} quaternion={ringQuat} visible={front}>
          <ringGeometry args={[0.16, 0.2, 40]} />
          <meshBasicMaterial color={hex} transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
        </mesh>
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
    const lift = 1 + a.distanceTo(b) / (R * 2.6);
    mid.normalize().multiplyScalar(R * lift);
    return new THREE.QuadraticBezierCurve3(a, mid, b);
  }, [from, to]);
  const points = useMemo(() => curve.getPoints(64), [curve]);
  const offset = useMemo(() => Math.random(), []);

  useFrame(({ clock }) => {
    if (!dot.current) return;
    const t = (clock.getElapsedTime() * 0.3 + offset) % 1;
    dot.current.position.copy(curve.getPointAt(t));
  });

  return (
    <group>
      <Line points={points} color={color} lineWidth={1} transparent opacity={0.3} />
      <mesh ref={dot}>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
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
    if (group.current && !selected) group.current.rotation.y += delta * 0.035;
  });

  const hub = useMemo<[number, number, number]>(() => {
    const c = FINANCIAL_CENTERS.find((x) => x.id === HUB_CENTER_ID)!;
    return latLngToVec3(c.lat, c.lng, R);
  }, []);

  return (
    <group ref={group}>
      <EarthSurface dark={dark} />
      <Atmosphere intensity={dark ? 0.9 : 0.6} />

      {/* Arcs from the New York hub */}
      {centers
        .filter((c) => c.center.id !== HUB_CENTER_ID)
        .map((c) => (
          <FlowArc key={`arc-${c.center.id}`} from={hub} to={latLngToVec3(c.center.lat, c.center.lng, R)} color={CYAN} />
        ))}

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
    <Canvas
      camera={{ position: [0, 4, R * 3.05], fov: 42 }}
      onPointerMissed={() => onSelect(null)}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      {/* Sun + a cool fill so the night side isn't pitch black */}
      <directionalLight position={SUN} intensity={dark ? 1.6 : 2.1} color="#fff6e8" />
      {/* Ambient is deliberately generous: a true terminator would leave half the
          map unreadable, and this is a dashboard first. */}
      <ambientLight intensity={dark ? 0.62 : 0.75} />
      <hemisphereLight args={[ATMO, "#050a16", dark ? 0.35 : 0.5]} />
      <pointLight position={[-18, -6, -12]} intensity={0.5} color={TURQUOISE} />

      {dark && <Stars radius={120} depth={60} count={2600} factor={3.2} saturation={0} fade speed={0.4} />}

      <Globe centers={centers} selected={selected} onSelect={onSelect} dark={dark} />

      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={R * 1.35}
        maxDistance={R * 4.6}
        rotateSpeed={0.45}
        zoomSpeed={0.7}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  );
}
