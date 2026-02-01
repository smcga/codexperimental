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

export type ImpossibleCorridorParams = {
  quality: number;
  warp: number;
  hueShift: number;
  exposure: number;
  seed: number;
  speed: number;
  internalScale?: number;
};

const QUALITY_STEPS: Record<number, number> = {
  1: 56,
  2: 88,
  3: 120
};

const toFiniteNumber = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return fallback;
};

const resolveInternalScale = (quality: number, explicit?: number): number => {
  if (typeof explicit === "number" && Number.isFinite(explicit) && explicit > 0) {
    return explicit;
  }
  if (quality === 1) {
    return 0.6;
  }
  if (quality === 2) {
    return 0.8;
  }
  return 1.0;
};

export function normalizeImpossibleCorridorParams(params: Record<string, number>): ImpossibleCorridorParams {
  const qualityRaw = toFiniteNumber(params.quality, IMPOSSIBLE_CORRIDOR_DEFAULTS.quality);
  const quality = clamp(Math.round(qualityRaw), 1, 3);
  const warp = clamp(toFiniteNumber(params.warp, IMPOSSIBLE_CORRIDOR_DEFAULTS.warp), 0, 2);
  const hueShift = clamp(toFiniteNumber(params.hueShift, IMPOSSIBLE_CORRIDOR_DEFAULTS.hueShift), 0, 1);
  const exposure = clamp(toFiniteNumber(params.exposure, IMPOSSIBLE_CORRIDOR_DEFAULTS.exposure), 0.5, 2);
  const seed = toFiniteNumber(params.seed, IMPOSSIBLE_CORRIDOR_DEFAULTS.seed);
  const speed = clamp(toFiniteNumber(params.speed, IMPOSSIBLE_CORRIDOR_DEFAULTS.speed), 0.1, 2);
  const internalScale = resolveInternalScale(quality, toFiniteNumber(params.internalScale, NaN));

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
  beatStrength: number
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
    beatStrength: clamp(beatStrength, 0, 1),
    warp: params.warp,
    hueShift: params.hueShift,
    exposure: params.exposure,
    seed: params.seed,
    steps: qualitySteps,
    quality: params.quality,
    aspect: width > 0 && height > 0 ? width / height : 1
  };
}

export class ImpossibleCorridorEffect implements Effect {
  private webgl: WebGLEffectBase | null = null;
  private tunnelFallback = new TunnelEffect();
  private plasmaFallback = new PlasmaEffect();
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
    if (context.audio.beat) {
      this.beatDecay = 1;
    } else {
      this.beatDecay *= 0.9;
    }
    const beatStrength = clamp(context.audio.beatStrength * this.beatDecay, 0, 1);
    const uniforms = buildImpossibleCorridorUniforms(
      context.time,
      context.width,
      context.height,
      context.audio,
      params,
      beatStrength
    );

    const rendered =
      this.webgl &&
      this.webgl.isReady() &&
      (() => {
        this.webgl.resize(context.width, context.height, params.internalScale);
        this.webgl.setUniforms(uniforms);
        return this.webgl.renderFrame();
      })();

    if (rendered) {
      this.webgl?.drawToCanvas2D(context.ctx, 0, 0, context.width, context.height);
      this.warned = false;
      return;
    }

    if (!this.warned) {
      const reason = this.webgl?.lastError ?? "WebGL2 unavailable";
      console.warn(`[gl_impossible_corridor] ${reason}, falling back to canvas effect.`);
      this.warned = true;
    }

    const fallbackEffect = "render" in this.tunnelFallback ? this.tunnelFallback : this.plasmaFallback;
    fallbackEffect.render(context);
  }

  reset(): void {
    this.warned = false;
    this.beatDecay = 0;
  }
}
