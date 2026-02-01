import { EraPreset } from "../config/loadConfig";
import { clamp } from "../util/math";

export type EraConstraints = {
  renderWidth: number;
  renderHeight: number;
  smoothing: boolean;
  palette?: readonly [number, number, number][];
  overlayScanline: number;
  overlayVignette: number;
  cameraShake: number;
  cameraZoom: number;
  cameraPan: number;
};

export const C64_PALETTE: readonly [number, number, number][] = [
  [0, 0, 0],
  [255, 255, 255],
  [136, 0, 0],
  [170, 255, 238],
  [204, 68, 204],
  [0, 204, 85],
  [0, 0, 170],
  [238, 238, 119],
  [221, 136, 85],
  [102, 68, 0],
  [255, 119, 119],
  [51, 51, 51],
  [119, 119, 119],
  [170, 255, 102],
  [0, 136, 255],
  [187, 187, 187]
];

export function getEraConstraints(era: EraPreset, baseWidth: number, baseHeight: number): EraConstraints {
  switch (era) {
    case "8bit":
      return {
        renderWidth: 240,
        renderHeight: 135,
        smoothing: false,
        palette: C64_PALETTE,
        overlayScanline: 0.2,
        overlayVignette: 0,
        cameraShake: 0.1,
        cameraZoom: 0.15,
        cameraPan: 0.15
      };
    case "16bit":
      return {
        renderWidth: Math.round(baseWidth * 1.5),
        renderHeight: Math.round(baseHeight * 1.5),
        smoothing: false,
        overlayScanline: 0.45,
        overlayVignette: 0.25,
        cameraShake: 0.35,
        cameraZoom: 0.4,
        cameraPan: 0.4
      };
    case "ps1":
      return {
        renderWidth: baseWidth,
        renderHeight: baseHeight,
        smoothing: true,
        overlayScanline: 0.6,
        overlayVignette: 0.45,
        cameraShake: 0.6,
        cameraZoom: 0.65,
        cameraPan: 0.65
      };
    case "pcdemo":
      return {
        renderWidth: baseWidth,
        renderHeight: baseHeight,
        smoothing: true,
        overlayScanline: 1,
        overlayVignette: 0.9,
        cameraShake: 1,
        cameraZoom: 1,
        cameraPan: 1
      };
    case "future":
      return {
        renderWidth: baseWidth,
        renderHeight: baseHeight,
        smoothing: true,
        overlayScanline: 1.2,
        overlayVignette: 1.05,
        cameraShake: 1.35,
        cameraZoom: 1.2,
        cameraPan: 1.2
      };
    default: {
      const _exhaustiveCheck: never = era;
      return _exhaustiveCheck;
    }
  }
}

export function quantizeToPalette(
  data: Uint8ClampedArray,
  palette: readonly [number, number, number][]
): void {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (let p = 0; p < palette.length; p += 1) {
      const [pr, pg, pb] = palette[p];
      const distance = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = p;
      }
    }

    const [nr, ng, nb] = palette[closestIndex];
    data[i] = clamp(Math.round(nr), 0, 255);
    data[i + 1] = clamp(Math.round(ng), 0, 255);
    data[i + 2] = clamp(Math.round(nb), 0, 255);
  }
}
