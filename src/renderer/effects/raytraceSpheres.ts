import { clamp, lerp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

const MAX_SPHERES = 10;
const EPSILON = 0.001;

export const RAYTRACE_SPHERES_DEFAULTS = {
  bufW: 240,
  bufH: 180,
  sphereCount: 6,
  seed: 1337,
  fov: 60,
  cellSize: 1,
  adaptive: 1,
  refineThreshold: 80,
  audioReact: 0.6,
  beatKick: 0.7,
  maxDepth: 2,
  ambient: 0.12,
  diffuseStrength: 1.0,
  specStrength: 0.45,
  shininess: 48,
  floorReflect: 0.55
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

export type RaytraceSpheresParams = {
  bufW: number;
  bufH: number;
  sphereCount: number;
  seed: number;
  fov: number;
  cellSize: number;
  adaptive: number;
  refineThreshold: number;
  audioReact: number;
  beatKick: number;
  maxDepth: number;
  ambient: number;
  diffuseStrength: number;
  specStrength: number;
  shininess: number;
  floorReflect: number;
};

export function normalizeRaytraceSpheresParams(params: Record<string, number>): RaytraceSpheresParams {
  return {
    bufW: clamp(Math.round(params.bufW ?? RAYTRACE_SPHERES_DEFAULTS.bufW), 100, 360),
    bufH: clamp(Math.round(params.bufH ?? RAYTRACE_SPHERES_DEFAULTS.bufH), 75, 270),
    sphereCount: clamp(Math.round(params.sphereCount ?? RAYTRACE_SPHERES_DEFAULTS.sphereCount), 2, MAX_SPHERES),
    seed: Math.round(params.seed ?? RAYTRACE_SPHERES_DEFAULTS.seed),
    fov: clamp(params.fov ?? RAYTRACE_SPHERES_DEFAULTS.fov, 35, 90),
    cellSize: clamp(Math.round(params.cellSize ?? RAYTRACE_SPHERES_DEFAULTS.cellSize), 1, 6),
    adaptive: params.adaptive ?? RAYTRACE_SPHERES_DEFAULTS.adaptive,
    refineThreshold: clamp(params.refineThreshold ?? RAYTRACE_SPHERES_DEFAULTS.refineThreshold, 20, 255),
    audioReact: clamp(params.audioReact ?? RAYTRACE_SPHERES_DEFAULTS.audioReact, 0, 1),
    beatKick: clamp(params.beatKick ?? RAYTRACE_SPHERES_DEFAULTS.beatKick, 0, 1),
    maxDepth: clamp(Math.round(params.maxDepth ?? RAYTRACE_SPHERES_DEFAULTS.maxDepth), 1, 3),
    ambient: clamp(params.ambient ?? RAYTRACE_SPHERES_DEFAULTS.ambient, 0.05, 0.4),
    diffuseStrength: clamp(params.diffuseStrength ?? RAYTRACE_SPHERES_DEFAULTS.diffuseStrength, 0.2, 2.0),
    specStrength: clamp(params.specStrength ?? RAYTRACE_SPHERES_DEFAULTS.specStrength, 0, 2.0),
    shininess: clamp(params.shininess ?? RAYTRACE_SPHERES_DEFAULTS.shininess, 8, 96),
    floorReflect: clamp(params.floorReflect ?? RAYTRACE_SPHERES_DEFAULTS.floorReflect, 0, 0.9)
  };
}

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

  private sphereCount = 0;
  private sphereSeed = 0;
  private spherePhases = new Float32Array(MAX_SPHERES);
  private sphereColors = new Float32Array(MAX_SPHERES * 3);
  private sphereReflect = new Float32Array(MAX_SPHERES);
  private sphereBaseRadius = new Float32Array(MAX_SPHERES);
  private spherePos = new Float32Array(MAX_SPHERES * 3);
  private sphereRadius = new Float32Array(MAX_SPHERES);

  private colorStack: Float32Array[] = [];

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
  }

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const normalized = normalizeRaytraceSpheresParams(params);
    const bufW = normalized.bufW;
    const bufH = normalized.bufH;
    const sphereCount = normalized.sphereCount;
    const seed = normalized.seed;
    const fov = normalized.fov;
    const cellSize = normalized.cellSize;
    const adaptive = Boolean(normalized.adaptive);
    const refineThreshold = normalized.refineThreshold;

    const audioReact = normalized.audioReact;
    const beatKick = normalized.beatKick;
    const bassBoost = audio.bass * audioReact;
    const beatBoost = audio.beatStrength * beatKick;

    this.maxDepth = normalized.maxDepth;
    this.ambient = normalized.ambient;
    this.diffuseStrength = normalized.diffuseStrength;
    const baseSpecStrength = normalized.specStrength;
    this.specStrength = clamp(baseSpecStrength * (1 + beatBoost * 0.8), 0, 2.5);
    this.shininess = normalized.shininess;
    const baseFloorReflect = normalized.floorReflect;

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
      this.renderAdaptive(bufW, bufH, aspect, fovScale, this.camera, this.forward, this.right, this.up, refineThreshold);
    } else {
      this.renderFull(bufW, bufH, aspect, fovScale, this.camera, this.forward, this.right, this.up);
    }

    const bufferCtx = this.bufferCtx;
    const imageData = this.imageData;
    if (!bufferCtx || !imageData) {
      return;
    }
    bufferCtx.putImageData(imageData, 0, 0);

    ctx.save();
    ctx.imageSmoothingEnabled = false;
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
    refineThreshold: number
  ): void {
    const cellW = this.cellW;
    const cellH = this.cellH;
    const cellSize = this.cellSize;
    const cellRGB = this.cellRGB;
    const refineMask = this.refineMask;

    refineMask.fill(0);

    for (let cy = 0; cy < cellH; cy += 1) {
      const py = Math.min(bufH - 1, cy * cellSize + Math.floor(cellSize * 0.5));
      for (let cx = 0; cx < cellW; cx += 1) {
        const px = Math.min(bufW - 1, cx * cellSize + Math.floor(cellSize * 0.5));
        const color = this.colorStack[0];
        this.samplePixel(px, py, bufW, bufH, aspect, fovScale, camera, forward, right, up, color);
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
          const diff = Math.abs(r - cellRGB[next]) + Math.abs(g - cellRGB[next + 1]) + Math.abs(b - cellRGB[next + 2]);
          if (diff > refineThreshold) {
            refineMask[cy * cellW + cx] = 1;
            refineMask[cy * cellW + cx + 1] = 1;
          }
        }
        if (cy + 1 < cellH) {
          const next = idx + cellW * 3;
          const diff = Math.abs(r - cellRGB[next]) + Math.abs(g - cellRGB[next + 1]) + Math.abs(b - cellRGB[next + 2]);
          if (diff > refineThreshold) {
            refineMask[cy * cellW + cx] = 1;
            refineMask[(cy + 1) * cellW + cx] = 1;
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
            const color = this.colorStack[0];
            this.samplePixel(px, py, bufW, bufH, aspect, fovScale, camera, forward, right, up, color);
            const base = (py * bufW + px) * 4;
            data[base] = clamp(Math.round(color[0] * 255), 0, 255);
            data[base + 1] = clamp(Math.round(color[1] * 255), 0, 255);
            data[base + 2] = clamp(Math.round(color[2] * 255), 0, 255);
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
    up: { x: number; y: number; z: number }
  ): void {
    const data = this.data;
    if (!data) {
      return;
    }
    for (let py = 0; py < bufH; py += 1) {
      for (let px = 0; px < bufW; px += 1) {
        const color = this.colorStack[0];
        this.samplePixel(px, py, bufW, bufH, aspect, fovScale, camera, forward, right, up, color);
        const base = (py * bufW + px) * 4;
        data[base] = clamp(Math.round(color[0] * 255), 0, 255);
        data[base + 1] = clamp(Math.round(color[1] * 255), 0, 255);
        data[base + 2] = clamp(Math.round(color[2] * 255), 0, 255);
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
    out: Float32Array
  ): void {
    const ndcX = ((px + 0.5) / bufW) * 2 - 1;
    const ndcY = 1 - ((py + 0.5) / bufH) * 2;
    const rayX = ndcX * aspect * fovScale;
    const rayY = ndcY * fovScale;
    let dirX = forward.x + rayX * right.x + rayY * up.x;
    let dirY = forward.y + rayX * right.y + rayY * up.y;
    let dirZ = forward.z + rayX * right.z + rayY * up.z;
    const len = Math.hypot(dirX, dirY, dirZ) || 1;
    dirX /= len;
    dirY /= len;
    dirZ /= len;

    this.traceRay(camera.x, camera.y, camera.z, dirX, dirY, dirZ, 0, out);
  }

  private traceRay(
    ox: number,
    oy: number,
    oz: number,
    dx: number,
    dy: number,
    dz: number,
    depth: number,
    out: Float32Array
  ): void {
    let hitT = Infinity;
    let hitType = -1;
    let hitIndex = -1;

    for (let i = 0; i < this.sphereCount; i += 1) {
      const cx = this.spherePos[i * 3];
      const cy = this.spherePos[i * 3 + 1];
      const cz = this.spherePos[i * 3 + 2];
      const radius = this.sphereRadius[i];
      const t = raySphereIntersection(ox, oy, oz, dx, dy, dz, cx, cy, cz, radius);
      if (t !== null && t < hitT) {
        hitT = t;
        hitType = 0;
        hitIndex = i;
      }
    }

    const planeT = rayPlaneIntersection(ox, oy, oz, dx, dy, dz, this.planeY);
    if (planeT !== null && planeT < hitT) {
      hitT = planeT;
      hitType = 1;
      hitIndex = -1;
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

    if (hitType === 0 && hitIndex >= 0) {
      const cx = this.spherePos[hitIndex * 3];
      const cy = this.spherePos[hitIndex * 3 + 1];
      const cz = this.spherePos[hitIndex * 3 + 2];
      const invRadius = 1 / this.sphereRadius[hitIndex];
      normalX = (hitX - cx) * invRadius;
      normalY = (hitY - cy) * invRadius;
      normalZ = (hitZ - cz) * invRadius;
      baseR = this.sphereColors[hitIndex * 3];
      baseG = this.sphereColors[hitIndex * 3 + 1];
      baseB = this.sphereColors[hitIndex * 3 + 2];
      reflectivity = this.sphereReflect[hitIndex];
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
        hitIndex
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
