import { clamp } from "../../../util/math";
import { Effect, EffectRenderContext } from "../types";
import { TunnelEffect } from "../tunnelEffect";
import { SPACE_HANGAR_FRAGMENT_SHADER } from "./shaders/spaceHangar";
import { WebGLEffectBase, WebGLUniformPayload } from "./webglEffectBase";

export const SPACE_HANGAR_DEFAULTS = {
  quality: 2,
  speed: 0.9,
  exposure: 1.1,
  hueShift: 0.08,
  seed: 17
};

const QUALITY_STEPS: Record<number, number> = {
  1: 1,
  2: 1,
  3: 1
};

export type SpaceHangarParams = {
  quality: number;
  speed: number;
  exposure: number;
  hueShift: number;
  seed: number;
};

type SpaceHangarState = {
  bass: number;
  rms: number;
  beatStrength: number;
  camOffset: [number, number];
  speed: number;
};

const toFiniteNumber = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return fallback;
};

export function normalizeSpaceHangarParams(params: Record<string, number>): SpaceHangarParams {
  const qualityRaw = toFiniteNumber(params.quality, SPACE_HANGAR_DEFAULTS.quality);
  const quality = clamp(Math.round(qualityRaw), 1, 3);
  const speed = clamp(toFiniteNumber(params.speed, SPACE_HANGAR_DEFAULTS.speed), 0.2, 2);
  const exposure = clamp(toFiniteNumber(params.exposure, SPACE_HANGAR_DEFAULTS.exposure), 0.6, 2);
  const hueShift = clamp(toFiniteNumber(params.hueShift, SPACE_HANGAR_DEFAULTS.hueShift), 0, 1);
  const seed = toFiniteNumber(params.seed, SPACE_HANGAR_DEFAULTS.seed);

  return {
    quality,
    speed,
    exposure,
    hueShift,
    seed
  };
}

export function buildSpaceHangarUniforms(
  time: number,
  width: number,
  height: number,
  audio: EffectRenderContext["audio"],
  params: SpaceHangarParams,
  state: SpaceHangarState
): WebGLUniformPayload {
  const qualitySteps = QUALITY_STEPS[params.quality] ?? QUALITY_STEPS[2];
  return {
    time,
    resolution: [width, height],
    rms: clamp(state.rms, 0, 1),
    bass: clamp(state.bass, 0, 1),
    mid: clamp(audio.mid, 0, 1),
    treble: clamp(audio.treble, 0, 1),
    beat: audio.beat ? 1 : 0,
    beatStrength: clamp(state.beatStrength, 0, 1),
    warp: 1,
    hueShift: params.hueShift,
    exposure: params.exposure,
    seed: params.seed,
    steps: qualitySteps,
    quality: params.quality,
    aspect: width / Math.max(1, height),
    speed: state.speed,
    camOffset: state.camOffset
  };
}

const smoothValue = (current: number, target: number, attack: number, release: number): number => {
  if (target > current) {
    return current + (target - current) * attack;
  }
  return current + (target - current) * release;
};

export class SpaceHangarEffect implements Effect {
  private webgl: WebGLEffectBase | null = null;
  private fallbackEffect = new TunnelEffect();
  private warned = false;
  private bassSmooth = 0;
  private rmsSmooth = 0;
  private beatKick = 0;

  constructor() {
    this.webgl = new WebGLEffectBase(SPACE_HANGAR_FRAGMENT_SHADER, "space_hangar");
  }

  render(context: EffectRenderContext): void {
    const params = normalizeSpaceHangarParams(context.params ?? {});
    const bassTarget = clamp(context.audio.bass, 0, 1);
    const rmsTarget = clamp(context.audio.rms, 0, 1);

    this.bassSmooth = smoothValue(this.bassSmooth, bassTarget, 0.25, 0.08);
    this.rmsSmooth = smoothValue(this.rmsSmooth, rmsTarget, 0.2, 0.06);

    if (context.audio.beat) {
      this.beatKick = 1;
    } else {
      this.beatKick *= 0.82;
    }

    const speed = params.speed * (0.85 + this.rmsSmooth * 0.3);
    const shakeAmplitude = this.beatKick * (0.018 + this.bassSmooth * 0.012);
    const shakeX = Math.sin(context.time * 12 + params.seed) * shakeAmplitude;
    const shakeY = Math.cos(context.time * 10 + params.seed * 1.7) * shakeAmplitude;

    const uniforms = buildSpaceHangarUniforms(context.time, context.width, context.height, context.audio, params, {
      bass: this.bassSmooth,
      rms: this.rmsSmooth,
      beatStrength: this.beatKick,
      camOffset: [shakeX, shakeY],
      speed
    });

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
      console.warn(`[space_hangar] ${reason}. Falling back to tunnel effect.`);
      this.warned = true;
    }
    this.fallbackEffect.render(context);
  }

  reset(): void {
    this.warned = false;
    this.bassSmooth = 0;
    this.rmsSmooth = 0;
    this.beatKick = 0;
  }
}
