import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

const TAU = Math.PI * 2;
const TIME_JUMP_RESET_THRESHOLD = 0.5;

export const INFINITE_MIRROR_DEFAULTS = {
  depth: 18,
  scale: 0.88,
  rotation: 0.08,
  twist: 0.02,
  offsetX: 0,
  offsetY: 0,
  pulse: 0.2,
  glow: 0.35,
  softness: 0.08,
  vignette: 0.2,
  monochrome: 0,
  mirrorFrames: 1,
  baseScene: "grid" as InfiniteMirrorBaseScene,
  symmetry: 0,
  strobeOnBeat: 0.15,
  feedbackMix: 0.82
};

export type InfiniteMirrorBaseScene = "grid" | "rings" | "checker" | "bars" | "void";

export type InfiniteMirrorParams = {
  depth: number;
  scale: number;
  rotation: number;
  twist: number;
  offsetX: number;
  offsetY: number;
  pulse: number;
  glow: number;
  softness: number;
  vignette: number;
  monochrome: number;
  mirrorFrames: boolean;
  baseScene: InfiniteMirrorBaseScene;
  symmetry: number;
  strobeOnBeat: number;
  feedbackMix: number;
};

export type InfiniteMirrorEraMultipliers = {
  depth: number;
  rotation: number;
  twist: number;
  glow: number;
  pulse: number;
  frame: number;
};

const clampDepth = (value: unknown): number => Math.round(clamp(asNumber(value, INFINITE_MIRROR_DEFAULTS.depth), 1, 48));
const clampScale = (value: unknown): number => clamp(asNumber(value, INFINITE_MIRROR_DEFAULTS.scale), 0.6, 0.98);

const asNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const asBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  return fallback;
};

const asScene = (value: unknown): InfiniteMirrorBaseScene =>
  value === "rings" || value === "checker" || value === "bars" || value === "void" || value === "grid"
    ? value
    : INFINITE_MIRROR_DEFAULTS.baseScene;

export const normalizeInfiniteMirrorParams = (params: Record<string, unknown>): InfiniteMirrorParams => ({
  depth: clampDepth(params.depth),
  scale: clampScale(params.scale),
  rotation: clamp(asNumber(params.rotation, INFINITE_MIRROR_DEFAULTS.rotation), -1.5, 1.5),
  twist: clamp(asNumber(params.twist, INFINITE_MIRROR_DEFAULTS.twist), -0.5, 0.5),
  offsetX: clamp(asNumber(params.offsetX, INFINITE_MIRROR_DEFAULTS.offsetX), -0.5, 0.5),
  offsetY: clamp(asNumber(params.offsetY, INFINITE_MIRROR_DEFAULTS.offsetY), -0.5, 0.5),
  pulse: clamp(asNumber(params.pulse, INFINITE_MIRROR_DEFAULTS.pulse), 0, 2),
  glow: clamp(asNumber(params.glow, INFINITE_MIRROR_DEFAULTS.glow), 0, 1.5),
  softness: clamp(asNumber(params.softness, INFINITE_MIRROR_DEFAULTS.softness), 0, 0.5),
  vignette: clamp(asNumber(params.vignette, INFINITE_MIRROR_DEFAULTS.vignette), 0, 1),
  monochrome: clamp(asNumber(params.monochrome, INFINITE_MIRROR_DEFAULTS.monochrome), 0, 1),
  mirrorFrames: asBoolean(params.mirrorFrames, true),
  baseScene: asScene(params.baseScene),
  symmetry: clamp(asNumber(params.symmetry, INFINITE_MIRROR_DEFAULTS.symmetry), 0, 1),
  strobeOnBeat: clamp(asNumber(params.strobeOnBeat, INFINITE_MIRROR_DEFAULTS.strobeOnBeat), 0, 1),
  feedbackMix: clamp(asNumber(params.feedbackMix, INFINITE_MIRROR_DEFAULTS.feedbackMix), 0.3, 0.98)
});

export const detectTimeJump = (time: number, lastTime: number | null, threshold = TIME_JUMP_RESET_THRESHOLD): boolean => {
  if (lastTime === null || !Number.isFinite(lastTime)) {
    return false;
  }
  return Math.abs(time - lastTime) > threshold;
};

