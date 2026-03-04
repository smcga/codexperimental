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
  refraction: number;
  microDrops: number;
  rivulets: number;
  seed: number;
};

export const WATER_DROPS_DEFAULTS = {
  dropCount: 72,
  minRadius: 3,
  maxRadius: 18,
  fallSpeed: 0.12,
  distortion: 0.38,
  trail: 0.28,
  audioReact: 0.25,
  tint: 205,
  refraction: 0.85,
  microDrops: 0.7,
  rivulets: 0.35,
  seed: 0
} as const;

const toNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const hashFloat = (value: number): number => {
  const hashed = Math.sin(value * 12.9898) * 43758.5453123;
  return hashed - Math.floor(hashed);
};

export const resolveWaterDropsParams = (params: Record<string, unknown>): WaterDropsParams => ({
  dropCount: Math.floor(clamp(toNumber(params.dropCount, WATER_DROPS_DEFAULTS.dropCount), 8, 280)),
  minRadius: clamp(toNumber(params.minRadius, WATER_DROPS_DEFAULTS.minRadius), 1, 80),
  maxRadius: clamp(toNumber(params.maxRadius, WATER_DROPS_DEFAULTS.maxRadius), 2, 120),
  fallSpeed: clamp(toNumber(params.fallSpeed, WATER_DROPS_DEFAULTS.fallSpeed), 0, 1.2),
  distortion: clamp(toNumber(params.distortion, WATER_DROPS_DEFAULTS.distortion), 0, 1),
  trail: clamp(toNumber(params.trail, WATER_DROPS_DEFAULTS.trail), 0, 1),
  audioReact: clamp(toNumber(params.audioReact, WATER_DROPS_DEFAULTS.audioReact), 0, 1),
  tint: clamp(toNumber(params.tint, WATER_DROPS_DEFAULTS.tint), 170, 230),
  refraction: clamp(toNumber(params.refraction, WATER_DROPS_DEFAULTS.refraction), 0, 1),
  microDrops: clamp(toNumber(params.microDrops, WATER_DROPS_DEFAULTS.microDrops), 0, 1),
  rivulets: clamp(toNumber(params.rivulets, WATER_DROPS_DEFAULTS.rivulets), 0, 1),
  seed: toNumber(params.seed, WATER_DROPS_DEFAULTS.seed)
});

export class WaterDropsEffect implements Effect {
  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const config = resolveWaterDropsParams(params as Record<string, unknown>);

    if (config.maxRadius < config.minRadius) {
      [config.minRadius, config.maxRadius] = [config.maxRadius, config.minRadius];
    }

    const beatPulse = audio.beat ? 1 : 0;
    const refractDrive = config.refraction * (1 + audio.rms * config.audioReact + beatPulse * 0.25);

