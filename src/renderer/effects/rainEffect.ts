import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

const BASE_DENSITY = 0.00075;
const BEAT_BOOST_DURATION = 0.16;

type RainLayer = {
  speed: number;
  length: number;
  alpha: number;
  thickness: number;
  countScale: number;
};

const RAIN_LAYERS: RainLayer[] = [
  { speed: 1.6, length: 1.1, alpha: 0.6, thickness: 1.0, countScale: 1.2 },
  { speed: 1.1, length: 0.7, alpha: 0.35, thickness: 0.7, countScale: 0.9 }
];

export function hashFloat(value: number): number {
  const hashed = Math.sin(value) * 43758.5453123;
  return hashed - Math.floor(hashed);
}

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

export class RainEffect implements Effect {
  private lastBeatTime = -Infinity;

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const rawParams = params as Record<string, unknown>;
    const intensity = clamp(resolveNumberParam(rawParams.intensity, 0.5), 0, 1);
    if (intensity <= 0) {
      return;
    }
    const wind = clamp(resolveNumberParam(rawParams.wind, 0.1), -1, 1);
    const speed = resolveNumberParam(rawParams.speed, 1.0);
    const streakLength = resolveNumberParam(rawParams.streakLength, 1.0);
    const splashEnabled = resolveBooleanParam(rawParams.splash, false);
    const hue = resolveNumberParam(rawParams.hue, 205);
    const seed = resolveNumberParam(rawParams.seed, 0);

    if (audio.beat) {
      this.lastBeatTime = time;
    }

    const beatPulse = clamp(1 - (time - this.lastBeatTime) / BEAT_BOOST_DURATION, 0, 1);
    const densityBoost = 1 + beatPulse * 0.35;
    const windJitter = wind + Math.sin((time + seed) * 5) * beatPulse * 0.2;
    const brightness = clamp(0.35 + audio.rms * 0.6, 0, 1);

    const baseCount = Math.floor(width * height * BASE_DENSITY * intensity * densityBoost);
    const baseSpeed = height * 0.9 * speed;
    const baseStreak = 12 * streakLength;

    ctx.save();
    ctx.lineCap = "round";

    RAIN_LAYERS.forEach((layer, layerIndex) => {
      const layerCount = Math.max(0, Math.floor(baseCount * layer.countScale));
      if (layerCount === 0) {
        return;
      }
      const layerSpeed = baseSpeed * layer.speed;
      const layerWind = windJitter * layer.speed;
      const alpha = clamp(layer.alpha * (0.4 + brightness * 0.8), 0, 1);
      ctx.strokeStyle = `hsla(${hue}, 70%, 75%, ${alpha})`;
      ctx.lineWidth = layer.thickness;

      ctx.beginPath();
      for (let i = 0; i < layerCount; i += 1) {
        const dropSeed = seed * 1000 + i + layerIndex * 10000;
        const xBase = hashFloat(dropSeed * 12.9898) * width;
        const yBase = hashFloat(dropSeed * 78.233) * height;
        const lengthVariance = 0.5 + hashFloat(dropSeed * 0.917) * 0.7;
        const streak = baseStreak * layer.length * lengthVariance;
        const drift = streak * layerWind * 0.4;

        const x = (xBase + time * layerWind * width * 0.25 + width) % width;
        const y = (yBase + time * layerSpeed) % height;

        ctx.moveTo(x, y);
        ctx.lineTo(x + drift, y + streak);
      }
      ctx.stroke();

      if (splashEnabled) {
        const splashY = height - 4;
        ctx.strokeStyle = `hsla(${hue}, 60%, 80%, ${alpha * 0.6})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < layerCount; i += 1) {
          const dropSeed = seed * 1000 + i + layerIndex * 10000;
          const xBase = hashFloat(dropSeed * 12.9898) * width;
          const yBase = hashFloat(dropSeed * 78.233) * height;
          const y = (yBase + time * layerSpeed) % height;
          if (y < splashY) {
            continue;
          }
          const timeBucket = Math.floor((time * layerSpeed + yBase) / height);
          const splashChance = hashFloat(dropSeed + timeBucket * 13.13);
          if (splashChance < 0.6) {
            continue;
          }
          const splashSize = 1 + splashChance * 2;
          const x = (xBase + time * layerWind * width * 0.25 + width) % width;
          ctx.moveTo(x - splashSize, splashY);
          ctx.arc(x, splashY, splashSize, Math.PI, Math.PI * 2);
        }
        ctx.stroke();
      }
    });

    ctx.restore();
  }

  reset(): void {
    this.lastBeatTime = -Infinity;
  }
}
