"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "@/lib/theme-context";
import { buildGlobeTextures } from "@/lib/news-city/globe-texture";

const R = 5; // globe radius

const TURQUOISE = "#14B8A6";
const CYAN = "#06B6D4";

// The sun direction — fixed, so the globe keeps a stable, gentle terminator.
const SUN = new THREE.Vector3(1, 0.35, 0.7).normalize().multiplyScalar(30);

/* ── Earth surface — real coastlines, brand palette ─────────────────────── */
function EarthSurface({ dark }: { dark: boolean }) {
  const { gl } = useThree();
  const { map, roughnessMap } = useMemo(() => {
    const { color, roughness } = buildGlobeTextures(dark);
    const m = new THREE.CanvasTexture(color);
    const r = new THREE.CanvasTexture(roughness);
    for (const t of [m, r]) {
      t.colorSpace = t === m ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      // Max anisotropy keeps the coastlines sharp where the sphere turns away
      // from the camera — the other half of fixing the pixelated look.
      t.anisotropy = gl.capabilities.getMaxAnisotropy();
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.generateMipmaps = true;
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
        emissive={new THREE.Color(dark ? "#062338" : "#0a3050")}
        emissiveIntensity={dark ? 0.2 : 0.08}
      />
    </mesh>
  );
}

/* ── Atmosphere — fresnel rim in brand cyan ─────────────────────────────── */
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
      uColor: { value: new THREE.Color(CYAN) },
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

/* ── The slowly rotating globe ──────────────────────────────────────────── */
function Globe({ dark }: { dark: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.035;
  });

  return (
    <group ref={group}>
      <EarthSurface dark={dark} />
      <Atmosphere intensity={dark ? 0.9 : 0.6} />
    </group>
  );
}

/* ── Public component ───────────────────────────────────────────────────── */
export function WorldMap3D() {
  const { theme } = useTheme();
  const dark = theme !== "light";

  return (
    <Canvas
      camera={{ position: [0, 4, R * 3.05], fov: 42 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <directionalLight position={SUN} intensity={dark ? 1.6 : 2.1} color="#fff6e8" />
      {/* Ambient is deliberately generous: a true terminator would leave half the
          map unreadable, and this is a dashboard first. */}
      <ambientLight intensity={dark ? 0.62 : 0.75} />
      <hemisphereLight args={[CYAN, "#050a16", dark ? 0.35 : 0.5]} />
      <pointLight position={[-18, -6, -12]} intensity={0.5} color={TURQUOISE} />

      {dark && <Stars radius={120} depth={60} count={2600} factor={3.2} saturation={0} fade speed={0.4} />}

      <Globe dark={dark} />

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
