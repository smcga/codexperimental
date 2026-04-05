import { clamp, lerp } from "../../util/math";
import { fitCircleToSafe } from "./framingFit";
import { Effect, EffectRenderContext } from "./types";

const TAU = Math.PI * 2;
const ENV_W = 256;
const ENV_H = 256;

export const ENVMAP_DONUT_DEFAULTS = {
  bufW: 240,
  bufH: 180,
  segmentsU: 64,
  segmentsV: 32,
  R: 1.2,
  r: 0.55,
  camDist: 5,
  focalMul: 1.2,
  rotXSpeed: 0.15,
  rotYSpeed: 0.75,
  rotZSpeed: 0.15,
  fresnelStrength: 0.05,
  specStrength: 0.8,
  shininess: 5,
  chromeDesat: 0.14,
  backfaceCull: false,
  scanlines: false,
  edge: false,
  audioReact: 0.0005,
  beatKick: 0,
  seed: 0
};

export type EnvmapDonutParams = {
  bufW: number;
  bufH: number;
  segmentsU: number;
  segmentsV: number;
  R: number;
  r: number;
  camDist: number;
  focalMul: number;
  rotXSpeed: number;
  rotYSpeed: number;
  rotZSpeed: number;
  fresnelStrength: number;
  specStrength: number;
  shininess: number;
  chromeDesat: number;
  backfaceCull: boolean;
  scanlines: boolean;
  edge: boolean;
  audioReact: number;
  beatKick: number;
  seed: number;
};

const toNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const toToggle = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value > 0;
  }
  return fallback;
};

const clamp01 = (value: number): number => clamp(value, 0, 1);

const mulberry32 = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967295;
  };
};

export function sphereMapUv(rx: number, ry: number, rz: number): { u: number; v: number } {
  const m = 2 * Math.sqrt(rx * rx + ry * ry + (rz + 1) * (rz + 1));
  if (m === 0) {
    return { u: 0.5, v: 0.5 };
  }
  const u = clamp01(rx / m + 0.5);
  const v = clamp01(ry / m + 0.5);
  return { u, v };
}

export function createEnvMap(envW = ENV_W, envH = ENV_H, seed = 0): Uint8ClampedArray {
  const envRGB = new Uint8ClampedArray(envW * envH * 3);
  const rng = mulberry32(seed || 1);
  const skyTop = [30, 80, 180];
  const skyBottom = [200, 130, 80];
  const sunX = 0.72;
  const sunY = 0.28;
  const sunRadius = 0.08;

  for (let y = 0; y < envH; y += 1) {
    const t = y / (envH - 1);
    const gradR = lerp(skyTop[0], skyBottom[0], t);
    const gradG = lerp(skyTop[1], skyBottom[1], t);
    const gradB = lerp(skyTop[2], skyBottom[2], t);
    const band = Math.sin(t * 10 + 1.3) * 12 + Math.sin(t * 24) * 6;
    for (let x = 0; x < envW; x += 1) {
      const u = x / (envW - 1);
      const dx = u - sunX;
      const dy = t - sunY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const sun = Math.exp(-((dist * dist) / (sunRadius * sunRadius))) * 180;
      const noise = (rng() - 0.5) * 12;

      let r = gradR + band + sun + noise;
      let g = gradG + band * 0.5 + sun * 0.9 + noise;
      let b = gradB - band * 0.2 + sun * 0.8 + noise;

      if (t > 0.55) {
        const stripe = Math.sin((t - 0.55) * 24) * 18;
        r += stripe * 0.9;
        g += stripe * 0.6;
        b += stripe * 0.3;
      }

      const idx = (y * envW + x) * 3;
      envRGB[idx] = clamp(Math.round(r), 0, 255);
      envRGB[idx + 1] = clamp(Math.round(g), 0, 255);
      envRGB[idx + 2] = clamp(Math.round(b), 0, 255);
    }
  }

  return envRGB;
}

type MeshData = {
  vertexCount: number;
  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;
  screenX: Float32Array;
  screenY: Float32Array;
  invZ: Float32Array;
  normalView: Float32Array;
};

