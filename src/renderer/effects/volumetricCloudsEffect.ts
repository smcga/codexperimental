import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type VolumetricCloudsParams = {
  density: number;
  layers: number;
  windSpeed: number;
  cloudScale: number;
  detail: number;
  sunlight: number;
  haze: number;
  audioReact: number;
};

export const VOLUMETRIC_CLOUDS_DEFAULTS = {
  density: 0.62,
  layers: 4,
  windSpeed: 0.35,
  cloudScale: 1,
  detail: 0.7,
  sunlight: 0.55,
  haze: 0.24,
  audioReact: 0.4
} as const;

const toNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const resolveVolumetricCloudsParams = (params: Record<string, unknown>): VolumetricCloudsParams => ({
  density: clamp(toNumber(params.density, VOLUMETRIC_CLOUDS_DEFAULTS.density), 0.15, 1),
  layers: Math.round(clamp(toNumber(params.layers, VOLUMETRIC_CLOUDS_DEFAULTS.layers), 2, 8)),
  windSpeed: clamp(toNumber(params.windSpeed, VOLUMETRIC_CLOUDS_DEFAULTS.windSpeed), -2, 2),
  cloudScale: clamp(toNumber(params.cloudScale, VOLUMETRIC_CLOUDS_DEFAULTS.cloudScale), 0.4, 2.5),
  detail: clamp(toNumber(params.detail, VOLUMETRIC_CLOUDS_DEFAULTS.detail), 0.1, 1),
  sunlight: clamp(toNumber(params.sunlight, VOLUMETRIC_CLOUDS_DEFAULTS.sunlight), 0, 1),
  haze: clamp(toNumber(params.haze, VOLUMETRIC_CLOUDS_DEFAULTS.haze), 0, 0.8),
  audioReact: clamp(toNumber(params.audioReact, VOLUMETRIC_CLOUDS_DEFAULTS.audioReact), 0, 1)
});

const fract = (value: number): number => value - Math.floor(value);

const hash2 = (x: number, y: number): number => {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return fract(value);
};

const smoothNoise = (x: number, y: number): number => {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = x - x0;
  const ty = y - y0;

  const sx = tx * tx * (3 - 2 * tx);
  const sy = ty * ty * (3 - 2 * ty);

  const v00 = hash2(x0, y0);
  const v10 = hash2(x0 + 1, y0);
  const v01 = hash2(x0, y0 + 1);
  const v11 = hash2(x0 + 1, y0 + 1);

  const i0 = v00 + (v10 - v00) * sx;
  const i1 = v01 + (v11 - v01) * sx;

  return i0 + (i1 - i0) * sy;
};

const fbm = (x: number, y: number, detail: number): number => {
  let amplitude = 0.6;
  let frequency = 1;
  let sum = 0;
  let weight = 0;
  const octaveCount = 2 + Math.round(detail * 4);

  for (let i = 0; i < octaveCount; i += 1) {
    sum += smoothNoise(x * frequency, y * frequency) * amplitude;
    weight += amplitude;
    frequency *= 1.95;
    amplitude *= 0.5;
  }

  return weight > 0 ? sum / weight : 0;
};

export class VolumetricCloudsEffect implements Effect {
  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const config = resolveVolumetricCloudsParams(params as Record<string, unknown>);
    const bassLift = audio.bass * config.audioReact;
    const beatKick = audio.beat ? 0.12 * config.audioReact : 0;

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "rgb(18, 30, 56)");
    gradient.addColorStop(0.55, "rgb(56, 86, 128)");
    gradient.addColorStop(1, "rgb(176, 196, 214)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const horizonY = height * 0.46;
    const layerCount = config.layers;

    for (let layer = 0; layer < layerCount; layer += 1) {
      const layerDepth = layer / Math.max(1, layerCount - 1);
      const layerY = horizonY + layerDepth * height * 0.45;
      const samples = 52;
      const scale = config.cloudScale * (0.6 + layerDepth * 1.15);
      const drift = time * config.windSpeed * (14 + layerDepth * 30);
      const threshold = 0.48 - config.density * 0.24 + layerDepth * 0.1;
      const verticalRange = height * (0.08 + layerDepth * 0.16 + bassLift * 0.08);

      ctx.beginPath();
      ctx.moveTo(0, height);

      for (let i = 0; i <= samples; i += 1) {
        const u = i / samples;
        const x = u * width;
        const noiseSample = fbm(u * 5.5 * scale + drift * 0.01, layerDepth * 4.2 + time * 0.05, config.detail);
        const densityShape = clamp((noiseSample - threshold) / (1 - threshold), 0, 1);
        const softness = Math.pow(densityShape, 0.7 + (1 - config.detail) * 1.4);
        const y = layerY - softness * verticalRange * (1 + beatKick);
        ctx.lineTo(x, y);
      }

      ctx.lineTo(width, height);
      ctx.closePath();

      const sunContribution = (1 - layerDepth) * config.sunlight;
      const brightness = Math.round(170 + sunContribution * 70);
      const alpha = clamp(0.16 + config.density * 0.32 + layerDepth * 0.09 + audio.rms * config.audioReact * 0.2, 0.06, 0.85);
      ctx.fillStyle = `rgba(${brightness}, ${brightness + 8}, ${brightness + 14}, ${alpha.toFixed(3)})`;
      ctx.fill();
    }

    const hazeAlpha = clamp(config.haze + audio.rms * 0.08, 0, 0.9);
    ctx.fillStyle = `rgba(210, 225, 240, ${hazeAlpha.toFixed(3)})`;
    ctx.fillRect(0, horizonY, width, height - horizonY);
  }
}
