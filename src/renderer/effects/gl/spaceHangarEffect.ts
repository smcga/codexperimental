import { clamp } from "../../../util/math";
import { Effect, EffectRenderContext } from "../types";
import { TunnelEffect } from "../tunnelEffect";
import { SPACE_HANGAR_FRAGMENT_SHADER } from "./shaders/spaceHangar";
import { WebGLEffectBase, WebGLUniformPayload } from "./webglEffectBase";

export const SPACE_HANGAR_DEFAULTS = {
  quality: 2,
  speed: 0.9,
  exposure: 1.05,
  seed: 19
};

export type SpaceHangarParams = {
  quality: number;
  speed: number;
  exposure: number;
  seed: number;
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
  const exposure = clamp(toFiniteNumber(params.exposure, SPACE_HANGAR_DEFAULTS.exposure), 0.6, 1.8);
  const seed = toFiniteNumber(params.seed, SPACE_HANGAR_DEFAULTS.seed);

  return {
    quality,
    speed,
    exposure,
    seed
  };
}

const smoothValue = (current: number, target: number, attack: number, release: number, delta: number): number => {
  if (delta <= 0) {
    return current;
  }
  const rate = target > current ? attack : release;
  const t = 1 - Math.exp(-rate * delta);
  return current + (target - current) * t;
};

export function buildSpaceHangarUniforms(
  time: number,
  width: number,
  height: number,
  audio: EffectRenderContext["audio"],
  params: SpaceHangarParams,
  smoothedBass: number,
  smoothedRms: number,
  camOffset: [number, number],
  speed: number
): WebGLUniformPayload {
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
    exposure: params.exposure,
    seed: params.seed,
    steps: 0,
    quality: params.quality,
    aspect: width / Math.max(1, height),
    speed,
    camOffset
  };
}

export class SpaceHangarEffect implements Effect {
  private webgl: WebGLEffectBase | null = null;
  private fallbackEffect = new TunnelEffect();
  private warned = false;
  private smoothedBass = 0;
  private smoothedRms = 0;
  private shake = 0;
  private lastTime = 0;

  constructor() {
    this.webgl = new WebGLEffectBase(SPACE_HANGAR_FRAGMENT_SHADER, "space_hangar");
  }

  render(context: EffectRenderContext): void {
    const params = normalizeSpaceHangarParams(context.params ?? {});
    const time = context.time;
    const delta = Math.max(0, time - this.lastTime);
    this.lastTime = time;

    const bassTarget = clamp(context.audio.bass, 0, 1);
    const rmsTarget = clamp(context.audio.rms, 0, 1);
    this.smoothedBass = smoothValue(this.smoothedBass, bassTarget, 8, 3, delta);
    this.smoothedRms = smoothValue(this.smoothedRms, rmsTarget, 6, 2, delta);

    if (context.audio.beat) {
      this.shake = Math.min(1, Math.max(this.shake, bassTarget));
    } else if (delta > 0) {
      this.shake *= Math.exp(-delta * 6);
    }

    const swayX = 0.15 * Math.sin(time * 0.35);
    const swayY = 0.08 * Math.sin(time * 0.27 + 1.0);
    const shakeAmount = this.shake * 0.02;
    const shakeX = Math.sin(time * 24 + params.seed) * shakeAmount;
    const shakeY = Math.cos(time * 21 + params.seed * 1.3) * shakeAmount;
    const camOffset: [number, number] = [swayX + shakeX, swayY + shakeY];

    const speed = params.speed * (0.85 + this.smoothedRms * 0.35);
    const uniforms = buildSpaceHangarUniforms(
      time,
      context.width,
      context.height,
      context.audio,
      params,
      this.smoothedBass,
      this.smoothedRms,
      camOffset,
      speed
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
      console.warn(`[space_hangar] ${reason}. Falling back to tunnel effect.`);
      this.warned = true;
    }
    this.fallbackEffect.render(context);
  }

  reset(): void {
    this.warned = false;
    this.smoothedBass = 0;
    this.smoothedRms = 0;
    this.shake = 0;
    this.lastTime = 0;
  }
}
