import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type RgbColor = { r: number; g: number; b: number };

type CausticsParams = {
  scale: number;
  speed: number;
  intensity: number;
  contrast: number;
  warp: number;
  detail: number;
  background: string | number;
  color: string;
  glow: number;
  seed: number;
  audioReactive: number;
  driftX: number;
  driftY: number;
};

export const CAUSTICS_DEFAULTS: CausticsParams = {
  scale: 1,
  speed: 1,
  intensity: 1,
  contrast: 1,
  warp: 0.45,
  detail: 0.55,
  background: "#071018",
  color: "#8fd6ff",
  glow: 0.42,
  seed: 1,
  audioReactive: 0.35,
  driftX: 0.015,
  driftY: 0.01
};

const toFiniteNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const toColorString = (value: unknown, fallback: string): string =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;

const clamp01 = (value: number): number => clamp(value, 0, 1);

const parseHexColor = (value: string): RgbColor | null => {
  const raw = value.trim();
  const short = /^#([\da-f]{3})$/i.exec(raw);
  if (short) {
    const [r, g, b] = short[1].split("").map((c) => parseInt(`${c}${c}`, 16));
    return { r, g, b };
  }

  const long = /^#([\da-f]{6})$/i.exec(raw);
  if (long) {
    const hex = long[1];
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16)
    };
  }

  return null;
};

const resolveBackgroundColor = (background: string | number): RgbColor => {
  if (typeof background === "number" && Number.isFinite(background)) {
    const normalized = clamp(background <= 1 ? background : background / 255, 0, 1);
    const base = Math.round(normalized * 48);
    return { r: base * 0.4, g: base * 0.6, b: base };
  }

  return parseHexColor(String(background)) ?? { r: 7, g: 16, b: 24 };
};

const resolveMainColor = (color: string): RgbColor => parseHexColor(color) ?? { r: 143, g: 214, b: 255 };

export const resolveCausticsParams = (params: Record<string, unknown>): CausticsParams => ({
  scale: clamp(toFiniteNumber(params.scale, CAUSTICS_DEFAULTS.scale), 0.35, 3),
  speed: clamp(toFiniteNumber(params.speed, CAUSTICS_DEFAULTS.speed), 0, 3),
  intensity: clamp(toFiniteNumber(params.intensity, CAUSTICS_DEFAULTS.intensity), 0, 3),
  contrast: clamp(toFiniteNumber(params.contrast, CAUSTICS_DEFAULTS.contrast), 0.2, 3),
  warp: clamp(toFiniteNumber(params.warp, CAUSTICS_DEFAULTS.warp), 0, 2),
  detail: clamp(toFiniteNumber(params.detail, CAUSTICS_DEFAULTS.detail), 0, 1.5),
  background:
    typeof params.background === "string" || typeof params.background === "number"
      ? params.background
      : CAUSTICS_DEFAULTS.background,
  color: toColorString(params.color, CAUSTICS_DEFAULTS.color),
  glow: clamp(toFiniteNumber(params.glow, CAUSTICS_DEFAULTS.glow), 0, 1.5),
  seed: toFiniteNumber(params.seed, CAUSTICS_DEFAULTS.seed),
  audioReactive: clamp(toFiniteNumber(params.audioReactive, CAUSTICS_DEFAULTS.audioReactive), 0, 1),
  driftX: clamp(toFiniteNumber(params.driftX, CAUSTICS_DEFAULTS.driftX), -1, 1),
  driftY: clamp(toFiniteNumber(params.driftY, CAUSTICS_DEFAULTS.driftY), -1, 1)
});

const hashNoise = (x: number, y: number, seed: number): number => {
  const h = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return h - Math.floor(h);
};

export const sampleCausticsField = (
  x: number,
  y: number,
  t: number,
  params: Pick<CausticsParams, "scale" | "contrast" | "warp" | "detail" | "seed">
): number => {
  const scale = params.scale;
  const warp = params.warp;
  const detail = params.detail;

  const driftWarp = Math.sin((x + t * 0.05) * 5.3 + params.seed * 0.2) * Math.cos((y - t * 0.04) * 4.7 - params.seed * 0.17);
  const wobble = warp * 0.33;
  const u = x * scale + driftWarp * wobble;
  const v = y * scale - driftWarp * wobble;

  const primaryPhase = t * 0.9;
  const secondaryPhase = -t * (1.35 + detail * 0.45);

  const f1 = Math.sin(u * 19 + Math.sin(v * 3.9 + primaryPhase) * (0.7 + warp * 1.8));
  const g1 = Math.cos(v * 17 - Math.cos(u * 4.4 - primaryPhase * 0.8) * (0.6 + warp * 1.6));
  const ridgeA = 1 - clamp01(Math.abs(f1 * g1) * (2.8 + params.contrast * 2.2));

  const f2 = Math.sin((u * (12 + detail * 9)) + secondaryPhase + Math.sin(v * 5.2 + primaryPhase) * warp);
  const g2 = Math.cos((v * (13 + detail * 7)) - secondaryPhase + Math.sin(u * 4.3 - primaryPhase) * warp * 0.8);
  const ridgeB = 1 - clamp01(Math.abs(f2 * g2) * (2.4 + params.contrast * 2.5));

  const patches = Math.pow(ridgeA * ridgeB, 1.15 + detail * 0.7);
  const web = ridgeA * (0.78 + detail * 0.22) + ridgeB * (0.35 + detail * 0.5);

  const grain = (hashNoise(Math.floor(x * 53), Math.floor(y * 53), params.seed) - 0.5) * 0.03;
  const shaped = Math.pow(clamp01(web * 0.82 + patches * 1.45 + grain), 1.1 + params.contrast * 1.35);

  return clamp01(shaped);
};

