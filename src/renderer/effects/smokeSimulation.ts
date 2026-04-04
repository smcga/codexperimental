import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type EmitMode = "centre" | "bottom" | "random";
type ColorMode = "mono" | "tinted";

export const SMOKE_DEFAULTS = {
  density: 0.8,
  flowSpeed: 0.6,
  turbulence: 0.7,
  swirl: 0.8,
  diffusion: 0.92,
  softness: 0.8,
  emission: 0.5,
  emitMode: "bottom" as EmitMode,
  scale: 1,
  colorMode: "mono" as ColorMode,
  hueShift: 0,
  audioReactive: 1,
  bassInfluence: 0.9,
  midInfluence: 0.6,
  trebleInfluence: 0.5,
  seed: 0,
  highlights: 0.45
};

export type SmokeSimParams = typeof SMOKE_DEFAULTS;

const toNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const toString = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;

export const resolveEmitMode = (value: unknown): EmitMode => toString(value, ["centre", "bottom", "random"] as const, "bottom");

const resolveColorMode = (value: unknown): ColorMode => toString(value, ["mono", "tinted"] as const, "mono");

export const clampDiffusion = (value: unknown): number => clamp(toNumber(value, SMOKE_DEFAULTS.diffusion), 0, 1);

export const normalizeSmokeParams = (params: Record<string, unknown>): SmokeSimParams => ({
  density: clamp(toNumber(params.density, SMOKE_DEFAULTS.density), 0, 1.3),
  flowSpeed: clamp(toNumber(params.flowSpeed, SMOKE_DEFAULTS.flowSpeed), 0, 2),
  turbulence: clamp(toNumber(params.turbulence, SMOKE_DEFAULTS.turbulence), 0, 2),
  swirl: clamp(toNumber(params.swirl, SMOKE_DEFAULTS.swirl), 0, 2),
  diffusion: clampDiffusion(params.diffusion),
  softness: clamp(toNumber(params.softness, SMOKE_DEFAULTS.softness), 0, 1),
  emission: clamp(toNumber(params.emission, SMOKE_DEFAULTS.emission), 0, 1.5),
  emitMode: resolveEmitMode(params.emitMode),
  scale: clamp(toNumber(params.scale, SMOKE_DEFAULTS.scale), 0.5, 2.2),
  colorMode: resolveColorMode(params.colorMode),
  hueShift: clamp(toNumber(params.hueShift, SMOKE_DEFAULTS.hueShift), -180, 180),
  audioReactive: clamp(toNumber(params.audioReactive, SMOKE_DEFAULTS.audioReactive), 0, 1),
  bassInfluence: clamp(toNumber(params.bassInfluence, SMOKE_DEFAULTS.bassInfluence), 0, 2),
  midInfluence: clamp(toNumber(params.midInfluence, SMOKE_DEFAULTS.midInfluence), 0, 2),
  trebleInfluence: clamp(toNumber(params.trebleInfluence, SMOKE_DEFAULTS.trebleInfluence), 0, 2),
  seed: Math.floor(clamp(toNumber(params.seed, SMOKE_DEFAULTS.seed), 0, 9999)),
  highlights: clamp(toNumber(params.highlights, SMOKE_DEFAULTS.highlights), 0, 1)
});

const hashFloat = (value: number): number => {
  const hashed = Math.sin(value * 12.9898 + 78.233) * 43758.5453;
  return hashed - Math.floor(hashed);
};

const createBuffer = (): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 4;
  return canvas;
};

const isFilterSupported = (ctx: CanvasRenderingContext2D): boolean => "filter" in ctx;

export class SmokeSimulationEffect implements Effect {
  private densityCanvasA = createBuffer();
  private densityCanvasB = createBuffer();
  private tempCanvas = createBuffer();
  private densityCtxA = this.mustGetCtx(this.densityCanvasA);
  private densityCtxB = this.mustGetCtx(this.densityCanvasB);
  private tempCtx = this.mustGetCtx(this.tempCanvas);
  private renderWidth = 0;
  private renderHeight = 0;
  private beatKick = 0;

