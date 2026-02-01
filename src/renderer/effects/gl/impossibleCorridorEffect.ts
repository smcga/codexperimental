import { clamp } from "../../../util/math";
import { Effect, EffectRenderContext } from "../types";
import { PlasmaEffect } from "../plasmaEffect";
import { TunnelEffect } from "../tunnelEffect";
import {
  IMPOSSIBLE_CORRIDOR_FRAGMENT_SHADER,
  IMPOSSIBLE_CORRIDOR_VERTEX_SHADER
} from "./shaders/impossibleCorridor";
import { WebGLEffectBase, WebGLUniformPayload } from "./webglEffectBase";

export const IMPOSSIBLE_CORRIDOR_DEFAULTS = {
  quality: 2,
  warp: 1.15,
  hueShift: 0.12,
  exposure: 1.15,
  seed: 7,
  speed: 0.6
};

const QUALITY_STEPS: Record<number, number> = {
  1: 56,
  2: 88,
  3: 120
};

const QUALITY_SCALES: Record<number, number> = {
  1: 0.6,
  2: 0.8,
  3: 1.0
};

export type ImpossibleCorridorParams = {
  quality: number;
  warp: number;
  hueShift: number;
  exposure: number;
  seed: number;
  speed: number;
  internalScale: number;
};

const toFiniteNumber = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return fallback;
};

export function normalizeImpossibleCorridorParams(params: Record<string, number>): ImpossibleCorridorParams {
  const qualityRaw = toFiniteNumber(params.quality, IMPOSSIBLE_CORRIDOR_DEFAULTS.quality);
  const quality = clamp(Math.round(qualityRaw), 1, 3);
  const warp = clamp(toFiniteNumber(params.warp, IMPOSSIBLE_CORRIDOR_DEFAULTS.warp), 0, 2);
  const hueShift = clamp(toFiniteNumber(params.hueShift, IMPOSSIBLE_CORRIDOR_DEFAULTS.hueShift), 0, 1);
  const exposure = clamp(toFiniteNumber(params.exposure, IMPOSSIBLE_CORRIDOR_DEFAULTS.exposure), 0.5, 2);
  const seed = toFiniteNumber(params.seed, IMPOSSIBLE_CORRIDOR_DEFAULTS.seed);
  const speed = clamp(toFiniteNumber(params.speed, IMPOSSIBLE_CORRIDOR_DEFAULTS.speed), 0.1, 2);
  const internalScaleDefault = QUALITY_SCALES[quality] ?? QUALITY_SCALES[2];
  const internalScale = clamp(toFiniteNumber(params.internalScale, internalScaleDefault), 0.4, 1.2);

  return {
    quality,
    warp,
    hueShift,
    exposure,
    seed,
    speed,
    internalScale
  };
}

export function buildImpossibleCorridorUniforms(
  time: number,
  width: number,
  height: number,
  audio: EffectRenderContext["audio"],
  params: ImpossibleCorridorParams,
  beatDecay: number
): WebGLUniformPayload {
  const qualitySteps = QUALITY_STEPS[params.quality] ?? QUALITY_STEPS[2];
  return {
    time,
    resolution: [width, height],
    rms: clamp(audio.rms, 0, 1),
    bass: clamp(audio.bass, 0, 1),
    mid: clamp(audio.mid, 0, 1),
    treble: clamp(audio.treble, 0, 1),
    beat: audio.beat ? 1 : 0,
    beatStrength: clamp(audio.beatStrength * beatDecay, 0, 1),
    warp: params.warp,
    hueShift: params.hueShift,
    exposure: params.exposure,
    seed: params.seed,
    steps: qualitySteps,
    quality: params.quality,
    aspect: width / Math.max(1, height)
  };
}

const createFallbackEffect = (): Effect => {
  try {
    return new TunnelEffect();
  } catch {
    return new PlasmaEffect();
  }
};

export class ImpossibleCorridorEffect implements Effect {
  private webgl: WebGLEffectBase | null = null;
  private fallbackEffect: Effect = createFallbackEffect();
  private warned = false;
  private beatDecay = 0;

  constructor() {
    this.webgl = new WebGLEffectBase(
      IMPOSSIBLE_CORRIDOR_FRAGMENT_SHADER,
      "gl_impossible_corridor",
      IMPOSSIBLE_CORRIDOR_VERTEX_SHADER
    );
  }

  render(context: EffectRenderContext): void {
    const params = normalizeImpossibleCorridorParams(context.params ?? {});
    const time = context.time * params.speed;

    if (context.audio.beat) {
      this.beatDecay = 1;
    } else {
      this.beatDecay *= 0.9;
    }

    const uniforms = buildImpossibleCorridorUniforms(
      time,
      context.width,
      context.height,
      context.audio,
      params,
      this.beatDecay
    );

    this.webgl?.resize(context.width, context.height, params.internalScale);
    const rendered = this.webgl?.renderFrame(uniforms);
    if (rendered) {
      this.webgl?.drawToCanvas2D(context.ctx, 0, 0, context.width, context.height);
      this.warned = false;
      return;
    }

    if (!this.warned) {
      const reason = this.webgl?.lastError ?? "WebGL2 unavailable or shader failed";
      console.warn(`[gl_impossible_corridor] ${reason}. Falling back to 2D effect.`);
      this.warned = true;
    }
    this.fallbackEffect.render(context);
  }

  reset(): void {
    this.warned = false;
    this.beatDecay = 0;
  }
}
