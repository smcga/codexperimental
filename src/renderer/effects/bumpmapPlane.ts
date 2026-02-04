import { clamp, lerp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type PaletteMode = "ramp" | "hsl";

type HeightMapOptions = {
  width: number;
  height: number;
  seed: number;
  embossText?: string;
  embossStrength: number;
};

const DEFAULTS = {
  bufW: 240,
  bufH: 180,
  bumpStrength: 0.035,
  ambient: 0.2,
  diffuseStrength: 1.05,
  specStrength: 0.35,
  shininess: 24,
  lightZ: 120,
  lightSpeed: 1.0,
  embossText: "BUMP",
  embossStrength: 70,
  animateBumps: true,
  waveAmp: 18,
  waveFreqX: 0.08,
  waveFreqY: 0.06,
  baseHue: 200,
  paletteMode: "ramp" as PaletteMode,
  scanlines: false,
  audioReact: 0.7,
  beatKick: 0.7,
  seed: 0
};

const BEAT_PULSE_DURATION = 0.2;

const resolveNumberParam = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const resolveBooleanParam = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  return fallback;
};

const resolveStringParam = (value: unknown, fallback?: string): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value : fallback;

const resolvePaletteMode = (value: unknown, fallback: PaletteMode): PaletteMode =>
  value === "hsl" || value === "ramp" ? value : fallback;

const clampByte = (value: number): number => clamp(Math.round(value), 0, 255);

const hashFloat = (value: number): number => {
  const hashed = Math.sin(value) * 43758.5453123;
  return hashed - Math.floor(hashed);
};

export const buildBaseHeightMap = ({ width, height, seed, embossText, embossStrength }: HeightMapOptions): Uint8Array => {
  const heightMap = new Uint8Array(width * height);
  const cx = width * 0.5;
  const cy = height * 0.5;
  const phase = seed * 0.37;
  const f1 = 0.06;
  const g1 = 0.04;
  const f2 = 0.12;
  const g2 = 0.07;
  const f3 = 0.07;
  const amp1 = 42;
  const amp2 = 26;
  const amp3 = 18;
  const noiseAmp = 12;

  for (let y = 0; y < height; y += 1) {
    const row = y * width;
    for (let x = 0; x < width; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const n1 = Math.sin(x * f1 + y * g1 + phase);
      const n2 = Math.sin(x * f2 + y * g2 - phase * 1.3);
      const n3 = Math.sin(dist * f3 + phase * 0.8);
      const noise = (hashFloat(x * 12.9898 + y * 78.233 + seed * 37.719) - 0.5) * 2;
      const value = 128 + amp1 * n1 + amp2 * n2 + amp3 * n3 + noise * noiseAmp;
      heightMap[row + x] = clampByte(value);
    }
  }

  if (embossText && typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, width, height);
      const fontSize = Math.max(16, Math.floor(Math.min(width, height) * 0.25));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "white";
      ctx.fillText(embossText, width * 0.5, height * 0.5);
      const embossData = ctx.getImageData(0, 0, width, height).data;
      for (let i = 0; i < heightMap.length; i += 1) {
        const alpha = embossData[i * 4 + 3] / 255;
        if (alpha <= 0) {
          continue;
        }
        heightMap[i] = clampByte(heightMap[i] + alpha * embossStrength);
      }
    }
  }

  return heightMap;
};

const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (hue < 60) {
    r = c;
    g = x;
  } else if (hue < 120) {
    r = x;
    g = c;
  } else if (hue < 180) {
    g = c;
    b = x;
  } else if (hue < 240) {
    g = x;
    b = c;
  } else if (hue < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
};

export class BumpmapPlaneEffect implements Effect {
  private bufferCanvas?: HTMLCanvasElement;
  private bufferCtx?: CanvasRenderingContext2D;
  private imageData?: ImageData;
  private data?: Uint8ClampedArray;
  private baseHeight?: Uint8Array;
  private dynamicHeight?: Int16Array;
  private bufferWidth = 0;
  private bufferHeight = 0;
  private heightKey = "";
  private lastBeatTime = -Infinity;

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const rawParams = params as Record<string, unknown>;
    const bufW = Math.max(64, Math.floor(resolveNumberParam(rawParams.bufW, DEFAULTS.bufW)));
    const bufH = Math.max(64, Math.floor(resolveNumberParam(rawParams.bufH, DEFAULTS.bufH)));
    const seed = resolveNumberParam(rawParams.seed, DEFAULTS.seed);
    const embossOverride = rawParams.embossText;
    const embossText =
      embossOverride === null || embossOverride === false || embossOverride === ""
        ? undefined
        : resolveStringParam(embossOverride, DEFAULTS.embossText);
    const embossStrength = resolveNumberParam(rawParams.embossStrength, DEFAULTS.embossStrength);

