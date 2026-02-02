import { clamp } from "../../../util/math";
import { Effect, EffectRenderContext } from "../types";
import { NeonShapesEffect } from "../neonShapesEffect";
import { NEON_ALLEY_FRAGMENT_SHADER } from "./shaders/neonAlley";
import { WebGLEffectBase, WebGLUniformPayload } from "./webglEffectBase";

export const NEON_ALLEY_DEFAULTS = {
  quality: 2,
  speed: 0.6,
  exposure: 1.05,
  seed: 13
};

export type NeonAlleyParams = {
  quality: number;
  speed: number;
  exposure: number;
  seed: number;
};

const QUALITY_STEPS: Record<number, number> = {
  1: 32,
  2: 48,
  3: 64
};

const toFiniteNumber = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return fallback;
};

export function normalizeNeonAlleyParams(params: Record<string, number>): NeonAlleyParams {
  const qualityRaw = toFiniteNumber(params.quality, NEON_ALLEY_DEFAULTS.quality);
  const quality = clamp(Math.round(qualityRaw), 1, 3);
  const speed = clamp(toFiniteNumber(params.speed, NEON_ALLEY_DEFAULTS.speed), 0.2, 1.6);
  const exposure = clamp(toFiniteNumber(params.exposure, NEON_ALLEY_DEFAULTS.exposure), 0.6, 1.6);
  const seed = toFiniteNumber(params.seed, NEON_ALLEY_DEFAULTS.seed);

  return {
    quality,
    speed,
    exposure,
    seed
  };
}

export function buildNeonAlleyUniforms(
  time: number,
  width: number,
  height: number,
  audio: EffectRenderContext["audio"],
  params: NeonAlleyParams
): WebGLUniformPayload {
  const qualitySteps = QUALITY_STEPS[params.quality] ?? QUALITY_STEPS[2];
  return {
    time: time * params.speed,
    resolution: [width, height],
    rms: clamp(audio.rms, 0, 1),
    bass: clamp(audio.bass, 0, 1),
    mid: clamp(audio.mid, 0, 1),
    treble: clamp(audio.treble, 0, 1),
    beat: audio.beat ? 1 : 0,
    beatStrength: clamp(audio.beatStrength, 0, 1),
    warp: 1,
    hueShift: 0,
    exposure: params.exposure,
    seed: params.seed,
    steps: qualitySteps,
    quality: params.quality,
    aspect: width / Math.max(1, height)
  };
}

export class NeonAlleyEffect implements Effect {
  private webgl: WebGLEffectBase | null = null;
  private fallbackEffect = new NeonShapesEffect();
  private warned = false;

  constructor() {
    this.webgl = new WebGLEffectBase(NEON_ALLEY_FRAGMENT_SHADER, "gl_neon_alley");
  }

  render(context: EffectRenderContext): void {
    const params = normalizeNeonAlleyParams(context.params ?? {});
    const uniforms = buildNeonAlleyUniforms(context.time, context.width, context.height, context.audio, params);

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
      console.warn(`[gl_neon_alley] ${reason}. Falling back to 2D effect.`);
      this.warned = true;
    }
    this.fallbackEffect.render(context);
  }

  reset(): void {
    this.warned = false;
  }
}
