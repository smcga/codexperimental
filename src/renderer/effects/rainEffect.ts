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
  { speed: 1.9, length: 1.25, alpha: 0.68, thickness: 1.1, countScale: 1.2 },
  { speed: 1.25, length: 0.85, alpha: 0.42, thickness: 0.8, countScale: 0.95 },
  { speed: 0.8, length: 0.55, alpha: 0.24, thickness: 0.6, countScale: 0.75 }
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
    const storm = clamp(resolveNumberParam(rawParams.storm, 0.5), 0, 1);
    const turbulence = clamp(resolveNumberParam(rawParams.turbulence, 0.35), 0, 1);
    const mist = clamp(resolveNumberParam(rawParams.mist, 0.35), 0, 1);

    if (audio.beat) {
      this.lastBeatTime = time;
    }

    const beatPulse = clamp(1 - (time - this.lastBeatTime) / BEAT_BOOST_DURATION, 0, 1);
    const stormDrive = clamp(storm + beatPulse * 0.45 + audio.rms * 0.35, 0, 1.6);
    const densityBoost = 1 + beatPulse * 0.35 + stormDrive * 0.45;
    const windJitter = wind + Math.sin((time + seed) * 5) * beatPulse * 0.2;
    const brightness = clamp(0.3 + audio.rms * 0.55 + stormDrive * 0.35, 0, 1);

    const baseCount = Math.floor(width * height * BASE_DENSITY * intensity * densityBoost);
    const baseSpeed = height * 0.82 * speed * (0.85 + stormDrive * 0.8);
    const baseStreak = 11 * streakLength * (0.9 + stormDrive * 0.65);

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
        const y = (yBase + time * layerSpeed) % height;
        const flow = time * (2.2 + layer.speed * 0.7) + y * 0.035;
        const sway = Math.sin(flow + dropSeed * 0.015) * turbulence * 8.5 * layer.speed;
        const gust = Math.sin(time * 1.7 + dropSeed * 0.001) * beatPulse * 7.5;
        const x = (xBase + time * layerWind * width * 0.25 + sway + gust + width) % width;
        const drift = streak * (layerWind * 0.36 + turbulence * 0.17 * Math.cos(flow * 1.25));

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
          if (splashChance < 0.56 - stormDrive * 0.1) {
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

    if (mist > 0) {
      const mistBaseAlpha = clamp((0.06 + stormDrive * 0.14) * mist * (0.65 + audio.rms * 0.7), 0, 0.35);
      const bands = 3;
      for (let band = 0; band < bands; band += 1) {
        const bandProgress = band / (bands - 1);
        const bandHeight = height * (0.08 + bandProgress * 0.18);
        const y = height - bandHeight;
        const alpha = mistBaseAlpha * (1 - bandProgress * 0.5);
        ctx.fillStyle = `hsla(${hue}, 38%, 80%, ${alpha})`;
        ctx.fillRect(0, y, width, bandHeight);
      }
    }

    ctx.restore();
  }

  reset(): void {
    this.lastBeatTime = -Infinity;
  }
}