    for (let i = 0; i < config.dropCount; i += 1) {
      const seed = config.seed * 1000 + i;
      const baseX = hashFloat(seed + 2.13) * width;
      const baseY = hashFloat(seed + 6.79) * height;
      const radiusNoise = hashFloat(seed + 9.91);
      const speedNoise = 0.5 + hashFloat(seed + 4.77);
      const swayNoise = hashFloat(seed + 1.07) * Math.PI * 2;

      const y = (baseY + time * height * config.fallSpeed * speedNoise) % height;
      const sway = Math.sin(time * 1.8 + swayNoise) * config.distortion * 14 * speedNoise;
      const x = (baseX + sway + width) % width;
      const radius = config.minRadius + (config.maxRadius - config.minRadius) * radiusNoise;

      const bodyAlpha = clamp(0.05 + radiusNoise * 0.08 + refractDrive * 0.03, 0.04, 0.22);
      const darkAlpha = clamp(0.28 + radiusNoise * 0.3 + refractDrive * 0.2, 0.2, 0.9);
      const lightAlpha = clamp(0.25 + radiusNoise * 0.25 + refractDrive * 0.25, 0.18, 0.95);

      ctx.beginPath();
      ctx.fillStyle = `hsla(${config.tint}, 45%, 70%, ${bodyAlpha.toFixed(3)})`;
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = `rgba(8, 12, 18, ${darkAlpha.toFixed(3)})`;
      ctx.lineWidth = Math.max(1, radius * 0.15);
      ctx.arc(x + radius * 0.06, y - radius * 0.04, radius * 0.8, Math.PI * 1.04, Math.PI * 1.92);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = `rgba(255, 255, 255, ${lightAlpha.toFixed(3)})`;
      ctx.lineWidth = Math.max(1, radius * 0.12);
      ctx.arc(x - radius * 0.1, y - radius * 0.1, radius * 0.76, Math.PI * 0.14, Math.PI * 0.98);
      ctx.stroke();

      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 255, ${clamp(lightAlpha * 0.9, 0.14, 0.9).toFixed(3)})`;
      ctx.arc(x - radius * 0.24, y - radius * 0.22, Math.max(0.7, radius * 0.16), 0, Math.PI * 2);
      ctx.fill();

      if (config.trail > 0.01) {
        const trailLength = radius * (1.1 + config.trail * 3.3) * speedNoise;
        const trailWidth = Math.max(0.5, radius * 0.08 * config.trail);
        const bend = Math.sin(time * 0.9 + seed * 0.01) * config.distortion * 4;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 255, 255, ${(lightAlpha * 0.38).toFixed(3)})`;
        ctx.lineWidth = trailWidth;
        ctx.moveTo(x, y + radius * 0.38);
        ctx.quadraticCurveTo(x + bend, y + radius * 0.5 + trailLength * 0.5, x + bend * 0.4, y + radius * 0.4 + trailLength);
        ctx.stroke();
      }
    }

    const microCount = Math.floor(config.dropCount * (0.6 + config.microDrops * 2.2));
    for (let i = 0; i < microCount; i += 1) {
      const seed = config.seed * 4000 + i;
      const x = hashFloat(seed + 18.3) * width;
      const y = (hashFloat(seed + 45.6) * height + time * height * config.fallSpeed * 0.24) % height;
      const r = 0.55 + hashFloat(seed + 91.2) * 1.75;
      const alpha = clamp(0.2 + hashFloat(seed + 12.2) * 0.55 + refractDrive * 0.06, 0.18, 0.9);

      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const rivuletCount = Math.floor(config.rivulets * 6);
    for (let i = 0; i < rivuletCount; i += 1) {
      const seed = config.seed * 7000 + i;
      const x = hashFloat(seed + 2.7) * width;
      const phase = time * (0.2 + hashFloat(seed + 4.4) * 0.4);
      const y0 = ((hashFloat(seed + 5.8) + phase) % 1) * height;
      const length = height * (0.1 + hashFloat(seed + 7.1) * 0.26);
      const wobble = (hashFloat(seed + 8.9) - 0.5) * (18 + config.distortion * 25);

      ctx.beginPath();
      ctx.strokeStyle = `rgba(15, 22, 34, ${(0.2 + config.rivulets * 0.35).toFixed(3)})`;
      ctx.lineWidth = 1 + hashFloat(seed + 9.2) * 1.2;
      ctx.moveTo(x, y0);
      ctx.quadraticCurveTo(x + wobble, y0 + length * 0.52, x + wobble * 0.3, y0 + length);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = `rgba(255, 255, 255, ${(0.25 + config.rivulets * 0.3).toFixed(3)})`;
      ctx.lineWidth = 0.6;
      ctx.moveTo(x + 0.8, y0 + 0.8);
      ctx.quadraticCurveTo(x + wobble + 0.8, y0 + length * 0.52 + 0.8, x + wobble * 0.3 + 0.8, y0 + length + 0.8);
      ctx.stroke();
    }
  }
}