const createMesh = (segmentsU: number, segmentsV: number, R: number, r: number): MeshData => {
  const vertexCount = segmentsU * segmentsV;
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const screenX = new Float32Array(vertexCount);
  const screenY = new Float32Array(vertexCount);
  const invZ = new Float32Array(vertexCount);
  const normalView = new Float32Array(vertexCount * 3);
  const indices = new Uint32Array(segmentsU * segmentsV * 6);

  let vIndex = 0;
  for (let u = 0; u < segmentsU; u += 1) {
    const uang = (u / segmentsU) * TAU;
    const cosU = Math.cos(uang);
    const sinU = Math.sin(uang);
    for (let v = 0; v < segmentsV; v += 1) {
      const vang = (v / segmentsV) * TAU;
      const cosV = Math.cos(vang);
      const sinV = Math.sin(vang);
      const ring = R + r * cosV;
      positions[vIndex] = ring * cosU;
      positions[vIndex + 1] = ring * sinU;
      positions[vIndex + 2] = r * sinV;

      normals[vIndex] = cosV * cosU;
      normals[vIndex + 1] = cosV * sinU;
      normals[vIndex + 2] = sinV;
      vIndex += 3;
    }
  }

  let iIndex = 0;
  for (let u = 0; u < segmentsU; u += 1) {
    const nextU = (u + 1) % segmentsU;
    for (let v = 0; v < segmentsV; v += 1) {
      const nextV = (v + 1) % segmentsV;
      const i0 = u * segmentsV + v;
      const i1 = nextU * segmentsV + v;
      const i2 = nextU * segmentsV + nextV;
      const i3 = u * segmentsV + nextV;

      indices[iIndex++] = i0;
      indices[iIndex++] = i1;
      indices[iIndex++] = i2;
      indices[iIndex++] = i0;
      indices[iIndex++] = i2;
      indices[iIndex++] = i3;
    }
  }

  return { vertexCount, indices, positions, normals, screenX, screenY, invZ, normalView };
};

export class EnvmapDonutEffect implements Effect {
  private bufW = 0;
  private bufH = 0;
  private color: Uint8ClampedArray = new Uint8ClampedArray(0);
  private zbuf: Float32Array = new Float32Array(0);
  private imageData: ImageData | null = null;
  private bufCanvas: HTMLCanvasElement | null = null;
  private bufCtx: CanvasRenderingContext2D | null = null;
  private envRGB: Uint8ClampedArray | null = null;
  private envSeed = 0;
  private mesh: MeshData | null = null;
  private meshConfig = { segmentsU: 0, segmentsV: 0, R: 0, r: 0 };
  private beatPulse = 0;