export const resolveEraMultipliers = (era: string | undefined): InfiniteMirrorEraMultipliers => {
  switch (era) {
    case "8bit":
      return { depth: 0.6, rotation: 0.5, twist: 0.4, glow: 0.65, pulse: 0.7, frame: 1.25 };
    case "16bit":
      return { depth: 0.74, rotation: 0.65, twist: 0.55, glow: 0.72, pulse: 0.85, frame: 1.2 };
    case "ps1":
      return { depth: 0.95, rotation: 0.95, twist: 1, glow: 1.1, pulse: 1, frame: 1 };
    case "pcdemo":
      return { depth: 1.05, rotation: 1.1, twist: 1.1, glow: 1.15, pulse: 1.1, frame: 0.95 };
    case "future":
      return { depth: 1.28, rotation: 1.35, twist: 1.45, glow: 1.3, pulse: 1.35, frame: 0.9 };
    default:
      return { depth: 1, rotation: 1, twist: 1, glow: 1, pulse: 1, frame: 1 };
  }
};

export const resolveEffectiveDepth = (depth: number, width: number, height: number, eraMultiplier: number): number => {
  const area = width * height;
  const budgetScale = area > 0 ? clamp(1300000 / area, 0.35, 1) : 1;
  return Math.max(1, Math.round(clamp(depth * eraMultiplier * budgetScale, 1, 48)));
};

class InfiniteMirrorEffect implements Effect {
  private feedbackCanvas: HTMLCanvasElement | null = null;
  private feedbackCtx: CanvasRenderingContext2D | null = null;
  private baseCanvas: HTMLCanvasElement | null = null;
  private baseCtx: CanvasRenderingContext2D | null = null;
  private lastTime: number | null = null;

  private ensureBuffers(width: number, height: number): void {
    if (!this.feedbackCanvas) {
      this.feedbackCanvas = document.createElement("canvas");
      this.feedbackCtx = this.feedbackCanvas.getContext("2d");
      this.baseCanvas = document.createElement("canvas");
      this.baseCtx = this.baseCanvas.getContext("2d");
      if (!this.feedbackCtx || !this.baseCtx) {
        throw new Error("Unable to initialize infinite mirror buffers.");
      }
    }

    if (!this.feedbackCanvas || !this.baseCanvas || !this.feedbackCtx || !this.baseCtx) {
      return;
    }

    if (this.feedbackCanvas.width !== width || this.feedbackCanvas.height !== height) {
      this.feedbackCanvas.width = width;
      this.feedbackCanvas.height = height;
      this.baseCanvas.width = width;
      this.baseCanvas.height = height;
      this.resetState();
    }
  }

