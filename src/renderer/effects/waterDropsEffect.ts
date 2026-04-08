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
    const beatKick = clamp(audio.beatStrength, 0, 1);
    const refractDrive = config.refraction * (1 + audio.rms * config.audioReact + beatPulse * 0.25 + beatKick * 0.18);
    const ambientMist = clamp(0.06 + audio.rms * config.audioReact * 0.3, 0.05, 0.2);

    for (let i = 0; i < config.dropCount; i += 1) {
      const seed = config.seed * 1000 + i;
      const baseX = hashFloat(seed + 2.13) * width;
      const baseY = hashFloat(seed + 6.79) * height;
      const radiusNoise = hashFloat(seed + 9.91);
      const speedNoise = 0.5 + hashFloat(seed + 4.77);
      const swayNoise = hashFloat(seed + 1.07) * Math.PI * 2;

      const y = (baseY + time * height * config.fallSpeed * speedNoise) % height;
      const wind = Math.sin(time * 0.35 + i * 0.07) * config.distortion * 10;
      const sway = Math.sin(time * 1.8 + swayNoise) * config.distortion * 14 * speedNoise;
      const x = (baseX + sway + wind + width) % width;
      const radius = config.minRadius + (config.maxRadius - config.minRadius) * radiusNoise;

      const bodyAlpha = clamp(0.07 + radiusNoise * 0.09 + refractDrive * 0.035, 0.05, 0.28);
      const darkAlpha = clamp(0.3 + radiusNoise * 0.3 + refractDrive * 0.24, 0.22, 0.94);
      const lightAlpha = clamp(0.28 + radiusNoise * 0.25 + refractDrive * 0.28, 0.2, 0.98);
      const sparkleAlpha = clamp(lightAlpha * (0.65 + beatKick * 0.35), 0.2, 1);

      ctx.beginPath();
      ctx.fillStyle = `hsla(${config.tint}, 52%, 72%, ${bodyAlpha.toFixed(3)})`;
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Subtle refraction core adds depth and a "lens" feel.
      ctx.beginPath();
      ctx.fillStyle = `hsla(${config.tint + 8}, 65%, 82%, ${clamp(bodyAlpha * 0.75, 0.06, 0.3).toFixed(3)})`;
      ctx.arc(x - radius * 0.08, y - radius * 0.06, Math.max(0.8, radius * 0.44), 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = `rgba(8, 12, 18, ${darkAlpha.toFixed(3)})`;
      ctx.lineWidth = Math.max(1, radius * 0.15);
      ctx.arc(x + radius * 0.06, y - radius * 0.04, radius * 0.82, Math.PI * 1.04, Math.PI * 1.95);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = `rgba(255, 255, 255, ${lightAlpha.toFixed(3)})`;
      ctx.lineWidth = Math.max(1, radius * 0.12);
      ctx.arc(x - radius * 0.1, y - radius * 0.1, radius * 0.76, Math.PI * 0.14, Math.PI * 0.98);
      ctx.stroke();

      // A faint secondary chroma rim makes larger drops shimmer.
      ctx.beginPath();
      ctx.strokeStyle = `hsla(${config.tint - 18}, 80%, 76%, ${clamp(lightAlpha * 0.38, 0.08, 0.5).toFixed(3)})`;
      ctx.lineWidth = Math.max(0.6, radius * 0.06);
      ctx.arc(x - radius * 0.02, y + radius * 0.03, radius * 0.68, Math.PI * 0.05, Math.PI * 0.88);
      ctx.stroke();

      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 255, ${sparkleAlpha.toFixed(3)})`;
      ctx.arc(x - radius * 0.24, y - radius * 0.22, Math.max(0.7, radius * 0.17), 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 255, ${clamp(sparkleAlpha * 0.55, 0.15, 0.6).toFixed(3)})`;
      ctx.arc(x + radius * 0.09, y - radius * 0.05, Math.max(0.5, radius * 0.08), 0, Math.PI * 2);
      ctx.fill();

      if (config.trail > 0.01) {
        const trailLength = radius * (1.1 + config.trail * 3.6) * speedNoise;
        const trailWidth = Math.max(0.5, radius * 0.09 * config.trail);
        const bend = Math.sin(time * 0.9 + seed * 0.01) * config.distortion * 4;
        const spread = Math.sin(time * 1.2 + seed * 0.022) * config.distortion * 2.8;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 255, 255, ${(lightAlpha * 0.44).toFixed(3)})`;
        ctx.lineWidth = trailWidth;
        ctx.moveTo(x, y + radius * 0.38);
        ctx.quadraticCurveTo(x + bend, y + radius * 0.5 + trailLength * 0.5, x + bend * 0.4, y + radius * 0.4 + trailLength);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = `rgba(20, 28, 40, ${(darkAlpha * 0.28).toFixed(3)})`;
        ctx.lineWidth = Math.max(0.5, trailWidth * 0.68);
        ctx.moveTo(x + spread * 0.2, y + radius * 0.42);
        ctx.quadraticCurveTo(
          x + bend + spread,
          y + radius * 0.56 + trailLength * 0.48,
          x + bend * 0.45 + spread * 0.25,
          y + radius * 0.44 + trailLength
        );
        ctx.stroke();
      }
    }

    const microCount = Math.floor(config.dropCount * (0.6 + config.microDrops * 2.2));
    for (let i = 0; i < microCount; i += 1) {
      const seed = config.seed * 4000 + i;
      const x = hashFloat(seed + 18.3) * width;
      const y = (hashFloat(seed + 45.6) * height + time * height * config.fallSpeed * 0.24) % height;
      const r = 0.55 + hashFloat(seed + 91.2) * 1.75;
      const alpha = clamp(0.2 + hashFloat(seed + 12.2) * 0.58 + refractDrive * 0.07, 0.18, 0.92);

      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      if (hashFloat(seed + 128.4) > 0.7) {
        ctx.beginPath();
        ctx.fillStyle = `hsla(${config.tint + 12}, 78%, 82%, ${clamp(alpha * 0.35, 0.08, 0.4).toFixed(3)})`;
        ctx.arc(x - r * 0.22, y - r * 0.2, Math.max(0.35, r * 0.46), 0, Math.PI * 2);
        ctx.fill();
      }
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

    // Light atmospheric film sells the wet-glass surface without hiding content.
    ctx.beginPath();
    ctx.fillStyle = `rgba(198, 220, 255, ${ambientMist.toFixed(3)})`;
    ctx.arc(width * 0.5, height * 0.5, Math.max(width, height) * 0.78, 0, Math.PI * 2);
    ctx.fill();
  }
}