  private ensureBuffer(bufW: number, bufH: number): void {
    if (this.bufW === bufW && this.bufH === bufH && this.imageData && this.bufCanvas && this.bufCtx) {
      return;
    }
    this.bufW = bufW;
    this.bufH = bufH;
    this.color = new Uint8ClampedArray(bufW * bufH * 4);
    this.zbuf = new Float32Array(bufW * bufH);
    const canvas = document.createElement("canvas");
    canvas.width = bufW;
    canvas.height = bufH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to create envmap buffer context");
    }
    this.bufCanvas = canvas;
    this.bufCtx = ctx;
    this.imageData = ctx.createImageData(bufW, bufH);
  }

  private ensureEnvMap(seed: number): void {
    if (this.envRGB && this.envSeed === seed) {
      return;
    }
    this.envRGB = createEnvMap(ENV_W, ENV_H, seed);
    this.envSeed = seed;
  }

  private ensureMesh(segmentsU: number, segmentsV: number, R: number, r: number): void {
    if (
      this.mesh &&
      this.meshConfig.segmentsU === segmentsU &&
      this.meshConfig.segmentsV === segmentsV &&
      this.meshConfig.R === R &&
      this.meshConfig.r === r
    ) {
      return;
    }
    this.mesh = createMesh(segmentsU, segmentsV, R, r);
    this.meshConfig = { segmentsU, segmentsV, R, r };
  }

  render({ ctx, width, height, time, delta, audio, params, framing, safeRect }: EffectRenderContext): void {
    const bufW = Math.max(64, Math.floor(toNumber(params.bufW, ENVMAP_DONUT_DEFAULTS.bufW)));
    const bufH = Math.max(64, Math.floor(toNumber(params.bufH, ENVMAP_DONUT_DEFAULTS.bufH)));
    const segmentsU = clamp(Math.round(toNumber(params.segmentsU, ENVMAP_DONUT_DEFAULTS.segmentsU)), 16, 128);
    const segmentsV = clamp(Math.round(toNumber(params.segmentsV, ENVMAP_DONUT_DEFAULTS.segmentsV)), 12, 96);
    const R = toNumber(params.R, ENVMAP_DONUT_DEFAULTS.R);
    const r = toNumber(params.r, ENVMAP_DONUT_DEFAULTS.r);
    const camDist = toNumber(params.camDist, ENVMAP_DONUT_DEFAULTS.camDist);
    const focalMul = toNumber(params.focalMul, ENVMAP_DONUT_DEFAULTS.focalMul);
    const rotXSpeed = toNumber(params.rotXSpeed, ENVMAP_DONUT_DEFAULTS.rotXSpeed);
    const rotYSpeed = toNumber(params.rotYSpeed, ENVMAP_DONUT_DEFAULTS.rotYSpeed);
    const rotZSpeed = toNumber(params.rotZSpeed, ENVMAP_DONUT_DEFAULTS.rotZSpeed);
    const fresnelStrength = toNumber(params.fresnelStrength, ENVMAP_DONUT_DEFAULTS.fresnelStrength);
    const baseSpecStrength = toNumber(params.specStrength, ENVMAP_DONUT_DEFAULTS.specStrength);
    const shininess = toNumber(params.shininess, ENVMAP_DONUT_DEFAULTS.shininess);
    const chromeDesat = clamp01(toNumber(params.chromeDesat, ENVMAP_DONUT_DEFAULTS.chromeDesat));
    const backfaceCull = toToggle(params.backfaceCull, ENVMAP_DONUT_DEFAULTS.backfaceCull);
    const scanlines = toToggle(params.scanlines, ENVMAP_DONUT_DEFAULTS.scanlines);
    const edge = toToggle(params.edge, ENVMAP_DONUT_DEFAULTS.edge);
    const audioReact = clamp01(toNumber(params.audioReact, ENVMAP_DONUT_DEFAULTS.audioReact));
    const beatKick = clamp01(toNumber(params.beatKick, ENVMAP_DONUT_DEFAULTS.beatKick));
    const seed = Math.floor(toNumber(params.seed, ENVMAP_DONUT_DEFAULTS.seed));

    const dt = clamp(delta, 0, 0.05);
    if (audio.beat) {
      this.beatPulse = 1;
    }
    this.beatPulse = Math.max(0, this.beatPulse - dt * 6);

    const audioBoost = 1 + audio.bass * audioReact * 0.25;
    const beatBoost = 1 + this.beatPulse * beatKick * 0.7;
    const rotBoost = audioBoost * beatBoost;
    const specStrength = baseSpecStrength * (1 + audio.bass * audioReact * 0.6 + this.beatPulse * beatKick * 0.8);

    this.ensureBuffer(bufW, bufH);
    this.ensureEnvMap(seed);
    this.ensureMesh(segmentsU, segmentsV, R, r);

    if (!this.imageData || !this.bufCanvas || !this.bufCtx || !this.envRGB || !this.mesh) {
      return;
    }

    const { positions, normals, indices, screenX, screenY, invZ, normalView, vertexCount } = this.mesh;
    const envRGB = this.envRGB;
    const color = this.color;
    const zbuf = this.zbuf;
    const centerX = bufW * 0.5;
    const centerY = bufH * 0.5;
    const focalBase = Math.min(bufW, bufH) * focalMul;
    let focal = focalBase;
    if (framing?.mode === "mobileFit") {
      const activeSafeRect = safeRect ?? { x: 0, y: 0, w: width, h: height };
      const targetRadius = fitCircleToSafe(Math.min(activeSafeRect.w, activeSafeRect.h) * 0.5, activeSafeRect);
      const worldRadius = Math.max(0.001, R + r);
      const depthRange = Math.max(0.001, camDist - worldRadius);
      const maxFocal = (targetRadius * depthRange) / worldRadius;
      focal = Math.min(focalBase, maxFocal * (bufW / Math.max(1, width)));
    }

    zbuf.fill(Number.POSITIVE_INFINITY);
    for (let i = 0; i < color.length; i += 4) {
      color[i] = 4;
      color[i + 1] = 6;
      color[i + 2] = 10;
      color[i + 3] = 255;
    }

    const ax = time * rotXSpeed * rotBoost;
    const ay = time * rotYSpeed * rotBoost;
    const az = time * rotZSpeed * rotBoost;
    const sx = Math.sin(ax);
    const cx = Math.cos(ax);
    const sy = Math.sin(ay);
    const cy = Math.cos(ay);
    const sz = Math.sin(az);
    const cz = Math.cos(az);

    for (let i = 0; i < vertexCount; i += 1) {
      const base = i * 3;
      let x = positions[base];
      let y = positions[base + 1];
      let z = positions[base + 2];

      let y1 = y * cx - z * sx;
      let z1 = y * sx + z * cx;

      let x2 = x * cy + z1 * sy;
      let z2 = -x * sy + z1 * cy;

      let x3 = x2 * cz - y1 * sz;
      let y3 = x2 * sz + y1 * cz;
      let z3 = z2 + camDist;

      const inv = 1 / z3;
      screenX[i] = centerX + x3 * inv * focal;
      screenY[i] = centerY + y3 * inv * focal;
      invZ[i] = inv;

      let nx = normals[base];
      let ny = normals[base + 1];
      let nz = normals[base + 2];

      let ny1 = ny * cx - nz * sx;
      let nz1 = ny * sx + nz * cx;
      let nx2 = nx * cy + nz1 * sy;
      let nz2 = -nx * sy + nz1 * cy;
      let nx3 = nx2 * cz - ny1 * sz;
      let ny3 = nx2 * sz + ny1 * cz;

      normalView[base] = nx3;
      normalView[base + 1] = ny3;
      normalView[base + 2] = nz2;
    }

    const rasterTri = (i0: number, i1: number, i2: number): void => {
      const x0 = screenX[i0];
      const y0 = screenY[i0];
      const x1 = screenX[i1];
      const y1 = screenY[i1];
      const x2 = screenX[i2];
      const y2 = screenY[i2];

      const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2)));
      const maxX = Math.min(bufW - 1, Math.ceil(Math.max(x0, x1, x2)));
      const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)));
      const maxY = Math.min(bufH - 1, Math.ceil(Math.max(y0, y1, y2)));

      const edge = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number =>
        (cx - ax) * (by - ay) - (cy - ay) * (bx - ax);
      const area = edge(x0, y0, x1, y1, x2, y2);
      if (area === 0) {
        return;
      }
      const invArea = 1 / area;
      const sign = area < 0 ? -1 : 1;

      const nx0 = normalView[i0 * 3];
      const ny0 = normalView[i0 * 3 + 1];
      const nz0 = normalView[i0 * 3 + 2];
      const nx1 = normalView[i1 * 3];
      const ny1 = normalView[i1 * 3 + 1];
      const nz1 = normalView[i1 * 3 + 2];
      const nx2 = normalView[i2 * 3];
      const ny2 = normalView[i2 * 3 + 1];
      const nz2 = normalView[i2 * 3 + 2];

      const invZ0 = invZ[i0];
      const invZ1 = invZ[i1];
      const invZ2 = invZ[i2];

      for (let y = minY; y <= maxY; y += 1) {
        for (let x = minX; x <= maxX; x += 1) {
          const e0 = edge(x1, y1, x2, y2, x, y) * sign;
          const e1 = edge(x2, y2, x0, y0, x, y) * sign;
          const e2 = edge(x0, y0, x1, y1, x, y) * sign;
          if (e0 < 0 || e1 < 0 || e2 < 0) {
            continue;
          }
          const w0 = e0 * invArea * sign;
          const w1 = e1 * invArea * sign;
          const w2 = e2 * invArea * sign;

          const invZp = w0 * invZ0 + w1 * invZ1 + w2 * invZ2;
          const z = 1 / invZp;
          const idx = y * bufW + x;
          if (z >= zbuf[idx]) {
            continue;
          }
          zbuf[idx] = z;

          let nx = w0 * nx0 + w1 * nx1 + w2 * nx2;
          let ny = w0 * ny0 + w1 * ny1 + w2 * ny2;
          let nz = w0 * nz0 + w1 * nz1 + w2 * nz2;
          const len = Math.hypot(nx, ny, nz);
          if (len > 0) {
            const invLen = 1 / len;
            nx *= invLen;
            ny *= invLen;
            nz *= invLen;
          }

          const ndv = nz;
          const rx = 2 * ndv * nx;
          const ry = 2 * ndv * ny;
          const rz = 2 * ndv * nz - 1;

          const { u, v } = sphereMapUv(rx, ry, rz);
          const envX = Math.min(ENV_W - 1, (u * (ENV_W - 1)) | 0);
          const envY = Math.min(ENV_H - 1, (v * (ENV_H - 1)) | 0);
          const envIdx = (envY * ENV_W + envX) * 3;
          let r = envRGB[envIdx];
          let g = envRGB[envIdx + 1];
          let b = envRGB[envIdx + 2];

          const fresnel = Math.pow(1 - clamp01(nz), 3) * fresnelStrength;
          const spec = Math.pow(clamp01(rz), shininess) * specStrength;
          const highlight = (fresnel + spec) * 255;

          r = clamp(r + highlight, 0, 255);
          g = clamp(g + highlight, 0, 255);
          b = clamp(b + highlight, 0, 255);

          const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          r = lerp(r, lum, chromeDesat);
          g = lerp(g, lum, chromeDesat);
          b = lerp(b, lum, chromeDesat);

          const out = idx * 4;
          color[out] = r;
          color[out + 1] = g;
          color[out + 2] = b;
          color[out + 3] = 255;
        }
      }
    };

    for (let i = 0; i < indices.length; i += 3) {
      const i0 = indices[i];
      const i1 = indices[i + 1];
      const i2 = indices[i + 2];
      if (backfaceCull) {
        const nzSum = normalView[i0 * 3 + 2] + normalView[i1 * 3 + 2] + normalView[i2 * 3 + 2];
        if (nzSum <= 0) {
          continue;
        }
      }
      rasterTri(i0, i1, i2);
    }

    this.imageData.data.set(color);
    this.bufCtx.putImageData(this.imageData, 0, 0);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.bufCanvas, 0, 0, bufW, bufH, 0, 0, width, height);

    if (edge) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1;
      ctx.scale(width / bufW, height / bufH);
      ctx.beginPath();
      for (let i = 0; i < indices.length; i += 3) {
        const i0 = indices[i];
        const i1 = indices[i + 1];
        const i2 = indices[i + 2];
        if (backfaceCull) {
          const nzSum = normalView[i0 * 3 + 2] + normalView[i1 * 3 + 2] + normalView[i2 * 3 + 2];
          if (nzSum <= 0) {
            continue;
          }
        }
        ctx.moveTo(screenX[i0], screenY[i0]);
        ctx.lineTo(screenX[i1], screenY[i1]);
        ctx.lineTo(screenX[i2], screenY[i2]);
        ctx.lineTo(screenX[i0], screenY[i0]);
      }
      ctx.stroke();
      ctx.restore();
    }

    if (scanlines) {
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      for (let y = 0; y < height; y += 2) {
        ctx.fillRect(0, y, width, 1);
      }
      ctx.restore();
    }
  }
}
