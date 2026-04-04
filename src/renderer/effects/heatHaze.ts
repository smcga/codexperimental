import { clamp, lerp, smoothstep } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

export type HeatHazeRegion = "bottom" | "band" | "full";

type HeatHazeParams = {
  intensity: number;
  speed: number;
  scale: number;
  drift: number;
  region: HeatHazeRegion;
  centerY: number;
  height: number;
  feather: number;
  shimmer: number;
  blurHint: number;
  tint: number;
  audioReactive: boolean;
  beatBoost: number;
  bassInfluence: number;
  seed: number;
};

type CanvasCache = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
};

export const HEAT_HAZE_DEFAULTS: HeatHazeParams = {
  intensity: 0.8,
  speed: 1,
  scale: 1,
  drift: 1,
  region: "bottom",
  centerY: 0.75,
  height: 0.35,
  feather: 0.2,
  shimmer: 0.6,
  blurHint: 0.15,
  tint: 0.08,
  audioReactive: true,
  beatBoost: 0.35,
  bassInfluence: 0.25,
  seed: 1
};

const getNumberParam = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const getStringParam = (value: unknown, fallback: HeatHazeRegion): HeatHazeRegion =>
  value === "full" || value === "band" || value === "bottom" ? value : fallback;

const getBooleanParam = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value > 0;
  }
  return fallback;
};

export const noise1d = (x: number, seed: number): number => {
  const s = Math.sin(x * 127.1 + seed * 311.7) * 43758.5453123;
  return s - Math.floor(s);
};

export const valueNoise1d = (x: number, seed: number): number => {
  const i0 = Math.floor(x);
  const frac = x - i0;
  const smooth = frac * frac * (3 - 2 * frac);
  const n0 = noise1d(i0, seed);
  const n1 = noise1d(i0 + 1, seed);
  return lerp(n0, n1, smooth) * 2 - 1;
};

export const getRegionWeight = (yn: number, params: Pick<HeatHazeParams, "region" | "centerY" | "height" | "feather">): number => {
  const centerY = clamp(params.centerY, 0, 1);
  const span = clamp(params.height, 0.02, 1);
  const feather = clamp(params.feather, 0.001, 1);

  if (params.region === "full") {
    return 1;
  }

  if (params.region === "bottom") {
    const start = clamp(1 - span, 0, 1);
    return smoothstep(start - feather, start + feather, yn);
  }

  const half = span * 0.5;
  const top = clamp(centerY - half, 0, 1);
  const bottom = clamp(centerY + half, 0, 1);
  const topFade = smoothstep(top - feather, top + feather, yn);
  const bottomFade = 1 - smoothstep(bottom - feather, bottom + feather, yn);
  return clamp(topFade * bottomFade, 0, 1);
};

const resolveHeatHazeParams = (raw: Record<string, unknown>): HeatHazeParams => ({
  intensity: clamp(getNumberParam(raw.intensity, HEAT_HAZE_DEFAULTS.intensity), 0, 2),
  speed: clamp(getNumberParam(raw.speed, HEAT_HAZE_DEFAULTS.speed), 0, 3),
  scale: clamp(getNumberParam(raw.scale, HEAT_HAZE_DEFAULTS.scale), 0.35, 3),
  drift: clamp(getNumberParam(raw.drift, HEAT_HAZE_DEFAULTS.drift), 0, 2),
  region: getStringParam(raw.region, HEAT_HAZE_DEFAULTS.region),
  centerY: clamp(getNumberParam(raw.centerY, HEAT_HAZE_DEFAULTS.centerY), 0, 1),
  height: clamp(getNumberParam(raw.height, HEAT_HAZE_DEFAULTS.height), 0.05, 1),
  feather: clamp(getNumberParam(raw.feather, HEAT_HAZE_DEFAULTS.feather), 0.01, 0.5),
  shimmer: clamp(getNumberParam(raw.shimmer, HEAT_HAZE_DEFAULTS.shimmer), 0, 1.5),
  blurHint: clamp(getNumberParam(raw.blurHint, HEAT_HAZE_DEFAULTS.blurHint), 0, 0.6),
  tint: clamp(getNumberParam(raw.tint, HEAT_HAZE_DEFAULTS.tint), 0, 0.4),
  audioReactive: getBooleanParam(raw.audioReactive, HEAT_HAZE_DEFAULTS.audioReactive),
  beatBoost: clamp(getNumberParam(raw.beatBoost, HEAT_HAZE_DEFAULTS.beatBoost), 0, 1.2),
  bassInfluence: clamp(getNumberParam(raw.bassInfluence, HEAT_HAZE_DEFAULTS.bassInfluence), 0, 1),
  seed: getNumberParam(raw.seed, HEAT_HAZE_DEFAULTS.seed)
});

export class HeatHazeEffect implements Effect {
  private sourceCache: CanvasCache | null = null;
  private beatPulse = 0;

  reset(): void {
    this.beatPulse = 0;
  }

  private ensureCanvas(cache: CanvasCache | null, width: number, height: number): CanvasCache | null {
    if (typeof document === "undefined") {
      return null;
    }

    if (cache && cache.width === width && cache.height === height) {
      return cache;
    }

    const canvas = cache?.canvas ?? document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const canvasCtx = canvas.getContext("2d");
    if (!canvasCtx) {
      return null;
    }

    return { canvas, ctx: canvasCtx, width, height };
  }

