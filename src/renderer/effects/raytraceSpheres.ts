import { clamp, lerp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

const MAX_SPHERES = 10;
const EPSILON = 0.001;
const QUALITY_SCALE: Record<number, number> = {
  1: 0.75,
  2: 1.0,
  3: 1.5,
};
const AA_OFFSETS_2 = [0.25, 0.25, -0.25, -0.25];
const AA_OFFSETS_4 = [0.25, 0.25, 0.25, -0.25, -0.25, 0.25, -0.25, -0.25];

export type RaytraceQualitySettings = {
  quality: number;
  internalScale: number;
  bufW: number;
  bufH: number;
  sphereCount: number;
  cellSize: number;
  adaptive: boolean;
  refineThreshold: number;
  refineGrow: boolean;
  aa: number;
  aaMode: "full" | "refinedOnly";
  outputSmoothing: boolean;
  forceAA: boolean;
};

const LIGHT_DIR = (() => {
  const x = 0.5;
  const y = 0.8;
  const z = -0.2;
  const length = Math.hypot(x, y, z) || 1;
  return { x: x / length, y: y / length, z: z / length };
})();

type RGB = { r: number; g: number; b: number };

const hslToRgb = (h: number, s: number, l: number, out: RGB): void => {
  const hue = ((h % 1) + 1) % 1;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const hue2rgb = (t: number): number => {
    let temp = t;
    if (temp < 0) temp += 1;
    if (temp > 1) temp -= 1;
    if (temp < 1 / 6) return p + (q - p) * 6 * temp;
    if (temp < 1 / 2) return q;
    if (temp < 2 / 3) return p + (q - p) * (2 / 3 - temp) * 6;
    return p;
  };

  out.r = Math.round(hue2rgb(hue + 1 / 3) * 255);
  out.g = Math.round(hue2rgb(hue) * 255);
  out.b = Math.round(hue2rgb(hue - 1 / 3) * 255);
};

const mulberry32 = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const coerceAA = (value: number): number => {
  if (value >= 4) {
    return 4;
  }
  if (value >= 2) {
    return 2;
  }
  return 0;
};

export const resolveRaytraceQualitySettings = (
  params: Record<string, unknown>,
  width: number,
  height: number
): RaytraceQualitySettings => {
  const quality = clamp(Math.round((params.quality as number) ?? 2), 1, 3);
  const internalScale = clamp(QUALITY_SCALE[quality] ?? 1.0, 0.5, 2.0);
  const hasBufW = params.bufW !== undefined && params.bufW !== null;
  const hasBufH = params.bufH !== undefined && params.bufH !== null;
  const baseBufW = hasBufW ? Number(params.bufW) : Math.round(width * internalScale);
  const baseBufH = hasBufH ? Number(params.bufH) : Math.round(height * internalScale);
  const minBufW = hasBufW ? 80 : 160;
  const minBufH = hasBufH ? 60 : 120;
  const bufW = clamp(Math.round(baseBufW), minBufW, 1280);
  const bufH = clamp(Math.round(baseBufH), minBufH, 960);
  const sphereCount = clamp(Math.round((params.sphereCount as number) ?? 3), 1, MAX_SPHERES);
  const cellSizeDefault = quality >= 3 ? 2 : 3;
  const cellSize = clamp(Math.round((params.cellSize as number) ?? cellSizeDefault), 1, 6);
  const adaptive = Boolean(params.adaptive ?? 1);
  const refineDefault = quality >= 3 ? 50 : 80;
  const refineThreshold = clamp((params.refineThreshold as number) ?? refineDefault, 20, 255);
  const refineGrowDefault = quality >= 3;
  const refineGrow = Boolean(params.refineGrow ?? refineGrowDefault);
  const aaDefault = quality >= 3 ? 2 : 0;
  const aa = coerceAA(Math.round((params.aa as number) ?? aaDefault));
  const aaMode = params.aaMode === "full" ? "full" : "refinedOnly";
  const outputSmoothing = Boolean(params.outputSmoothing ?? false);
  const forceAA = Boolean(params.forceAA ?? false);
  const pixelCount = bufW * bufH;
  const finalAA = aa === 4 && pixelCount > 600_000 && !forceAA ? 2 : aa;

  return {
    quality,
    internalScale,
    bufW,
    bufH,
    sphereCount,
    cellSize,
    adaptive,
    refineThreshold,
    refineGrow,
    aa: finalAA,
    aaMode,
    outputSmoothing,
    forceAA,
  };
};

export const raySphereIntersection = (
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  cx: number,
  cy: number,
  cz: number,
  radius: number
): number | null => {
  const ocx = ox - cx;
  const ocy = oy - cy;
  const ocz = oz - cz;
  const b = ocx * dx + ocy * dy + ocz * dz;
  const c = ocx * ocx + ocy * ocy + ocz * ocz - radius * radius;
  const h = b * b - c;
  if (h < 0) {
    return null;
  }
  const sqrtH = Math.sqrt(h);
  const t = -b - sqrtH;
  if (t > EPSILON) {
    return t;
  }
  const t2 = -b + sqrtH;
  if (t2 > EPSILON) {
    return t2;
  }
  return null;
};

export const rayPlaneIntersection = (
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  planeY: number
): number | null => {
  const denom = dy;
  if (Math.abs(denom) < EPSILON) {
    return null;
  }
  const t = (planeY - oy) / denom;
  if (t > EPSILON) {
    return t;
  }
  return null;
};

export class RaytraceSpheresEffect implements Effect {
  private bufferCanvas: HTMLCanvasElement | null = null;
  private bufferCtx: CanvasRenderingContext2D | null = null;
  private imageData: ImageData | null = null;
  private data: Uint8ClampedArray | null = null;
  private bufW = 0;
  private bufH = 0;
  private cellSize = 0;
  private cellW = 0;
  private cellH = 0;
  private cellRGB = new Uint8ClampedArray(0);
  private refineMask = new Uint8Array(0);
  private refineMask2 = new Uint8Array(0);
  private cellHit = new Uint8Array(0);

  private sphereCount = 0;
  private sphereSeed = 0;
  private spherePhases = new Float32Array(MAX_SPHERES);
  private sphereColors = new Float32Array(MAX_SPHERES * 3);
  private sphereReflect = new Float32Array(MAX_SPHERES);
  private sphereBaseRadius = new Float32Array(MAX_SPHERES);
  private spherePos = new Float32Array(MAX_SPHERES * 3);
  private sphereRadius = new Float32Array(MAX_SPHERES);

  private colorStack: Float32Array[] = [];
  private aaScratch = new Float32Array(3);

  private maxDepth = 2;
  private ambient = 0.12;
  private diffuseStrength = 1.0;
  private specStrength = 0.45;
  private shininess = 48;
  private floorReflect = 0.55;
  private planeY = -1.1;
  private pointLight = new Float32Array(3);
  private pointLightIntensity = 0.35;
  private camera = { x: 0, y: 0, z: 0 };
  private forward = { x: 0, y: 0, z: 1 };
  private right = { x: 1, y: 0, z: 0 };
  private up = { x: 0, y: 1, z: 0 };

  reset(): void {
    this.bufferCanvas = null;
    this.bufferCtx = null;
    this.imageData = null;
    this.data = null;
    this.bufW = 0;
    this.bufH = 0;
    this.cellSize = 0;
    this.cellW = 0;
    this.cellH = 0;
    this.cellRGB = new Uint8ClampedArray(0);
    this.refineMask = new Uint8Array(0);
    this.refineMask2 = new Uint8Array(0);
    this.cellHit = new Uint8Array(0);
  }

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const qualitySettings = resolveRaytraceQualitySettings(params, width, height);
    const bufW = qualitySettings.bufW;
    const bufH = qualitySettings.bufH;
    const sphereCount = qualitySettings.sphereCount;
    const seed = Math.round(params.seed ?? 1337);
    const fov = clamp(params.fov ?? 60, 35, 90);
    const cellSize = qualitySettings.cellSize;
    const adaptive = qualitySettings.adaptive;
    const refineThreshold = qualitySettings.refineThreshold;
    const refineGrow = qualitySettings.refineGrow;
    const aa = qualitySettings.aa;
    const aaMode = qualitySettings.aaMode;
    const outputSmoothing = qualitySettings.outputSmoothing;

    const audioReact = clamp(params.audioReact ?? 0.6, 0, 1);
    const beatKick = clamp(params.beatKick ?? 0.7, 0, 1);
    const bassBoost = audio.bass * audioReact;
    const beatBoost = audio.beatStrength * beatKick;

    this.maxDepth = clamp(Math.round(params.maxDepth ?? 2), 1, 3);
    this.ambient = clamp(params.ambient ?? 0.12, 0.05, 0.4);
    this.diffuseStrength = clamp(params.diffuseStrength ?? 1.0, 0.2, 2.0);
    const baseSpecStrength = clamp(params.specStrength ?? 0.45, 0, 2.0);
    this.specStrength = clamp(baseSpecStrength * (1 + beatBoost * 0.8), 0, 2.5);
    this.shininess = clamp(params.shininess ?? 48, 8, 96);
    const baseFloorReflect = clamp(params.floorReflect ?? 0.55, 0, 0.9);

    this.floorReflect = clamp(baseFloorReflect + bassBoost * 0.1, 0, 0.95);
    this.pointLightIntensity = 0.35 + beatBoost * 0.25;

    this.ensureBuffers(bufW, bufH, cellSize);
    this.ensureScene(sphereCount, seed);
    this.ensureColorStack(this.maxDepth);

    const cameraZ = -4.2 + beatBoost * 0.25;
    this.camera.x = 0;
    this.camera.y = 0.2;
    this.camera.z = cameraZ;
    this.computeForward(this.camera.x, this.camera.y, this.camera.z, 0, 0, 0, this.forward);
    this.computeRight(this.forward.x, this.forward.y, this.forward.z, this.right);
    this.computeUp(this.right.x, this.right.y, this.right.z, this.forward.x, this.forward.y, this.forward.z, this.up);

    this.updateSpheres(time, bassBoost);
    this.updatePointLight(time);

    const aspect = bufW / bufH;
    const fovScale = Math.tan((fov * Math.PI) / 360);
    const data = this.data;
    if (!data) {
      return;
    }

    if (adaptive && cellSize > 1) {
      this.renderAdaptive(
        bufW,
        bufH,
        aspect,
        fovScale,
        this.camera,
        this.forward,
        this.right,
        this.up,
        refineThreshold,
        refineGrow,
        aa,
        aaMode
      );
    } else {
      this.renderFull(bufW, bufH, aspect, fovScale, this.camera, this.forward, this.right, this.up, aa);
    }

    const bufferCtx = this.bufferCtx;
    const imageData = this.imageData;
    if (!bufferCtx || !imageData) {
      return;
    }
    bufferCtx.putImageData(imageData, 0, 0);

    ctx.save();
    ctx.imageSmoothingEnabled = outputSmoothing;
    ctx.drawImage(this.bufferCanvas as HTMLCanvasElement, 0, 0, bufW, bufH, 0, 0, width, height);
    if (params.scanlines) {
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      for (let y = 0; y < height; y += 2) {
        ctx.fillRect(0, y, width, 1);
      }
    }
    ctx.restore();
  }

  private ensureBuffers(bufW: number, bufH: number, cellSize: number): void {
    if (!this.bufferCanvas || this.bufW !== bufW || this.bufH !== bufH) {
      this.bufferCanvas = document.createElement("canvas");
      this.bufferCanvas.width = bufW;
      this.bufferCanvas.height = bufH;
      const ctx = this.bufferCanvas.getContext("2d");
      if (!ctx) {
        throw new Error("Unable to create raytrace buffer context");
      }
      this.bufferCtx = ctx;
      this.imageData = ctx.createImageData(bufW, bufH);
      this.data = this.imageData.data;
      this.bufW = bufW;
      this.bufH = bufH;
    }

    if (this.cellSize !== cellSize || this.cellW === 0 || this.cellH === 0) {
      this.cellSize = cellSize;
      this.cellW = Math.ceil(bufW / cellSize);
      this.cellH = Math.ceil(bufH / cellSize);
      this.cellRGB = new Uint8ClampedArray(this.cellW * this.cellH * 3);
      this.refineMask = new Uint8Array(this.cellW * this.cellH);
      this.refineMask2 = new Uint8Array(this.cellW * this.cellH);
      this.cellHit = new Uint8Array(this.cellW * this.cellH);
    }
  }

  private ensureScene(sphereCount: number, seed: number): void {
    if (this.sphereCount === sphereCount && this.sphereSeed === seed) {
      return;
    }
    this.sphereCount = sphereCount;
    this.sphereSeed = seed;
    const rand = mulberry32(seed);
    const rgb: RGB = { r: 0, g: 0, b: 0 };
    for (let i = 0; i < sphereCount; i += 1) {
      const hue = rand();
      hslToRgb(hue, 0.75, 0.55, rgb);
      this.sphereColors[i * 3] = rgb.r / 255;
      this.sphereColors[i * 3 + 1] = rgb.g / 255;
      this.sphereColors[i * 3 + 2] = rgb.b / 255;
      this.sphereReflect[i] = 0.2 + rand() * 0.35;
      this.sphereBaseRadius[i] = 0.22 + rand() * 0.25;
      this.spherePhases[i] = rand() * Math.PI * 2;
    }
  }

  private ensureColorStack(maxDepth: number): void {
    const target = maxDepth + 1;
    if (this.colorStack.length >= target) {
      return;
    }
    for (let i = this.colorStack.length; i < target; i += 1) {
      this.colorStack.push(new Float32Array(3));
    }
  }

  private updateSpheres(time: number, bassBoost: number): void {
    for (let i = 0; i < this.sphereCount; i += 1) {
      const phase = this.spherePhases[i];
      const x = Math.sin(time * 0.7 + phase) * 1.6;
      const y = 0.1 + Math.sin(time * 0.9 + phase * 1.3) * 0.5;
      const z = 1.0 + Math.cos(time * 0.6 + phase) * 1.2;
      this.spherePos[i * 3] = x;
      this.spherePos[i * 3 + 1] = y;
      this.spherePos[i * 3 + 2] = z;
      this.sphereRadius[i] = this.sphereBaseRadius[i] * (1 + bassBoost * 0.2);
    }
  }

  private updatePointLight(time: number): void {
    this.pointLight[0] = Math.cos(time * 0.8) * 2.5;
    this.pointLight[1] = 1.2 + Math.sin(time * 0.5) * 0.3;
    this.pointLight[2] = -1.5 + Math.sin(time * 0.9) * 1.5;
  }

  private computeForward(
    camX: number,
    camY: number,
    camZ: number,
    targetX: number,
    targetY: number,
    targetZ: number,
    out: { x: number; y: number; z: number }
  ): void {
    const fx = targetX - camX;
    const fy = targetY - camY;
    const fz = targetZ - camZ;
    const len = Math.hypot(fx, fy, fz) || 1;
    out.x = fx / len;
    out.y = fy / len;
    out.z = fz / len;
  }

  private computeRight(fx: number, fy: number, fz: number, out: { x: number; y: number; z: number }): void {
    const rx = -fz;
    const ry = 0;
    const rz = fx;
    const len = Math.hypot(rx, ry, rz) || 1;
    out.x = rx / len;
    out.y = ry / len;
    out.z = rz / len;
  }

  private computeUp(
    rx: number,
    ry: number,
    rz: number,
    fx: number,
    fy: number,
    fz: number,
    out: { x: number; y: number; z: number }
  ): void {
    const ux = ry * fz - rz * fy;
    const uy = rz * fx - rx * fz;
    const uz = rx * fy - ry * fx;
    const len = Math.hypot(ux, uy, uz) || 1;
    out.x = ux / len;
    out.y = uy / len;
    out.z = uz / len;
  }

  private renderAdaptive(
    bufW: number,
    bufH: number,
    aspect: number,
    fovScale: number,
    camera: { x: number; y: number; z: number },
    forward: { x: number; y: number; z: number },
    right: { x: number; y: number; z: number },
    up: { x: number; y: number; z: number },
    refineThreshold: number,
    refineGrow: boolean,
    aa: number,
    aaMode: "full" | "refinedOnly"
  ): void {
    const cellW = this.cellW;
    const cellH = this.cellH;
    const cellSize = this.cellSize;
    const cellRGB = this.cellRGB;
    const refineMask = this.refineMask;
    const cellHit = this.cellHit;

    refineMask.fill(0);

    for (let cy = 0; cy < cellH; cy += 1) {
      const py = Math.min(bufH - 1, cy * cellSize + Math.floor(cellSize * 0.5));
      for (let cx = 0; cx < cellW; cx += 1) {
        const px = Math.min(bufW - 1, cx * cellSize + Math.floor(cellSize * 0.5));
        const color = this.colorStack[0];
        const hitIndex = cy * cellW + cx;
        this.samplePixel(px, py, bufW, bufH, aspect, fovScale, camera, forward, right, up, color, 0, 0, cellHit, hitIndex);
        const baseIndex = (cy * cellW + cx) * 3;
        cellRGB[baseIndex] = clamp(Math.round(color[0] * 255), 0, 255);
        cellRGB[baseIndex + 1] = clamp(Math.round(color[1] * 255), 0, 255);
        cellRGB[baseIndex + 2] = clamp(Math.round(color[2] * 255), 0, 255);
      }
    }

    for (let cy = 0; cy < cellH; cy += 1) {
      for (let cx = 0; cx < cellW; cx += 1) {
        const idx = (cy * cellW + cx) * 3;
        const r = cellRGB[idx];
        const g = cellRGB[idx + 1];
        const b = cellRGB[idx + 2];
        if (cx + 1 < cellW) {
          const next = idx + 3;
          const cellIndex = cy * cellW + cx;
          const cellNext = cellIndex + 1;
          const diff = Math.abs(r - cellRGB[next]) + Math.abs(g - cellRGB[next + 1]) + Math.abs(b - cellRGB[next + 2]);
          if (cellHit[cellIndex] !== cellHit[cellNext] || diff > refineThreshold) {
            refineMask[cellIndex] = 1;
            refineMask[cellNext] = 1;
          }
        }
        if (cy + 1 < cellH) {
          const next = idx + cellW * 3;
          const cellIndex = cy * cellW + cx;
          const cellNext = cellIndex + cellW;
          const diff = Math.abs(r - cellRGB[next]) + Math.abs(g - cellRGB[next + 1]) + Math.abs(b - cellRGB[next + 2]);
          if (cellHit[cellIndex] !== cellHit[cellNext] || diff > refineThreshold) {
            refineMask[cellIndex] = 1;
            refineMask[cellNext] = 1;
          }
        }
      }
    }

    if (refineGrow) {
      const refineMask2 = this.refineMask2;
      refineMask2.set(refineMask);
      for (let cy = 0; cy < cellH; cy += 1) {
        for (let cx = 0; cx < cellW; cx += 1) {
          const cellIndex = cy * cellW + cx;
          if (!refineMask2[cellIndex]) {
            continue;
          }
          if (cx > 0) {
            refineMask[cellIndex - 1] = 1;
          }
          if (cx + 1 < cellW) {
            refineMask[cellIndex + 1] = 1;
          }
          if (cy > 0) {
            refineMask[cellIndex - cellW] = 1;
          }
          if (cy + 1 < cellH) {
            refineMask[cellIndex + cellW] = 1;
          }
        }
      }
    }

    const data = this.data;
    if (!data) {
      return;
    }

    for (let cy = 0; cy < cellH; cy += 1) {
      for (let cx = 0; cx < cellW; cx += 1) {
        const idx = (cy * cellW + cx) * 3;
        const r = cellRGB[idx];
        const g = cellRGB[idx + 1];
        const b = cellRGB[idx + 2];
        const startX = cx * cellSize;
        const startY = cy * cellSize;
        const endX = Math.min(bufW, startX + cellSize);
        const endY = Math.min(bufH, startY + cellSize);
        for (let py = startY; py < endY; py += 1) {
          for (let px = startX; px < endX; px += 1) {
            const base = (py * bufW + px) * 4;
            data[base] = r;
            data[base + 1] = g;
            data[base + 2] = b;
            data[base + 3] = 255;
          }
        }
      }
    }

    const applyAA = aa > 0 && (aaMode === "full" || aaMode === "refinedOnly");
    const aaOffsets = aa === 4 ? AA_OFFSETS_4 : AA_OFFSETS_2;
    const aaSampleCount = aa > 0 ? aaOffsets.length / 2 : 1;
    const aaScratch = this.aaScratch;

    for (let cy = 0; cy < cellH; cy += 1) {
      for (let cx = 0; cx < cellW; cx += 1) {
        if (!refineMask[cy * cellW + cx]) {
          continue;
        }
        const startX = cx * cellSize;
        const startY = cy * cellSize;
        const endX = Math.min(bufW, startX + cellSize);
        const endY = Math.min(bufH, startY + cellSize);
        for (let py = startY; py < endY; py += 1) {
          for (let px = startX; px < endX; px += 1) {
            let colorR = 0;
            let colorG = 0;
            let colorB = 0;
            if (applyAA && aa > 0) {
              for (let i = 0; i < aaOffsets.length; i += 2) {
                this.samplePixel(
                  px,
                  py,
                  bufW,
                  bufH,
                  aspect,
                  fovScale,
                  camera,
                  forward,
                  right,
                  up,
                  aaScratch,
                  aaOffsets[i],
                  aaOffsets[i + 1]
                );
                colorR += aaScratch[0];
                colorG += aaScratch[1];
                colorB += aaScratch[2];
              }
              const invSamples = 1 / aaSampleCount;
              colorR *= invSamples;
              colorG *= invSamples;
              colorB *= invSamples;
            } else {
              const color = this.colorStack[0];
              this.samplePixel(px, py, bufW, bufH, aspect, fovScale, camera, forward, right, up, color);
              colorR = color[0];
              colorG = color[1];
              colorB = color[2];
            }
            const base = (py * bufW + px) * 4;
            data[base] = clamp(Math.round(colorR * 255), 0, 255);
            data[base + 1] = clamp(Math.round(colorG * 255), 0, 255);
            data[base + 2] = clamp(Math.round(colorB * 255), 0, 255);
            data[base + 3] = 255;
          }
        }
      }
    }
  }

  private renderFull(
    bufW: number,
    bufH: number,
    aspect: number,
    fovScale: number,
    camera: { x: number; y: number; z: number },
    forward: { x: number; y: number; z: number },
    right: { x: number; y: number; z: number },
    up: { x: number; y: number; z: number },
    aa: number
  ): void {
    const data = this.data;
    if (!data) {
      return;
    }
    const aaOffsets = aa === 4 ? AA_OFFSETS_4 : AA_OFFSETS_2;
    const aaSampleCount = aa > 0 ? aaOffsets.length / 2 : 1;
    const aaScratch = this.aaScratch;
    for (let py = 0; py < bufH; py += 1) {
      for (let px = 0; px < bufW; px += 1) {
        let colorR = 0;
        let colorG = 0;
        let colorB = 0;
        if (aa > 0) {
          for (let i = 0; i < aaOffsets.length; i += 2) {
            this.samplePixel(
              px,
              py,
              bufW,
              bufH,
              aspect,
              fovScale,
              camera,
              forward,
              right,
              up,
              aaScratch,
              aaOffsets[i],
              aaOffsets[i + 1]
            );
            colorR += aaScratch[0];
            colorG += aaScratch[1];
            colorB += aaScratch[2];
          }
          const invSamples = 1 / aaSampleCount;
          colorR *= invSamples;
          colorG *= invSamples;
          colorB *= invSamples;
        } else {
          const color = this.colorStack[0];
          this.samplePixel(px, py, bufW, bufH, aspect, fovScale, camera, forward, right, up, color);
          colorR = color[0];
          colorG = color[1];
          colorB = color[2];
        }
        const base = (py * bufW + px) * 4;
        data[base] = clamp(Math.round(colorR * 255), 0, 255);
        data[base + 1] = clamp(Math.round(colorG * 255), 0, 255);
        data[base + 2] = clamp(Math.round(colorB * 255), 0, 255);
        data[base + 3] = 255;
      }
    }
  }

  private samplePixel(
    px: number,
    py: number,
    bufW: number,
    bufH: number,
    aspect: number,
    fovScale: number,
    camera: { x: number; y: number; z: number },
    forward: { x: number; y: number; z: number },
    right: { x: number; y: number; z: number },
    up: { x: number; y: number; z: number },
    out: Float32Array,
    offsetX = 0,
    offsetY = 0,
    hitOut?: Uint8Array,
    hitIndex?: number
  ): void {
    const ndcX = ((px + 0.5 + offsetX) / bufW) * 2 - 1;
    const ndcY = 1 - ((py + 0.5 + offsetY) / bufH) * 2;
    const rayX = ndcX * aspect * fovScale;
    const rayY = ndcY * fovScale;
    let dirX = forward.x + rayX * right.x + rayY * up.x;
    let dirY = forward.y + rayX * right.y + rayY * up.y;
    let dirZ = forward.z + rayX * right.z + rayY * up.z;
    const len = Math.hypot(dirX, dirY, dirZ) || 1;
    dirX /= len;
    dirY /= len;
    dirZ /= len;

    this.traceRay(camera.x, camera.y, camera.z, dirX, dirY, dirZ, 0, out, hitOut, hitIndex);
  }

  private traceRay(
    ox: number,
    oy: number,
    oz: number,
    dx: number,
    dy: number,
    dz: number,
    depth: number,
    out: Float32Array,
    hitOut?: Uint8Array,
    hitIndex?: number
  ): void {
    let hitT = Infinity;
    let hitType = -1;
    let hitSphereIndex = -1;

    for (let i = 0; i < this.sphereCount; i += 1) {
      const cx = this.spherePos[i * 3];
      const cy = this.spherePos[i * 3 + 1];
      const cz = this.spherePos[i * 3 + 2];
      const radius = this.sphereRadius[i];
      const t = raySphereIntersection(ox, oy, oz, dx, dy, dz, cx, cy, cz, radius);
      if (t !== null && t < hitT) {
        hitT = t;
        hitType = 0;
        hitSphereIndex = i;
      }
    }

    const planeT = rayPlaneIntersection(ox, oy, oz, dx, dy, dz, this.planeY);
    if (planeT !== null && planeT < hitT) {
      hitT = planeT;
      hitType = 1;
      hitSphereIndex = -1;
    }

    if (hitOut && hitIndex !== undefined && depth === 0) {
      hitOut[hitIndex] = hitType === -1 ? 0 : 1;
    }

    if (hitType === -1) {
      const t = clamp((dy + 1) * 0.5, 0, 1);
      out[0] = lerp(0.05, 0.45, t);
      out[1] = lerp(0.07, 0.5, t);
      out[2] = lerp(0.1, 0.65, t);
      return;
    }

    const hitX = ox + dx * hitT;
    const hitY = oy + dy * hitT;
    const hitZ = oz + dz * hitT;

    let normalX = 0;
    let normalY = 1;
    let normalZ = 0;
    let baseR = 0.18;
    let baseG = 0.2;
    let baseB = 0.23;
    let reflectivity = this.floorReflect;

    if (hitType === 0 && hitSphereIndex >= 0) {
      const cx = this.spherePos[hitSphereIndex * 3];
      const cy = this.spherePos[hitSphereIndex * 3 + 1];
      const cz = this.spherePos[hitSphereIndex * 3 + 2];
      const invRadius = 1 / this.sphereRadius[hitSphereIndex];
      normalX = (hitX - cx) * invRadius;
      normalY = (hitY - cy) * invRadius;
      normalZ = (hitZ - cz) * invRadius;
      baseR = this.sphereColors[hitSphereIndex * 3];
      baseG = this.sphereColors[hitSphereIndex * 3 + 1];
      baseB = this.sphereColors[hitSphereIndex * 3 + 2];
      reflectivity = this.sphereReflect[hitSphereIndex];
    } else {
      const checker = (Math.floor(hitX * 1.6) + Math.floor(hitZ * 1.6)) & 1;
      const shade = checker ? 0.23 : 0.17;
      baseR = shade;
      baseG = shade * 1.02;
      baseB = shade * 1.08;
    }

    const lightX = -LIGHT_DIR.x;
    const lightY = -LIGHT_DIR.y;
    const lightZ = -LIGHT_DIR.z;
    const ndotl = Math.max(0, normalX * lightX + normalY * lightY + normalZ * lightZ);
    let shadow = 0;
    if (ndotl > 0.001) {
      shadow = this.isShadowed(
        hitX + normalX * EPSILON,
        hitY + normalY * EPSILON,
        hitZ + normalZ * EPSILON,
        lightX,
        lightY,
        lightZ,
        hitSphereIndex
      )
        ? 1
        : 0;
    }

    const viewX = -dx;
    const viewY = -dy;
    const viewZ = -dz;
    const invLX = -lightX;
    const invLY = -lightY;
    const invLZ = -lightZ;
    const reflectX = invLX - 2 * (invLX * normalX + invLY * normalY + invLZ * normalZ) * normalX;
    const reflectY = invLY - 2 * (invLX * normalX + invLY * normalY + invLZ * normalZ) * normalY;
    const reflectZ = invLZ - 2 * (invLX * normalX + invLY * normalY + invLZ * normalZ) * normalZ;
    const specBase = Math.max(0, reflectX * viewX + reflectY * viewY + reflectZ * viewZ);
    const spec = Math.pow(specBase, this.shininess);

    let lighting = this.ambient + this.diffuseStrength * ndotl * (1 - shadow);
    let specular = this.specStrength * spec * (1 - shadow);

    const pointDX = this.pointLight[0] - hitX;
    const pointDY = this.pointLight[1] - hitY;
    const pointDZ = this.pointLight[2] - hitZ;
    const pointDist = Math.hypot(pointDX, pointDY, pointDZ) || 1;
    const pointLX = pointDX / pointDist;
    const pointLY = pointDY / pointDist;
    const pointLZ = pointDZ / pointDist;
    const pointDot = Math.max(0, normalX * pointLX + normalY * pointLY + normalZ * pointLZ);
    if (pointDot > 0) {
      const falloff = this.pointLightIntensity / (1 + pointDist * 0.35);
      lighting += pointDot * falloff;
      const pointRefX = -pointLX - 2 * (-pointLX * normalX + -pointLY * normalY + -pointLZ * normalZ) * normalX;
      const pointRefY = -pointLY - 2 * (-pointLX * normalX + -pointLY * normalY + -pointLZ * normalZ) * normalY;
      const pointRefZ = -pointLZ - 2 * (-pointLX * normalX + -pointLY * normalY + -pointLZ * normalZ) * normalZ;
      const pointSpec = Math.pow(Math.max(0, pointRefX * viewX + pointRefY * viewY + pointRefZ * viewZ), this.shininess);
      specular += pointSpec * falloff * 0.65;
    }

    let colorR = baseR * lighting + specular;
    let colorG = baseG * lighting + specular;
    let colorB = baseB * lighting + specular;

    if (depth < this.maxDepth && reflectivity > 0.001) {
      const dot = dx * normalX + dy * normalY + dz * normalZ;
      const refDirX = dx - 2 * dot * normalX;
      const refDirY = dy - 2 * dot * normalY;
      const refDirZ = dz - 2 * dot * normalZ;
      const bounce = this.colorStack[depth + 1];
      this.traceRay(
        hitX + normalX * EPSILON,
        hitY + normalY * EPSILON,
        hitZ + normalZ * EPSILON,
        refDirX,
        refDirY,
        refDirZ,
        depth + 1,
        bounce
      );
      colorR = lerp(colorR, bounce[0], reflectivity);
      colorG = lerp(colorG, bounce[1], reflectivity);
      colorB = lerp(colorB, bounce[2], reflectivity);
    }

    out[0] = clamp(colorR, 0, 1);
    out[1] = clamp(colorG, 0, 1);
    out[2] = clamp(colorB, 0, 1);
  }

  private isShadowed(
    ox: number,
    oy: number,
    oz: number,
    dx: number,
    dy: number,
    dz: number,
    ignoreIndex: number
  ): boolean {
    for (let i = 0; i < this.sphereCount; i += 1) {
      if (i === ignoreIndex) {
        continue;
      }
      const cx = this.spherePos[i * 3];
      const cy = this.spherePos[i * 3 + 1];
      const cz = this.spherePos[i * 3 + 2];
      const radius = this.sphereRadius[i];
      const t = raySphereIntersection(ox, oy, oz, dx, dy, dz, cx, cy, cz, radius);
      if (t !== null) {
        return true;
      }
    }
    return false;
  }
}
