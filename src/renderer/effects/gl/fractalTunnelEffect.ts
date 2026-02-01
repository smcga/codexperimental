import { clamp } from "../../../util/math";
import { Effect, EffectRenderContext } from "../types";
import { TunnelEffect } from "../tunnelEffect";
import { FRACTAL_TUNNEL_FRAGMENT_SHADER } from "./shaders/fractalTunnel";
import { WebGLEffectBase, WebGLUniformPayload } from "./webglEffectBase";

export const FRACTAL_TUNNEL_DEFAULTS = {
  quality: 2,
  warp: 1.1,
  hueShift: 0.15,
  exposure: 1.2,
  seed: 7
};

export const FALLBACK_EFFECT_NAME = "tunnel";

export type FractalTunnelParams = {
  quality: number;
  warp: number;
  hueShift: number;
  exposure: number;
  seed: number;
};

const QUALITY_STEPS: Record<number, number> = {
  1: 48,
  2: 80,
  3: 112
};

const toFiniteNumber = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return fallback;
};

export function normalizeFractalTunnelParams(params: Record<string, number>): FractalTunnelParams {
  const qualityRaw = toFiniteNumber(params.quality, FRACTAL_TUNNEL_DEFAULTS.quality);
  const quality = clamp(Math.round(qualityRaw), 1, 3);
  const warp = clamp(toFiniteNumber(params.warp, FRACTAL_TUNNEL_DEFAULTS.warp), 0, 2);
  const hueShift = clamp(toFiniteNumber(params.hueShift, FRACTAL_TUNNEL_DEFAULTS.hueShift), 0, 1);
  const exposure = clamp(toFiniteNumber(params.exposure, FRACTAL_TUNNEL_DEFAULTS.exposure), 0.5, 2);
  const seed = toFiniteNumber(params.seed, FRACTAL_TUNNEL_DEFAULTS.seed);

  return {
    quality,
    warp,
    hueShift,
    exposure,
    seed
  };
}

export function buildFractalTunnelUniforms(
  time: number,
  width: number,
  height: number,
  audio: EffectRenderContext["audio"],
  params: FractalTunnelParams
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
    beatStrength: clamp(audio.beatStrength, 0, 1),
    warp: params.warp,
    hueShift: params.hueShift,
    exposure: params.exposure,
    seed: params.seed,
    steps: qualitySteps
  };
}

export class FractalTunnelEffect implements Effect {
  private webgl: WebGLEffectBase | null = null;
  private fallbackEffect = new TunnelEffect();
  private warned = false;

  constructor() {
    this.webgl = new WebGLEffectBase(FRACTAL_TUNNEL_FRAGMENT_SHADER, "gl_fractal_tunnel");
  }

  render(context: EffectRenderContext): void {
    const params = normalizeFractalTunnelParams(context.params ?? {});
    const uniforms = buildFractalTunnelUniforms(context.time, context.width, context.height, context.audio, params);

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
      console.warn("[gl_fractal_tunnel] WebGL2 unavailable or failed, falling back to tunnel effect.");
      this.warned = true;
    }
    this.fallbackEffect.render(context);
  }

  reset(): void {
    this.warned = false;
  }
}
