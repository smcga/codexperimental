import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type WaterDropsParams = {
  dropCount: number;
  minRadius: number;
  maxRadius: number;
  fallSpeed: number;
  distortion: number;
  trail: number;
  audioReact: number;
  tint: number;
  seed: number;
};

export const WATER_DROPS_DEFAULTS = {
  dropCount: 48,
  minRadius: 6,
  maxRadius: 24,
  fallSpeed: 0.22,
  distortion: 0.65,
  trail: 0.45,
  audioReact: 0.35,
  tint: 205,
  seed: 0
} as const;

const toNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const hashFloat = (value: number): number => {
  const hashed = Math.sin(value * 12.9898) * 43758.5453123;
  return hashed - Math.floor(hashed);
};

export const resolveWaterDropsParams = (params: Record<string, unknown>): WaterDropsParams => ({
  dropCount: Math.floor(clamp(toNumber(params.dropCount, WATER_DROPS_DEFAULTS.dropCount), 8, 220)),
  minRadius: clamp(toNumber(params.minRadius, WATER_DROPS_DEFAULTS.minRadius), 2, 80),
  maxRadius: clamp(toNumber(params.maxRadius, WATER_DROPS_DEFAULTS.maxRadius), 4, 120),
  fallSpeed: clamp(toNumber(params.fallSpeed, WATER_DROPS_DEFAULTS.fallSpeed), 0, 1.2),
  distortion: clamp(toNumber(params.distortion, WATER_DROPS_DEFAULTS.distortion), 0, 1),
  trail: clamp(toNumber(params.trail, WATER_DROPS_DEFAULTS.trail), 0, 1),
  audioReact: clamp(toNumber(params.audioReact, WATER_DROPS_DEFAULTS.audioReact), 0, 1),
  tint: clamp(toNumber(params.tint, WATER_DROPS_DEFAULTS.tint), 170, 230),
  seed: toNumber(params.seed, WATER_DROPS_DEFAULTS.seed)
});

export class WaterDropsEffect implements Effect {
  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const config = resolveWaterDropsParams(params as Record<string, unknown>);

    if (config.maxRadius < config.minRadius) {
      [config.minRadius, config.maxRadius] = [config.maxRadius, config.minRadius];
    }

    const beatPulse = audio.beat ? 1 : 0;
    const rippleDrive = 1 + audio.rms * config.audioReact + beatPulse * 0.35;

    ctx.fillStyle = "rgba(7, 14, 24, 0.2)";
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < config.dropCount; i += 1) {
      const seed = config.seed * 1000 + i;
      const baseX = hashFloat(seed + 2.13) * width;
      const baseY = hashFloat(seed + 6.79) * height;
      const radiusNoise = hashFloat(seed + 9.91);
      const speedNoise = 0.5 + hashFloat(seed + 4.77);
      const swayNoise = hashFloat(seed + 1.07) * Math.PI * 2;

      const y = (baseY + time * height * config.fallSpeed * speedNoise) % height;
      const sway = Math.sin(time * 1.8 + swayNoise) * config.distortion * 18 * speedNoise;
      const x = (baseX + sway + width) % width;
      const radius = config.minRadius + (config.maxRadius - config.minRadius) * radiusNoise * rippleDrive;

      const bodyAlpha = clamp(0.12 + radiusNoise * 0.18 + audio.rms * config.audioReact * 0.25, 0.08, 0.5);
      const edgeAlpha = clamp(0.28 + radiusNoise * 0.3 + beatPulse * 0.2, 0.2, 0.85);

      ctx.beginPath();
      ctx.fillStyle = `hsla(${config.tint}, 90%, 78%, ${bodyAlpha.toFixed(3)})`;
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = `hsla(${config.tint}, 96%, 90%, ${edgeAlpha.toFixed(3)})`;
      ctx.lineWidth = Math.max(1, radius * 0.08);
      ctx.arc(x, y, radius, Math.PI * 0.15, Math.PI * 1.85);
      ctx.stroke();

      const highlightX = x - radius * 0.28;
      const highlightY = y - radius * 0.3;
      const highlightR = Math.max(1, radius * 0.2);
      ctx.beginPath();
      ctx.fillStyle = `hsla(${config.tint}, 100%, 95%, ${clamp(bodyAlpha * 1.6, 0.1, 0.75).toFixed(3)})`;
      ctx.arc(highlightX, highlightY, highlightR, 0, Math.PI * 2);
      ctx.fill();

      if (config.trail > 0) {
        const trailLength = radius * (1.2 + config.trail * 3.2) * speedNoise;
        const trailWidth = Math.max(1, radius * 0.16 * config.trail);

        ctx.beginPath();
        ctx.strokeStyle = `hsla(${config.tint}, 82%, 82%, ${(edgeAlpha * 0.55).toFixed(3)})`;
        ctx.lineWidth = trailWidth;
        ctx.moveTo(x, y + radius * 0.4);
        ctx.lineTo(x + sway * 0.08, y + radius * 0.4 + trailLength);
        ctx.stroke();
      }
    }
  }
}