  private mustGetCtx(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      throw new Error("Unable to create smoke simulation context");
    }
    return ctx;
  }

  private ensureBuffers(width: number, height: number, era: string | undefined): void {
    const quality = era === "8bit" || era === "16bit" ? 0.16 : era === "future" ? 0.27 : 0.22;
    const w = Math.max(72, Math.round(width * quality));
    const h = Math.max(44, Math.round(height * quality));
    if (w === this.renderWidth && h === this.renderHeight) {
      return;
    }

    this.renderWidth = w;
    this.renderHeight = h;

    [this.densityCanvasA, this.densityCanvasB, this.tempCanvas].forEach((canvas) => {
      canvas.width = w;
      canvas.height = h;
    });

    this.reset();
  }

  private drawEmission(
    ctx: CanvasRenderingContext2D,
    mode: EmitMode,
    strength: number,
    time: number,
    seed: number,
    scale: number
  ): void {
    const blobCount = mode === "random" ? 3 : 2;
    const radiusBase = Math.max(8, this.renderWidth * 0.1 * (2.1 - scale));

    for (let i = 0; i < blobCount; i += 1) {
      const t = time * 0.6 + i * 3.37 + seed * 0.17;
      const xDrift = (hashFloat(t + 0.31) - 0.5) * this.renderWidth * 0.22;
      const xCenter =
        mode === "centre"
          ? this.renderWidth * 0.5 + xDrift * 0.4
          : mode === "random"
            ? hashFloat(t + 1.7) * this.renderWidth
            : this.renderWidth * (0.35 + i * 0.3) + xDrift * 0.35;

      const yCenter =
        mode === "bottom"
          ? this.renderHeight * (0.88 + 0.07 * hashFloat(t + 9.3))
          : mode === "centre"
            ? this.renderHeight * (0.54 + (hashFloat(t + 2.4) - 0.5) * 0.2)
            : this.renderHeight * (0.35 + hashFloat(t + 4.9) * 0.55);

      const radius = radiusBase * (0.8 + hashFloat(t + 7.1) * 0.8);
      const gradient = ctx.createRadialGradient(xCenter, yCenter, radius * 0.18, xCenter, yCenter, radius);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${clamp(strength * 0.35, 0, 0.85)})`);
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(xCenter, yCenter, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private applyBlur(source: HTMLCanvasElement, target: CanvasRenderingContext2D, softness: number, era: string | undefined): void {
    const blurPx = (era === "8bit" || era === "16bit" ? 0.8 : 2.2) * softness;
    target.clearRect(0, 0, this.renderWidth, this.renderHeight);
    if (blurPx > 0.05 && isFilterSupported(target)) {
      target.save();
      target.filter = `blur(${blurPx.toFixed(2)}px)`;
      target.drawImage(source, 0, 0);
      target.restore();
      return;
    }

    const offset = Math.max(0.45, softness * 1.6);
    target.globalAlpha = 0.3;
    target.drawImage(source, 0, 0);
    target.drawImage(source, -offset, 0);
    target.drawImage(source, offset, 0);
    target.drawImage(source, 0, -offset);
    target.drawImage(source, 0, offset);
    target.globalAlpha = 1;
  }

  render({ ctx, width, height, time, delta, audio, params, era }: EffectRenderContext): void {
    this.ensureBuffers(width, height, era);
    const p = normalizeSmokeParams(params as Record<string, unknown>);

    this.beatKick = Math.max(0, this.beatKick - delta * 2.8);
    if (audio.beat) {
      this.beatKick = 1;
    }

    const bass = audio.bass * p.bassInfluence * p.audioReactive;
    const mid = audio.mid * p.midInfluence * p.audioReactive;
    const treble = audio.treble * p.trebleInfluence * p.audioReactive;
    const beat = this.beatKick;

    const eraFlowBoost = era === "future" ? 1.15 : era === "ps1" || era === "pcdemo" ? 1 : 0.85;
    const flowBase = p.flowSpeed * (0.3 + mid * 0.45 + bass * 0.25) * eraFlowBoost;
    const swirlKick = p.swirl * (0.8 + beat * 0.55 + treble * 0.3);
    const turbulence = p.turbulence * (0.65 + mid * 0.5 + (era === "future" ? 0.18 : 0));

    this.densityCtxB.clearRect(0, 0, this.renderWidth, this.renderHeight);

    const passes = era === "future" ? 4 : 3;
    for (let pass = 0; pass < passes; pass += 1) {
      const passN = pass / Math.max(1, passes - 1);
      const phase = time * (0.36 + passN * 0.45) + p.seed * 0.07 + pass * 2.17;
      const windX = Math.sin(phase * 1.1) * flowBase * (1.2 + passN * 0.65);
      const rise = (0.7 + bass * 1.25 + beat * 0.55) * flowBase;
      const curl = Math.cos(phase * 1.7 + Math.sin(time * 0.5 + pass)) * swirlKick;
      const offsetX = windX * 11 + curl * 4;
      const offsetY = -rise * 12 + Math.sin(phase * 2.2) * turbulence * 4;
      const stretch = 1 + Math.sin(phase * 0.9) * 0.018 + beat * 0.01;

      this.densityCtxB.save();
      this.densityCtxB.globalAlpha = clamp(0.2 + p.diffusion * 0.25 - passN * 0.035, 0.05, 0.5);
      this.densityCtxB.translate(this.renderWidth * 0.5, this.renderHeight * 0.5);
      this.densityCtxB.scale(stretch, 1 + passN * 0.01);
      this.densityCtxB.translate(-this.renderWidth * 0.5, -this.renderHeight * 0.5);
      this.densityCtxB.drawImage(this.densityCanvasA, offsetX, offsetY, this.renderWidth, this.renderHeight);
      this.densityCtxB.restore();
    }

    this.densityCtxB.save();
    this.densityCtxB.globalCompositeOperation = "source-atop";
    this.densityCtxB.fillStyle = `rgba(255, 255, 255, ${clamp(p.diffusion, 0, 1)})`;
    this.densityCtxB.fillRect(0, 0, this.renderWidth, this.renderHeight);
    this.densityCtxB.restore();

    const emissionStrength = p.emission * p.density * (0.4 + bass * 0.9 + beat * 0.55 + audio.rms * 0.35);
    this.drawEmission(this.densityCtxB, p.emitMode, emissionStrength, time, p.seed, p.scale);

    this.applyBlur(this.densityCanvasB, this.tempCtx, clamp(p.softness + treble * 0.16, 0, 1), era);

    this.densityCtxA.clearRect(0, 0, this.renderWidth, this.renderHeight);
    this.densityCtxA.save();
    this.densityCtxA.globalAlpha = clamp(0.85 + p.highlights * 0.25 + beat * 0.1, 0.75, 1);
    this.densityCtxA.drawImage(this.tempCanvas, 0, 0);
    this.densityCtxA.restore();

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "source-over";
    const lightness = clamp(88 + p.highlights * 6 + audio.rms * 8, 65, 98);
    const saturation = p.colorMode === "mono" ? 12 + p.hueShift * 0.05 : 42 + treble * 10;
    const hue = p.colorMode === "mono" ? 210 + p.hueShift * 0.2 : 220 + p.hueShift + treble * 20;
    ctx.fillStyle = `hsl(${hue}, ${clamp(saturation, 0, 90)}%, ${lightness}%)`;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = "destination-in";
    ctx.globalAlpha = clamp(p.density * (0.85 + bass * 0.25), 0, 1);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.densityCanvasA, 0, 0, width, height);

    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = clamp(0.22 + p.highlights * 0.5 + beat * 0.2, 0.1, 0.8);
    ctx.drawImage(this.densityCanvasA, 0, 0, width, height);
    ctx.restore();
  }

  reset(): void {
    this.densityCtxA.clearRect(0, 0, this.densityCanvasA.width, this.densityCanvasA.height);
    this.densityCtxB.clearRect(0, 0, this.densityCanvasB.width, this.densityCanvasB.height);
    this.tempCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
    this.beatKick = 0;
  }
}
