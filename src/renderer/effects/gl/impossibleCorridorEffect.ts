import { Effect, EffectRenderContext } from "../types";
import { clamp } from "../../../util/math";
import { WebglEffectBase, WebglEffectUniforms } from "./webglEffectBase";
import { FRAG, VERT } from "./shaders/impossibleCorridor";
import { TunnelEffect } from "../tunnelEffect";
import { PlasmaEffect } from "../plasmaEffect";

export type ImpossibleCorridorResolved = {
  uniforms: WebglEffectUniforms;
  internalScale: number;
  quality: number;
  speed: number;
};

const DEFAULT_PARAMS = {
  quality: 2,
  warp: 1.15,
  hueShift: 0.12,
  exposure: 1.15,
  seed: 7,
  speed: 0.6
};

const coerceNumber = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return fallback;
};

export const clampQuality = (value: number): number => clamp(Math.round(value), 1, 3);
export const clampExposure = (value: number): number => clamp(value, 0.5, 2.0);

const resolveInternalScale = (value: unknown, quality: number): number => {
  const fallback = quality === 1 ? 0.6 : quality === 2 ? 0.8 : 1.0;
  return clamp(coerceNumber(value, fallback), 0.4, 1.2);
};

export const resolveImpossibleCorridorUniforms = (
  width: number,
  height: number,
  time: number,
  audio: EffectRenderContext["audio"],
  params: EffectRenderContext["params"],
  beatDecay: number
): ImpossibleCorridorResolved => {
  const quality = clampQuality(coerceNumber(params.quality, DEFAULT_PARAMS.quality));
  const warp = coerceNumber(params.warp, DEFAULT_PARAMS.warp);
  const hueShift = coerceNumber(params.hueShift, DEFAULT_PARAMS.hueShift);
  const exposure = clampExposure(coerceNumber(params.exposure, DEFAULT_PARAMS.exposure));
  const seed = coerceNumber(params.seed, DEFAULT_PARAMS.seed);
  const speed = coerceNumber(params.speed, DEFAULT_PARAMS.speed);
  const internalScale = resolveInternalScale(params.internalScale, quality);
  const internalWidth = Math.max(1, Math.floor(width * internalScale));
  const internalHeight = Math.max(1, Math.floor(height * internalScale));
  const beatStrength = clamp(audio.beatStrength * beatDecay, 0, 1);
  const aspect = height > 0 ? width / height : 1;

  return {
    internalScale,
    quality,
    speed,
    uniforms: {
      time: time * speed,
      resolution: [internalWidth, internalHeight],
      audio: {
        rms: audio.rms,
        bass: audio.bass,
        mid: audio.mid,
        treble: audio.treble,
        beat: audio.beat ? 1 : 0,
        beatStrength
      },
      params: {
        warp,
        hueShift,
        exposure,
        seed,
        quality,
        aspect
      }
    }
  };
};

export type ImpossibleCorridorEffectOptions = {
  fallback?: Effect;
  baseFactory?: () => WebglEffectBase | null;
};

const createDefaultFallback = (): Effect => {
  try {
    return new TunnelEffect();
  } catch {
    return new PlasmaEffect();
  }
};

const createBase = (): WebglEffectBase | null => {
  if (typeof document === "undefined") {
    return null;
  }
  return new WebglEffectBase(VERT, FRAG);
};

export class ImpossibleCorridorEffect implements Effect {
  private base: WebglEffectBase | null = null;
  private fallback: Effect;
  private baseFactory: () => WebglEffectBase | null;
  private beatDecay = 0;

  constructor(options: ImpossibleCorridorEffectOptions = {}) {
    this.fallback = options.fallback ?? createDefaultFallback();
    this.baseFactory = options.baseFactory ?? createBase;
  }

  render({ ctx, width, height, time, delta, audio, params }: EffectRenderContext): void {
    if (audio.beat) {
      this.beatDecay = 1;
    } else {
      this.beatDecay *= 0.9;
    }

    const resolved = resolveImpossibleCorridorUniforms(width, height, time, audio, params, this.beatDecay);

    if (!this.base) {
      this.base = this.baseFactory();
    }

    if (!this.base || !this.base.isReady) {
      this.fallback.render({ ctx, width, height, time, delta, audio, params });
      return;
    }

    this.base.resize(width, height, resolved.internalScale);
    this.base.setUniforms(resolved.uniforms);
    this.base.renderFrame();
    this.base.drawToCanvas2D(ctx, 0, 0, width, height);
  }

  reset(): void {
    this.beatDecay = 0;
  }
}
