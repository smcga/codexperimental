/* Water reflection overlay that mirrors the upper viewport into the bottom third with shimmering ripple bands. */
import { clamp, lerp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type WaterReflectionParams = {
  rippleAmp: number;
  rippleFreq: number;
  rippleSpeed: number;
  shimmer: number;
  chop: number;
  tint: number;
  opacity: number;
  audioReact: number;
  seed: number;
};

type RippleEmitter = {
  x: number;
  y: number;
  radius: number;
  amplitude: number;
  speed: number;
  phase: number;
};

type ReflectionBand = {
  sourceY: number;
  offsetX: number;
  inset: number;
  alpha: number;
};

export const WATER_REFLECTION_DEFAULTS = {
  rippleAmp: 14,
  rippleFreq: 2.4,
  rippleSpeed: 1.35,
  shimmer: 0.58,
  chop: 0.42,
  tint: 198,
  opacity: 0.82,
  audioReact: 0.35,
  seed: 7
} as const;

const toNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const hashFloat = (value: number): number => {
  const hashed = Math.sin(value * 127.1 + 311.7) * 43758.5453123;
  return hashed - Math.floor(hashed);
};

export const resolveWaterReflectionParams = (params: Record<string, unknown>): WaterReflectionParams => ({
  rippleAmp: clamp(toNumber(params.rippleAmp, WATER_REFLECTION_DEFAULTS.rippleAmp), 0, 48),
  rippleFreq: clamp(toNumber(params.rippleFreq, WATER_REFLECTION_DEFAULTS.rippleFreq), 0.2, 8),
  rippleSpeed: clamp(toNumber(params.rippleSpeed, WATER_REFLECTION_DEFAULTS.rippleSpeed), 0, 6),
  shimmer: clamp(toNumber(params.shimmer, WATER_REFLECTION_DEFAULTS.shimmer), 0, 1),
  chop: clamp(toNumber(params.chop, WATER_REFLECTION_DEFAULTS.chop), 0, 1),
  tint: clamp(toNumber(params.tint, WATER_REFLECTION_DEFAULTS.tint), 170, 230),
  opacity: clamp(toNumber(params.opacity, WATER_REFLECTION_DEFAULTS.opacity), 0.15, 1),
  audioReact: clamp(toNumber(params.audioReact, WATER_REFLECTION_DEFAULTS.audioReact), 0, 1),
  seed: toNumber(params.seed, WATER_REFLECTION_DEFAULTS.seed)
});

export const buildRippleField = (
  seed: number,
  count: number,
  width: number,
  reflectionTop: number,
  reflectionHeight: number
): RippleEmitter[] =>
  Array.from({ length: count }, (_, index) => {
    const value = seed * 31 + index * 17;
    return {
      x: hashFloat(value + 0.13) * width,
      y: reflectionTop + hashFloat(value + 1.91) * reflectionHeight,
      radius: lerp(reflectionHeight * 0.06, reflectionHeight * 0.32, hashFloat(value + 2.73)),
      amplitude: lerp(0.35, 1, hashFloat(value + 4.11)),
      speed: lerp(0.6, 1.4, hashFloat(value + 5.37)),
      phase: hashFloat(value + 6.49) * Math.PI * 2
    };
  });

const sampleRippleOffset = (x: number, y: number, time: number, emitters: RippleEmitter[]): number => {
  let ripple = 0;
  for (const emitter of emitters) {
    const dx = x - emitter.x;
    const dy = y - emitter.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > emitter.radius * 1.5) {
      continue;
    }
    const falloff = clamp(1 - dist / (emitter.radius * 1.5), 0, 1);
    ripple += Math.sin(dist * 0.14 - time * emitter.speed * 4 + emitter.phase) * falloff * emitter.amplitude;
  }
  return ripple;
};

export const sampleReflectionBand = (options: {
  y: number;
  width: number;
  reflectionTop: number;
  reflectionHeight: number;
  time: number;
  audioRms: number;
  params: WaterReflectionParams;
  emitters: RippleEmitter[];
}): ReflectionBand => {
  const { y, width, reflectionTop, reflectionHeight, time, audioRms, params, emitters } = options;
  const depth = clamp((y - reflectionTop) / reflectionHeight, 0, 1);
  const mirrorT = 1 - Math.pow(depth, 0.86);
  const sourceY = clamp(mirrorT * reflectionTop, 0, Math.max(0, reflectionTop - 1));
  const phase = time * params.rippleSpeed + depth * params.rippleFreq * Math.PI * 2;
  const wave = Math.sin(phase) * 0.55 + Math.sin(phase * 1.9 + 1.4) * 0.3;
  const shimmerWave = Math.cos(time * 2.2 + depth * 19) * params.shimmer;
  const ripple = sampleRippleOffset(width * 0.5, y, time, emitters);
  const motion = params.rippleAmp * (1 + audioRms * params.audioReact * 1.8);
  const offsetX = (wave + ripple * params.chop + shimmerWave * 0.25) * motion;
  const inset = Math.abs(offsetX) * 0.35 + depth * width * 0.02 + params.chop * 6;
  const alpha = clamp(lerp(params.opacity, params.opacity * 0.24, depth) + shimmerWave * 0.04, 0.08, 1);

  return {
    sourceY,
    offsetX,
    inset,
    alpha
  };
};

const createScratchCanvas = (width: number, height: number): HTMLCanvasElement | OffscreenCanvas | null => {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  return null;
};

