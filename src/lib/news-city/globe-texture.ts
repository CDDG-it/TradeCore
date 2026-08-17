/**
 * Builds the globe's surface textures at runtime by drawing the real world
 * coastline polygons onto an equirectangular canvas.
 *
 * Two maps come out of one pass:
 *   • colour     — deep ocean gradient + filled landmasses (ice toward the poles)
 *   • roughness  — ocean smooth (so it catches a specular highlight), land matte
 *
 * Drawing to a canvas rather than triangulating on the sphere keeps the
 * antimeridian and polar caps artefact-free, and needs no texture downloads.
 */

import LAND from "./world-land.json";

type Ring = [number, number][];
type Polygon = Ring[]; // [outer, ...holes]

// 4K equirectangular: at this size the coastlines stay crisp even zoomed in,
// which is what removes the "pixelated" look on a 5-unit sphere.
const W = 4096;
const H = 2048;

/** Equirectangular projection — lng/lat degrees to canvas pixels. */
const px = (lng: number) => ((lng + 180) / 360) * W;
const py = (lat: number) => ((90 - lat) / 180) * H;

/** Split a ring wherever it wraps across the antimeridian, so fills never
 *  streak horizontally across the whole map. */
function splitAtWrap(ring: Ring): Ring[] {
  const parts: Ring[] = [];
  let cur: Ring = [];
  for (let i = 0; i < ring.length; i++) {
    if (i > 0 && Math.abs(ring[i][0] - ring[i - 1][0]) > 180) {
      if (cur.length > 1) parts.push(cur);
      cur = [];
    }
    cur.push(ring[i]);
  }
  if (cur.length > 1) parts.push(cur);
  return parts.length ? parts : [ring];
}

function meanAbsLat(ring: Ring): number {
  let s = 0;
  for (const [, lat] of ring) s += Math.abs(lat);
  return s / Math.max(1, ring.length);
}

/** Mix two hex colours, t = 0..1. */
function mix(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function tracePolygon(ctx: CanvasRenderingContext2D, poly: Polygon) {
  ctx.beginPath();
  for (const ring of poly) {
    for (const part of splitAtWrap(ring)) {
      part.forEach(([lng, lat], i) => {
        const x = px(lng), y = py(lat);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
    }
  }
}

export interface GlobeTextures {
  color: HTMLCanvasElement;
  roughness: HTMLCanvasElement;
}

/**
 * Palette — the TradingMC brand in its blue register, not photographic Earth:
 * navy oceans, steel-blue land, cyan coastlines and pale-blue ice. Only the
 * *shapes* are real; the colours stay on-brand.
 */
const OCEAN_DEEP = "#060c1a";     // navy, near the app background
const OCEAN_SHALLOW = "#0a1c33";  // navy lifted toward blue
const OCEAN_EQUATOR = "#0f2f4d";  // brightest blue at the equator
const LAND_BASE = "#1c6b8f";      // steel-blue landmass
const LAND_EDGE = "#06B6D4";      // brand cyan coastline
const LAND_POLAR = "#cfeefb";     // pale blue ice

export function buildGlobeTextures(dark: boolean): GlobeTextures {
  const color = document.createElement("canvas");
  color.width = W; color.height = H;
  const cc = color.getContext("2d")!;

  const rough = document.createElement("canvas");
  rough.width = W; rough.height = H;
  const rc = rough.getContext("2d")!;

  // ── Ocean base: a vertical gradient (lighter round the equator) ──────────
  const g = cc.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, OCEAN_DEEP);
  g.addColorStop(0.35, OCEAN_SHALLOW);
  g.addColorStop(0.5, dark ? OCEAN_EQUATOR : "#17415e");
  g.addColorStop(0.65, OCEAN_SHALLOW);
  g.addColorStop(1, OCEAN_DEEP);
  cc.fillStyle = g;
  cc.fillRect(0, 0, W, H);

  // Ocean is only slightly smoother than land — enough for a hint of sheen at
  // the sub-solar point, not a mirror blob.
  rc.fillStyle = "#a8a8a8";
  rc.fillRect(0, 0, W, H);

  // ── Landmasses ──────────────────────────────────────────────────────────
  const polys = LAND as unknown as Polygon[];
  for (const poly of polys) {
    if (!poly.length || poly[0].length < 3) continue;
    const lat = meanAbsLat(poly[0]);
    // Blend toward ice above ~58° so Greenland and Antarctica read as polar.
    const icy = Math.min(1, Math.max(0, (lat - 58) / 22));
    const fill = mix(LAND_BASE, LAND_POLAR, icy);

    tracePolygon(cc, poly);
    cc.fillStyle = fill;
    cc.fill("evenodd");
    // Coastline in brand cyan — this is what makes the borders legible.
    // Scaled with the canvas so it stays a hairline at any texture size.
    cc.strokeStyle = mix(LAND_EDGE, LAND_POLAR, icy);
    cc.lineWidth = Math.max(1, W / 1700);
    cc.lineJoin = "round";
    cc.stroke();

    // Land is matte in the roughness map.
    tracePolygon(rc, poly);
    rc.fillStyle = "#efefef";
    rc.fill("evenodd");
  }

  return { color, roughness: rough };
}