    this.ensureBuffers(bufW, bufH, { width: bufW, height: bufH, seed, embossText, embossStrength });

    const baseHeight = this.baseHeight;
    const dynamicHeight = this.dynamicHeight;
    const data = this.data;
    const bufferCtx = this.bufferCtx;
    if (!baseHeight || !dynamicHeight || !data || !bufferCtx || !this.imageData) {
      return;
    }

    if (audio.beat) {
      this.lastBeatTime = time;
    }
    const beatPulse = clamp(1 - (time - this.lastBeatTime) / BEAT_PULSE_DURATION, 0, 1);

    const audioReact = clamp(resolveNumberParam(rawParams.audioReact, DEFAULTS.audioReact), 0, 1);
    const beatKick = clamp(resolveNumberParam(rawParams.beatKick, DEFAULTS.beatKick), 0, 1);
    const beatBoost = beatPulse * beatKick * audioReact;

    const animateBumps = resolveBooleanParam(rawParams.animateBumps, DEFAULTS.animateBumps);
    const waveAmp = resolveNumberParam(rawParams.waveAmp, DEFAULTS.waveAmp);
    const waveFreqX = resolveNumberParam(rawParams.waveFreqX, DEFAULTS.waveFreqX);
    const waveFreqY = resolveNumberParam(rawParams.waveFreqY, DEFAULTS.waveFreqY);

    const bumpStrength = resolveNumberParam(rawParams.bumpStrength, DEFAULTS.bumpStrength);
    const bumpBoosted = bumpStrength * (1 + beatBoost * 0.35 + audio.bass * 0.4 * audioReact);
    const ambient = resolveNumberParam(rawParams.ambient, DEFAULTS.ambient);
    const diffuseStrength = resolveNumberParam(rawParams.diffuseStrength, DEFAULTS.diffuseStrength);
    const specStrength = resolveNumberParam(rawParams.specStrength, DEFAULTS.specStrength);
    const shininess = resolveNumberParam(rawParams.shininess, DEFAULTS.shininess);
    const lightZ = resolveNumberParam(rawParams.lightZ, DEFAULTS.lightZ);
    const lightSpeed = resolveNumberParam(rawParams.lightSpeed, DEFAULTS.lightSpeed) * (1 + audio.bass * 0.25 * audioReact);
    const baseHue = resolveNumberParam(rawParams.baseHue, DEFAULTS.baseHue);
    const paletteMode = resolvePaletteMode(rawParams.paletteMode, DEFAULTS.paletteMode);
    const scanlines = resolveBooleanParam(rawParams.scanlines, DEFAULTS.scanlines);

    const cx = bufW * 0.5;
    const cy = bufH * 0.5;
    const t = time * lightSpeed;
    const lightX = cx + Math.sin(t * 0.7) * cx * 0.8;
    const lightY = cy + Math.cos(t * 0.9) * cy * 0.6;

    if (animateBumps) {
      const waveTimeX = time * 1.2;
      const waveTimeY = time * 0.9;
      for (let y = 0; y < bufH; y += 1) {
        const row = y * bufW;
        const waveY = Math.sin(y * waveFreqY + waveTimeY);
        for (let x = 0; x < bufW; x += 1) {
          const waveX = Math.sin(x * waveFreqX + waveTimeX);
          dynamicHeight[row + x] = baseHeight[row + x] + (waveX + waveY) * waveAmp;
        }
      }
    } else {
      for (let i = 0; i < baseHeight.length; i += 1) {
        dynamicHeight[i] = baseHeight[i];
      }
    }

