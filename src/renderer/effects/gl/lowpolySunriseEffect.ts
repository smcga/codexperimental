import { clamp } from "../../../util/math";
import { Effect, EffectRenderContext } from "../types";
import { SynthwaveSunsetEffect } from "../synthwaveSunset";
import { LOWPOLY_SUNRISE_FRAGMENT_SHADER } from "./shaders/lowpolySunrise";
import { WebGLEffectBase, WebGLUniformPayload } from "./webglEffectBase";

export const LOWPOLY_SUNRISE_DEFAULTS = {
  quality: 2,
  speed: 0.6,
  seed: 11
};

const QUALITY_STEPS: Record<number, number> = {
  1: 56,
  2: 80,
  3: 104
};

export type LowpolySunriseParams = {
  quality: number;
  speed: number;
  seed: number;
};

const toFiniteNumber = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return fallback;
};

export function normalizeLowpolySunriseParams(params: Record<string, number>): LowpolySunriseParams {
  const qualityRaw = toFiniteNumber(params.quality, LOWPOLY_SUNRISE_DEFAULTS.quality);
  const quality = clamp(Math.round(qualityRaw), 1, 3);
  const speed = clamp(toFiniteNumber(params.speed, LOWPOLY_SUNRISE_DEFAULTS.speed), 0.2, 1.2);
  const seed = toFiniteNumber(params.seed, LOWPOLY_SUNRISE_DEFAULTS.seed);

  return {
    quality,
    speed,
    seed
  };
}

const smoothValue = (current: number, target: number, attack: number, release: number, delta: number): number => {
  const rate = target > current ? attack : release;
  const blend = 1 - Math.exp(-rate * delta);
  return current + (target - current) * blend;
};

const normalizeVec3 = (value: [number, number, number]): [number, number, number] => {
  const length = Math.hypot(value[0], value[1], value[2]) || 1;
  return [value[0] / length, value[1] / length, value[2] / length];
};

export function buildLowpolySunriseUniforms(
  time: number,
  width: number,
  height: number,
  audio: EffectRenderContext["audio"],
  params: LowpolySunriseParams,
  smoothedBass: number,
  smoothedRms: number
): WebGLUniformPayload {
  const qualitySteps = QUALITY_STEPS[params.quality] ?? QUALITY_STEPS[2];
  const sunRise = 0.22 + 0.06 * Math.tanh(time * 0.05);
  const sunPos: [number, number] = [0.5, sunRise];
  const sunDir = normalizeVec3([0.15, 0.55 + sunRise, 0.75]);
  const fogAmount = 0.12 * (1 + smoothedRms * 0.5);
  const cloudSpeed = 0.4 * (1 + smoothedRms * 0.3);
  const cloudOffset: [number, number, number] = [time * cloudSpeed, time * cloudSpeed * 1.3, time * cloudSpeed * 1.7];

  return {
    time,
    resolution: [width, height],
    rms: smoothedRms,
    bass: smoothedBass,
    mid: clamp(audio.mid, 0, 1),
    treble: clamp(audio.treble, 0, 1),
    beat: audio.beat ? 1 : 0,
    beatStrength: clamp(audio.beatStrength, 0, 1),
    warp: params.speed,
    hueShift: 0,
    exposure: 1,
    seed: params.seed,
    steps: qualitySteps,
    quality: params.quality,
    aspect: width / Math.max(1, height),
    sunPos,
    sunDir,
    fogAmount,
    cloudOffset
  };
}

export class LowpolySunriseEffect implements Effect {
  private webgl: WebGLEffectBase | null = null;
  private fallbackEffect = new SynthwaveSunsetEffect();
  private warned = false;
  private smoothedBass = 0;
  private smoothedRms = 0;

  constructor() {
    this.webgl = new WebGLEffectBase(LOWPOLY_SUNRISE_FRAGMENT_SHADER, "lowpoly_sunrise");
  }

  render(context: EffectRenderContext): void {
    const params = normalizeLowpolySunriseParams(context.params ?? {});
    const time = context.time * params.speed;
    const bassTarget = clamp(context.audio.bass, 0, 1);
    const rmsTarget = clamp(context.audio.rms, 0, 1);
    this.smoothedBass = smoothValue(this.smoothedBass, bassTarget, 6, 2.5, context.delta);
    this.smoothedRms = smoothValue(this.smoothedRms, rmsTarget, 4.5, 2, context.delta);

    const uniforms = buildLowpolySunriseUniforms(
      time,
      context.width,
      context.height,
      context.audio,
      params,
      this.smoothedBass,
      this.smoothedRms
    );

    const rendered = this.webgl?.renderToCanvas2D(
      context.ctx,
      context.width,
      context.height,
      uniforms,
      params.quality
    );

    if (rendered) {
      this.warned = false;
      return;
    }

    if (!this.warned) {
      const reason = this.webgl?.lastError ?? "WebGL2 unavailable or shader failed";
      console.warn(`[lowpoly_sunrise] ${reason}. Falling back to synthwave sunset.`);
      this.warned = true;
    }
    this.fallbackEffect.render(context);
  }

  reset(): void {
    this.warned = false;
    this.smoothedBass = 0;
    this.smoothedRms = 0;
  }
}