  private clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.clearRect(0, 0, width, height);
  }

  private renderBaseScene(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    audio: EffectRenderContext["audio"],
    params: InfiniteMirrorParams,
    era: string | undefined
  ): void {
    const cx = width * 0.5;
    const cy = height * 0.5;
    const minDim = Math.min(width, height);
    const energy = clamp(audio.rms * 0.8 + audio.bass * 0.45 + audio.beatStrength * 0.35, 0, 1.4);

    const eraSaturation = era === "8bit" || era === "16bit" ? 0.75 : 1;
    const hue = (time * 24 + audio.treble * 38 + audio.mid * 16) % 360;

    this.clearCanvas(ctx, width, height);

    const bg = ctx.createRadialGradient(cx, cy, minDim * 0.04, cx, cy, minDim * 0.66);
    bg.addColorStop(0, `hsla(${hue}, ${55 * eraSaturation}%, ${18 + energy * 12}%, 1)`);
    bg.addColorStop(1, `hsla(${(hue + 120) % 360}, ${45 * eraSaturation}%, 4%, 1)`);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const pulse = 1 + Math.sin(time * 1.3 + audio.mid * 4) * 0.04 + audio.beatStrength * 0.03;

    if (params.baseScene === "void") {
      return;
    }

    if (params.baseScene === "checker" || params.baseScene === "grid") {
      const spacing = minDim * 0.09;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(time * 0.08);
      ctx.scale(pulse, pulse);
      ctx.translate(-cx, -cy);

      ctx.strokeStyle = `hsla(${(hue + 190) % 360}, 90%, ${50 + energy * 16}%, 0.25)`;
      ctx.lineWidth = Math.max(1, minDim * 0.0022);
      for (let x = -spacing * 2; x <= width + spacing * 2; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = -spacing * 2; y <= height + spacing * 2; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (params.baseScene === "rings" || params.baseScene === "grid") {
      const ringCount = 8;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(time * 0.12);
      for (let i = 0; i < ringCount; i += 1) {
        const t = i / Math.max(1, ringCount - 1);
        const radius = minDim * (0.12 + t * 0.38) * (1 + Math.sin(time * 0.7 + i * 0.9) * 0.03);
        ctx.strokeStyle = `hsla(${(hue + 35 + t * 160) % 360}, 88%, ${40 + t * 28}%, ${0.3 - t * 0.18 + energy * 0.06})`;
        ctx.lineWidth = Math.max(1, minDim * (0.005 - t * 0.003));
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (params.baseScene === "bars") {
      const barCount = 14;
      for (let i = 0; i < barCount; i += 1) {
        const t = i / Math.max(1, barCount - 1);
        const y = (i + 0.5) * (height / barCount);
        const wobble = Math.sin(time * 2 + i * 0.8 + audio.mid * 8) * width * 0.08;
        const half = width * (0.24 + t * 0.34 + audio.bass * 0.08);
        const x = cx + wobble;
        ctx.strokeStyle = `hsla(${(hue + 260 + t * 90) % 360}, 90%, ${44 + t * 20}%, 0.35)`;
        ctx.lineWidth = Math.max(1, minDim * 0.0032);
        ctx.beginPath();
        ctx.moveTo(x - half, y);
        ctx.lineTo(x + half, y);
        ctx.stroke();
      }
    }
  }

  private drawPortalFrame(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    depthRatio: number,
    glow: number,
    frameScale: number
  ): void {
    const frameW = width * frameScale;
    const frameH = height * frameScale;
    const lineWidth = Math.max(1, Math.min(width, height) * (0.002 + (1 - depthRatio) * 0.0025) * frameScale);
    const alpha = (0.18 + (1 - depthRatio) * 0.18) * glow;

    ctx.strokeStyle = `rgba(190, 225, 255, ${alpha})`;
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(-frameW * 0.5, -frameH * 0.5, frameW, frameH);

    if (glow > 0.1) {
      ctx.strokeStyle = `rgba(120, 190, 255, ${alpha * 0.45})`;
      ctx.lineWidth = lineWidth * 2.2;
      ctx.strokeRect(-frameW * 0.5, -frameH * 0.5, frameW, frameH);
    }
  }

  private drawRecursiveStack(
    targetCtx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    audio: EffectRenderContext["audio"],
    params: InfiniteMirrorParams,
    era: string | undefined
  ): void {
    if (!this.feedbackCanvas) {
      return;
    }

    const eraMul = resolveEraMultipliers(era);
    const depth = resolveEffectiveDepth(params.depth, width, height, eraMul.depth);
    const cx = width * 0.5;
    const cy = height * 0.5;
    const driftX = params.offsetX * width * 0.28;
    const driftY = params.offsetY * height * 0.28;
    const pulse = 1 + (audio.rms * 0.8 + audio.beatStrength * 0.5) * params.pulse * eraMul.pulse;
    const scaleWithPulse = clamp(params.scale * pulse, 0.62, 1.15);

    targetCtx.globalCompositeOperation = "source-over";
    targetCtx.globalAlpha = clamp(1 - params.softness * 0.7, 0.45, 1);
    targetCtx.drawImage(this.feedbackCanvas, 0, 0, width, height);

    for (let i = 0; i < depth; i += 1) {
      const layerRatio = i / Math.max(1, depth - 1);
      const scale = Math.pow(scaleWithPulse, i + 1);
      const angle =
        time * params.rotation * eraMul.rotation +
        i * params.twist * eraMul.twist +
        Math.sin(time * 0.65 + i * 0.22) * 0.015 +
        audio.treble * 0.025;
      const wave = 1 - layerRatio;
      const layerOffsetX = driftX * wave + Math.sin(time * 0.9 + i * 0.37) * width * 0.014 * wave;
      const layerOffsetY = driftY * wave + Math.cos(time * 0.8 + i * 0.41) * height * 0.014 * wave;

      targetCtx.save();
      targetCtx.translate(cx + layerOffsetX, cy + layerOffsetY);
      targetCtx.rotate(angle);
      targetCtx.scale(scale, scale);
      targetCtx.globalAlpha = clamp((0.5 - layerRatio * 0.3) * params.feedbackMix, 0.08, 0.6);
      targetCtx.drawImage(this.feedbackCanvas, -cx, -cy, width, height);

      if (params.mirrorFrames) {
        this.drawPortalFrame(targetCtx, width, height, layerRatio, params.glow * eraMul.glow, eraMul.frame);
      }

      if (i % 4 === 0) {
        targetCtx.fillStyle = `rgba(255, 255, 255, ${0.008 + (1 - layerRatio) * 0.015})`;
        targetCtx.fillRect(-width * 0.5, -height * 0.45, width, Math.max(1, height * 0.006));
      }
      targetCtx.restore();
    }
  }

  private applyPost(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    audio: EffectRenderContext["audio"],
    params: InfiniteMirrorParams
  ): void {
    const cx = width * 0.5;
    const cy = height * 0.5;
    const minDim = Math.min(width, height);

    if (params.symmetry > 0.001) {
      ctx.save();
      ctx.globalAlpha = params.symmetry * 0.25;
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(ctx.canvas, 0, 0, width, height);
      ctx.restore();
    }

    if (params.monochrome > 0.001) {
      ctx.save();
      const desat = clamp(params.monochrome, 0, 1);
      ctx.fillStyle = `rgba(120, 135, 155, ${desat * 0.2})`;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "luminosity";
      ctx.fillStyle = `rgba(128, 128, 128, ${desat * 0.9})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    if (params.vignette > 0.001) {
      const vig = ctx.createRadialGradient(cx, cy, minDim * 0.22, cx, cy, minDim * 0.72);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, `rgba(0,0,0,${params.vignette * 0.85})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);
    }

    const beatFlash = (audio.beat ? 1 : 0) * params.strobeOnBeat + audio.beatStrength * params.strobeOnBeat * 0.55;
    if (beatFlash > 0.001) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const flare = ctx.createRadialGradient(
        cx,
        cy,
        minDim * 0.03,
        cx + Math.sin(time * 1.8) * minDim * 0.05,
        cy + Math.cos(time * 1.5) * minDim * 0.05,
        minDim * 0.58
      );
      flare.addColorStop(0, `rgba(180, 230, 255, ${beatFlash * 0.35})`);
      flare.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = flare;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }

  private resetState(): void {
    if (this.feedbackCanvas && this.feedbackCtx) {
      this.feedbackCtx.clearRect(0, 0, this.feedbackCanvas.width, this.feedbackCanvas.height);
    }
  }

  render({ ctx, width, height, time, audio, params, era }: EffectRenderContext): void {
    this.ensureBuffers(width, height);

    if (!this.feedbackCanvas || !this.feedbackCtx || !this.baseCanvas || !this.baseCtx) {
      return;
    }

    const resolved = normalizeInfiniteMirrorParams(params as Record<string, unknown>);
    if (detectTimeJump(time, this.lastTime)) {
      this.resetState();
    }

    this.renderBaseScene(this.baseCtx, width, height, time, audio, resolved, era);

    ctx.fillStyle = "#04050b";
    ctx.fillRect(0, 0, width, height);

    ctx.globalAlpha = clamp(0.72 + audio.rms * 0.22, 0.45, 0.95);
    ctx.drawImage(this.baseCanvas, 0, 0, width, height);

    this.drawRecursiveStack(ctx, width, height, time, audio, resolved, era);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = clamp(0.18 + resolved.glow * 0.24 + audio.mid * 0.2, 0.08, 0.7);
    ctx.drawImage(this.baseCanvas, 0, 0, width, height);
    ctx.restore();

    this.applyPost(ctx, width, height, time, audio, resolved);

    this.feedbackCtx.save();
    this.feedbackCtx.globalCompositeOperation = "source-over";
    this.feedbackCtx.globalAlpha = 1;
    this.feedbackCtx.clearRect(0, 0, width, height);
    this.feedbackCtx.drawImage(ctx.canvas, 0, 0, width, height);
    this.feedbackCtx.restore();

    this.lastTime = time;
  }

  reset(): void {
    this.lastTime = null;
    this.resetState();
  }
}

export { InfiniteMirrorEffect };