  private drawWrappedStrip(
    targetCtx: CanvasRenderingContext2D,
    sourceCanvas: HTMLCanvasElement,
    y: number,
    stripHeight: number,
    xOffset: number,
    yOffset: number
  ): void {
    const width = sourceCanvas.width;
    const sourceY = ((y + yOffset) % sourceCanvas.height + sourceCanvas.height) % sourceCanvas.height;

    targetCtx.drawImage(sourceCanvas, 0, sourceY, width, stripHeight, xOffset, y, width, stripHeight);

    if (xOffset > 0.01) {
      targetCtx.drawImage(sourceCanvas, 0, sourceY, width, stripHeight, xOffset - width, y, width, stripHeight);
    } else if (xOffset < -0.01) {
      targetCtx.drawImage(sourceCanvas, 0, sourceY, width, stripHeight, xOffset + width, y, width, stripHeight);
    }
  }

  render({ ctx, width, height, time, delta, audio, params, era }: EffectRenderContext): void {
    const config = resolveHeatHazeParams(params as Record<string, unknown>);
    const dt = clamp(delta, 0, 0.05);

    if (audio.beat) {
      this.beatPulse = 1;
    } else {
      this.beatPulse = Math.max(0, this.beatPulse - dt * 5.5);
    }

    const eraIntensityScale = era === "8bit" || era === "16bit" ? 0.8 : 1;
    const eraStripMultiplier = era === "8bit" || era === "16bit" ? 1.5 : 1;

    const audioDrive = config.audioReactive
      ? audio.rms * 0.2 + audio.bass * config.bassInfluence + this.beatPulse * config.beatBoost
      : 0;

    const effectiveIntensity = config.intensity * eraIntensityScale * (1 + audioDrive * 0.55);
    const stripHeight = Math.max(1, Math.round((1 + (2 - config.scale) * 1.2) * eraStripMultiplier));

    this.sourceCache = this.ensureCanvas(this.sourceCache, width, height);
    if (!this.sourceCache) {
      ctx.fillStyle = "#120f0a";
      ctx.fillRect(0, 0, width, height);
      return;
    }

    const sourceCtx = this.sourceCache.ctx;
    sourceCtx.clearRect(0, 0, width, height);
    sourceCtx.drawImage(ctx.canvas, 0, 0, width, height);

    const tintBase = clamp(config.tint * (0.7 + audioDrive * 0.45), 0, 0.5);
    if (tintBase > 0.001) {
      const gradient = sourceCtx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, `rgba(255, 180, 95, ${Math.min(0.25, tintBase).toFixed(3)})`);
      gradient.addColorStop(0.45, `rgba(255, 170, 85, ${(tintBase * 0.45).toFixed(3)})`);
      gradient.addColorStop(1, "rgba(255, 160, 90, 0)");
      sourceCtx.fillStyle = gradient;
      sourceCtx.fillRect(0, 0, width, height);
    }

    sourceCtx.globalAlpha = 0.08;
    sourceCtx.fillStyle = "rgba(255, 196, 132, 0.12)";
    sourceCtx.fillRect(0, height * 0.78, width, height * 0.22);
    sourceCtx.globalAlpha = 1;

    ctx.clearRect(0, 0, width, height);

    const turbulenceScale = 0.0075 / config.scale;
    const microScale = 0.035 / config.scale;
    const driftSpeed = time * (0.8 + config.speed * 1.2);
    const advect = time * config.drift * 26;

    for (let y = 0; y < height; y += stripHeight) {
      const h = Math.min(stripHeight, height - y);
      const yn = y / Math.max(1, height - 1);
      const regionWeight = getRegionWeight(yn, config);

      if (regionWeight < 0.005) {
        ctx.drawImage(this.sourceCache.canvas, 0, y, width, h, 0, y, width, h);
        continue;
      }

      const bandCoord = y * turbulenceScale - advect * 0.03;
      const largeNoise = valueNoise1d(bandCoord + driftSpeed * 0.22, config.seed + 17.3);
      const midNoise = valueNoise1d(bandCoord * 2.4 + driftSpeed * 0.46, config.seed + 53.7);
      const micro = valueNoise1d((y + advect) * microScale + driftSpeed * 2.5, config.seed + 97.1);
      const shimmer = Math.sin((y + config.seed * 11.3) * 0.071 + driftSpeed * 4.8) * config.shimmer;

      const displacement =
        (largeNoise * 0.68 + midNoise * 0.27 + micro * 0.13 * config.shimmer + shimmer * 0.2) *
        effectiveIntensity *
        10 *
        regionWeight;

      const vertical = valueNoise1d(y * 0.021 + driftSpeed * 0.65, config.seed + 31.9) * 0.8 * config.drift * regionWeight;

      this.drawWrappedStrip(ctx, this.sourceCache.canvas, y, h, displacement, vertical);

      const blurPassAlpha = clamp(config.blurHint * regionWeight * 0.45, 0, 0.2);
      if (blurPassAlpha > 0.01) {
        ctx.globalAlpha = blurPassAlpha;
        this.drawWrappedStrip(ctx, this.sourceCache.canvas, y, h, displacement * 0.55 + 0.45, vertical * 0.4);
        ctx.globalAlpha = 1;
      }
    }

    const glowAlpha = clamp(config.tint * (0.2 + audioDrive * 0.2), 0, 0.18);
    if (glowAlpha > 0.002) {
      const glow = ctx.createLinearGradient(0, height, 0, 0);
      glow.addColorStop(0, `rgba(255, 166, 92, ${glowAlpha.toFixed(3)})`);
      glow.addColorStop(0.35, `rgba(255, 166, 92, ${(glowAlpha * 0.35).toFixed(3)})`);
      glow.addColorStop(1, "rgba(255, 166, 92, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    }
  }
}