export class WaterReflectionEffect implements Effect {
  private sourceCanvas: HTMLCanvasElement | OffscreenCanvas | null = null;

  private sourceCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;

  private rippleField: RippleEmitter[] = [];

  private rippleFieldKey = "";

  private ensureSource(width: number, height: number): void {
    if (this.sourceCanvas && this.sourceCanvas.width === width && this.sourceCanvas.height === height && this.sourceCtx) {
      return;
    }
    const canvas = createScratchCanvas(width, height);
    const scratchCtx = canvas?.getContext("2d") ?? null;
    this.sourceCanvas = canvas;
    this.sourceCtx = scratchCtx;
  }

  private captureSource(ctx: CanvasRenderingContext2D, width: number, height: number): CanvasImageSource {
    this.ensureSource(width, height);
    if (!this.sourceCanvas || !this.sourceCtx) {
      return ctx.canvas;
    }
    this.sourceCtx.clearRect(0, 0, width, height);
    this.sourceCtx.drawImage(ctx.canvas, 0, 0, width, height);
    return this.sourceCanvas;
  }

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const config = resolveWaterReflectionParams(params as Record<string, unknown>);
    const reflectionHeight = Math.max(1, Math.round(height / 3));
    const reflectionTop = height - reflectionHeight;
    const source = this.captureSource(ctx, width, height);
    const rippleCount = Math.max(4, Math.round(5 + config.chop * 5));
    const rippleFieldKey = `${width}x${height}:${reflectionTop}:${rippleCount}:${config.seed}`;

    if (rippleFieldKey !== this.rippleFieldKey) {
      this.rippleField = buildRippleField(config.seed, rippleCount, width, reflectionTop, reflectionHeight);
      this.rippleFieldKey = rippleFieldKey;
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, reflectionTop, width, reflectionHeight);
    ctx.clip();

    const fillGradient = ctx.createLinearGradient(0, reflectionTop, 0, height);
    fillGradient.addColorStop(0, `hsla(${config.tint}, 66%, 62%, 0.08)`);
    fillGradient.addColorStop(0.4, `hsla(${config.tint}, 75%, 38%, 0.18)`);
    fillGradient.addColorStop(1, `hsla(${config.tint}, 85%, 12%, 0.45)`);
    ctx.fillStyle = fillGradient;
    ctx.fillRect(0, reflectionTop, width, reflectionHeight);

    const sliceHeight = 2;
    for (let y = reflectionTop; y < height; y += sliceHeight) {
      const band = sampleReflectionBand({
        y: y + sliceHeight * 0.5,
        width,
        reflectionTop,
        reflectionHeight,
        time,
        audioRms: audio.rms,
        params: config,
        emitters: this.rippleField
      });
      const drawWidth = Math.max(1, width - band.inset * 2);
      const sourceY = clamp(band.sourceY, 0, Math.max(0, reflectionTop - 1));
      const sourceSliceHeight = Math.max(1, Math.round(1 + (1 - (y - reflectionTop) / reflectionHeight) * 2));

      ctx.globalAlpha = band.alpha;
      ctx.drawImage(
        source,
        0,
        sourceY,
        width,
        sourceSliceHeight,
        -band.inset + band.offsetX,
        y,
        drawWidth + band.inset * 2,
        sliceHeight + 1
      );
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(10, 18, 28, ${clamp(0.16 + config.chop * 0.18, 0.12, 0.4)})`;
    ctx.fillRect(0, reflectionTop, width, reflectionHeight);

    ctx.globalCompositeOperation = "screen";
    const shimmerCount = 16;
    for (let index = 0; index < shimmerCount; index += 1) {
      const t = index / Math.max(1, shimmerCount - 1);
      const y = reflectionTop + t * reflectionHeight;
      const wave = Math.sin(time * (2 + config.shimmer * 2.5) + index * 0.9 + config.seed) * (10 + config.rippleAmp * 0.35);
      const lineWidth = width * lerp(0.2, 0.85, 1 - t);
      const alpha = clamp((1 - t) * (0.04 + config.shimmer * 0.18) + audio.treble * config.audioReact * 0.08, 0.02, 0.28);
      ctx.fillStyle = `rgba(170, 230, 255, ${alpha.toFixed(3)})`;
      ctx.fillRect(width * 0.5 - lineWidth * 0.5 + wave, y, lineWidth, 1.2 + (1 - t) * 1.4);
    }

    for (const emitter of this.rippleField) {
      const radiusPulse = emitter.radius * (0.3 + 0.15 * Math.sin(time * emitter.speed * 3 + emitter.phase));
      const alpha = clamp(0.06 + config.shimmer * 0.1 + audio.rms * config.audioReact * 0.06, 0.04, 0.18);
      ctx.beginPath();
      ctx.strokeStyle = `rgba(210, 245, 255, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 0.8;
      ctx.ellipse(emitter.x, emitter.y, emitter.radius + radiusPulse, radiusPulse * 0.32, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    const fadeGradient = ctx.createLinearGradient(0, reflectionTop, 0, height);
    fadeGradient.addColorStop(0, "rgba(255, 255, 255, 0.03)");
    fadeGradient.addColorStop(0.35, "rgba(24, 36, 52, 0.08)");
    fadeGradient.addColorStop(1, "rgba(0, 0, 0, 0.3)");
    ctx.fillStyle = fadeGradient;
    ctx.fillRect(0, reflectionTop, width, reflectionHeight);

    ctx.restore();
  }

  reset(): void {
    this.rippleField = [];
    this.rippleFieldKey = "";
  }
}