    for (let y = 1; y < bufH - 1; y += 1) {
      const row = y * bufW;
      for (let x = 1; x < bufW - 1; x += 1) {
        const idx = row + x;
        const hx = dynamicHeight[idx + 1] - dynamicHeight[idx - 1];
        const hy = dynamicHeight[idx + bufW] - dynamicHeight[idx - bufW];
        let nx = -hx * bumpBoosted;
        let ny = -hy * bumpBoosted;
        let nz = 1.0;
        const invLen = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz);
        nx *= invLen;
        ny *= invLen;
        nz *= invLen;

        let lx = lightX - x;
        let ly = lightY - y;
        let lz = lightZ;
        const invLLen = 1 / Math.sqrt(lx * lx + ly * ly + lz * lz);
        lx *= invLLen;
        ly *= invLLen;
        lz *= invLLen;

        const ndl = Math.max(0, nx * lx + ny * ly + nz * lz);
        const rz = 2 * ndl * nz - lz;
        const spec = specStrength > 0 ? Math.pow(Math.max(0, rz), shininess) : 0;
        let intensity = ambient + diffuseStrength * ndl + specStrength * spec;
        intensity *= 1 + beatBoost * 0.25;
        intensity = clamp(intensity, 0, 1.5);

        const heightValue = baseHeight[idx] / 255;
        let r = 0;
        let g = 0;
        let b = 0;
        if (paletteMode === "hsl") {
          const hue = baseHue + (heightValue - 0.5) * 40;
          const lightness = lerp(0.35, 0.55, heightValue);
          [r, g, b] = hslToRgb(hue, 0.6, lightness);
        } else {
          r = lerp(20, 60, heightValue);
          g = lerp(40, 110, heightValue);
          b = lerp(70, 220, heightValue);
        }

        const dataIndex = idx * 4;
        data[dataIndex] = clampByte(r * intensity);
        data[dataIndex + 1] = clampByte(g * intensity);
        data[dataIndex + 2] = clampByte(b * intensity);
        data[dataIndex + 3] = 255;
      }
    }

    this.clearEdges(bufW, bufH, data);
    bufferCtx.putImageData(this.imageData, 0, 0);

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.bufferCanvas as HTMLCanvasElement, 0, 0, width, height);
    if (scanlines) {
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      for (let y = 0; y < height; y += 2) {
        ctx.fillRect(0, y, width, 1);
      }
    }
    ctx.restore();
  }

  reset(): void {
    this.lastBeatTime = -Infinity;
  }

  private ensureBuffers(bufW: number, bufH: number, options: HeightMapOptions): void {
    if (!this.bufferCanvas || this.bufferWidth !== bufW || this.bufferHeight !== bufH) {
      this.bufferCanvas = document.createElement("canvas");
      this.bufferCanvas.width = bufW;
      this.bufferCanvas.height = bufH;
      const ctx = this.bufferCanvas.getContext("2d");
      if (!ctx) {
        throw new Error("Unable to create bumpmap plane buffer context");
      }
      this.bufferCtx = ctx;
      this.imageData = ctx.createImageData(bufW, bufH);
      this.data = this.imageData.data;
      this.bufferWidth = bufW;
      this.bufferHeight = bufH;
    }

    const heightKey = `${bufW}x${bufH}-${options.seed}-${options.embossText ?? ""}-${options.embossStrength}`;
    if (!this.baseHeight || !this.dynamicHeight || this.heightKey !== heightKey) {
      this.baseHeight = buildBaseHeightMap(options);
      this.dynamicHeight = new Int16Array(bufW * bufH);
      this.heightKey = heightKey;
    }
  }

  private clearEdges(bufW: number, bufH: number, data: Uint8ClampedArray): void {
    for (let x = 0; x < bufW; x += 1) {
      const top = x * 4;
      const bottom = ((bufH - 1) * bufW + x) * 4;
      data[top] = 0;
      data[top + 1] = 0;
      data[top + 2] = 0;
      data[top + 3] = 255;
      data[bottom] = 0;
      data[bottom + 1] = 0;
      data[bottom + 2] = 0;
      data[bottom + 3] = 255;
    }
    for (let y = 0; y < bufH; y += 1) {
      const left = (y * bufW) * 4;
      const right = (y * bufW + (bufW - 1)) * 4;
      data[left] = 0;
      data[left + 1] = 0;
      data[left + 2] = 0;
      data[left + 3] = 255;
      data[right] = 0;
      data[right + 1] = 0;
      data[right + 2] = 0;
      data[right + 3] = 255;
    }
  }
}