export class CausticsEffect implements Effect {
  private bufferCanvas: HTMLCanvasElement | null = null;
  private bufferCtx: CanvasRenderingContext2D | null = null;
  private imageData: ImageData | null = null;
  private pixels: Uint8ClampedArray | null = null;
  private bufW = 0;
  private bufH = 0;
  private beatPulse = 0;

  render({ ctx, width, height, time, delta, audio, params, era }: EffectRenderContext): void {
    const config = resolveCausticsParams(params as Record<string, unknown>);

    const eraName = era ?? "pcdemo";
    const lowFi = eraName === "8bit" || eraName === "16bit";

    const targetW = Math.max(96, Math.round(width / (lowFi ? 4.8 : 4.2)));
    const targetH = Math.max(54, Math.round(height / (lowFi ? 4.8 : 4.2)));
    this.ensureBuffer(targetW, targetH);

    if (!this.bufferCtx || !this.imageData || !this.pixels || !this.bufferCanvas) {
      return;
    }

    const dt = clamp(delta || 0, 0, 0.05);
    if (audio.beat) {
      this.beatPulse = 1;
    } else {
      this.beatPulse = Math.max(0, this.beatPulse - dt * 3.4);
    }

    const audioDrive = config.audioReactive * (audio.rms * 0.55 + audio.bass * 0.35 + this.beatPulse * 0.5);
    const motionTime = time * config.speed * (1 + audioDrive * 0.3);
    const contrast = config.contrast * (1 + audioDrive * 0.18);
    const warp = config.warp * (1 + audioDrive * 0.12);
    const intensity = config.intensity * (1 + audioDrive * 0.35);

    const color = resolveMainColor(config.color);
    const bg = resolveBackgroundColor(config.background);

    const detailBoost = eraName === "future" ? 1.18 : eraName === "ps1" || eraName === "pcdemo" ? 1 : 0.78;
    const glowBoost = eraName === "future" ? 1.25 : eraName === "ps1" || eraName === "pcdemo" ? 1 : 0.68;
    const levels = eraName === "8bit" ? 6 : eraName === "16bit" ? 10 : 255;

    const data = this.pixels;
    for (let py = 0; py < targetH; py += 1) {
      const ny = py / targetH + motionTime * config.driftY * 0.12;
      for (let px = 0; px < targetW; px += 1) {
        const nx = px / targetW + motionTime * config.driftX * 0.12;

        const sample = sampleCausticsField(nx, ny, motionTime, {
          scale: config.scale * 1.35,
          contrast,
          warp,
          detail: config.detail * detailBoost,
          seed: config.seed
        });

        const shade = clamp01(sample * intensity);
        const quantized = levels >= 255 ? shade : Math.round(shade * levels) / levels;
        const luma = quantized;

        const idx = (py * targetW + px) * 4;
        data[idx] = clamp(bg.r + color.r * luma, 0, 255);
        data[idx + 1] = clamp(bg.g + color.g * luma, 0, 255);
        data[idx + 2] = clamp(bg.b + color.b * luma, 0, 255);
        data[idx + 3] = 255;
      }
    }

    this.bufferCtx.putImageData(this.imageData, 0, 0);

    const prevSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = !lowFi;
    ctx.drawImage(this.bufferCanvas, 0, 0, targetW, targetH, 0, 0, width, height);
    ctx.imageSmoothingEnabled = prevSmoothing;

    const finalGlow = clamp(config.glow * glowBoost + audioDrive * 0.25, 0, 1.6);
    if (finalGlow > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = finalGlow * 0.38;
      ctx.drawImage(this.bufferCanvas, -width * 0.01, -height * 0.01, width * 1.02, height * 1.02);
      ctx.globalAlpha = finalGlow * 0.2;
      ctx.drawImage(this.bufferCanvas, -width * 0.02, -height * 0.02, width * 1.04, height * 1.04);
      ctx.restore();
    }
  }

  private ensureBuffer(width: number, height: number): void {
    if (this.bufferCanvas && this.bufferCtx && this.imageData && this.bufW === width && this.bufH === height) {
      return;
    }

    this.bufW = width;
    this.bufH = height;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    this.bufferCanvas = canvas;
    this.bufferCtx = context;
    this.imageData = context.createImageData(width, height);
    this.pixels = this.imageData.data;
  }
}
