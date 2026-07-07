"use client";

import * as THREE from "three";

/**
 * Procedurally draws a window-grid facade onto a canvas and caches the result
 * per (base, lit) colour pair, so buildings read as real structures instead of
 * flat colour blocks without needing any external texture assets.
 */
const cache = new Map<string, THREE.CanvasTexture>();

export function getFacadeTexture(baseColor: string, litColor: string): THREE.CanvasTexture {
  const key = `${baseColor}|${litColor}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cols = 5;
  const rows = 11;
  const padX = 6;
  const padY = 5;
  const cellW = canvas.width / cols;
  const cellH = canvas.height / rows;

  // Deterministic pseudo-random so the texture doesn't change identity on
  // re-generation (same seed pattern every time for a given cache key).
  let seed = 42;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return (seed % 1000) / 1000;
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellW + padX / 2;
      const y = r * cellH + padY / 2;
      const w = cellW - padX;
      const h = cellH - padY;
      const lit = rand() > 0.68;
      ctx.fillStyle = lit ? litColor : "rgba(20,16,10,0.35)";
      ctx.fillRect(x, y, w, h);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  cache.set(key, texture);
  return texture;
}
