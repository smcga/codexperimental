import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type CanvasCache = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
};

const DEFAULTS = {
  mode: "horizontal",
  amp: 28,
  freq: 0.06,
  speed: 2.0,
  slice: 2,
  phase: 0,
  sourceScale: 1,
  edges: "wrap",
  logoText: "DISTORT",
  audioReact: 0.7,
  beatBoost: 0.55,
  glow: 0.08
};

const getNumberParam = (value: unknown, fallback: number): number => (typeof value === "number" ? value : fallback);
const getStringParam = (value: unknown, fallback: string): string => (typeof value === "string" ? value : fallback);

export class SineDistorterEffect implements Effect {
  private sourceCache: CanvasCache | null = null;
  private tempCache: CanvasCache | null = null;
  private beatPulse = 0;

  reset(): void {
    this.beatPulse = 0;
  }

  private ensureCanvas(cache: CanvasCache | null, width: number, height: number): CanvasCache | null {
    if (typeof document === "undefined") {
      return null;
    }

    if (cache && cache.width === width && cache.height === height) {
      return cache;
    }

    const canvas = cache?.canvas ?? document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }

    return {
      canvas,
      ctx,
      width,
      height
    };
  }

  private drawLogoSource(ctx: CanvasRenderingContext2D, width: number, height: number, text: string, time: number): void {
    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#0b101a");
    gradient.addColorStop(1, "#1a1f33");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    const barHeight = Math.max(8, Math.round(height * 0.08));
    ctx.fillRect(0, height * 0.18, width, barHeight);
    ctx.fillRect(0, height * 0.78, width, barHeight);

    const circleSize = Math.max(40, Math.min(width, height) * 0.18);
    ctx.beginPath();
    ctx.fillStyle = "rgba(90, 220, 255, 0.12)";
    ctx.arc(width * 0.15, height * 0.7, circleSize, 0, Math.PI * 2);
    ctx.fill();

    const fontSize = Math.max(48, Math.round(height * 0.32));
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${fontSize}px sans-serif`;

    const pulse = 1 + Math.sin(time * 0.8) * 0.04;
    const gradientText = ctx.createLinearGradient(0, height * 0.35, 0, height * 0.65);
    gradientText.addColorStop(0, "#fef7b2");
    gradientText.addColorStop(0.5, "#ff6ad5");
    gradientText.addColorStop(1, "#52e6ff");
    ctx.fillStyle = gradientText;
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(pulse, pulse);
    ctx.fillText(text, 0, 0);
    ctx.restore();

    ctx.lineWidth = Math.max(2, Math.round(fontSize * 0.06));
    ctx.strokeStyle = "rgba(6, 10, 24, 0.9)";
    ctx.strokeText(text, width / 2, height / 2);

    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#000000";
    for (let y = 0; y < height; y += 2) {
      ctx.fillRect(0, y, width, 1);
    }
    ctx.globalAlpha = 1;
  }

  private drawWrappedSlice(
    ctx: CanvasRenderingContext2D,
    source: HTMLCanvasElement,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
    wrapSpan: number,
    edges: string
  ): void {
    ctx.drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh);
    if (edges !== "wrap") {
      return;
    }
    if (dx > 0) {
      ctx.drawImage(source, sx, sy, sw, sh, dx - wrapSpan, dy, dw, dh);
    } else if (dx < 0) {
      ctx.drawImage(source, sx, sy, sw, sh, dx + wrapSpan, dy, dw, dh);
    }
  }

  render({ ctx, width, height, time, delta, audio, params }: EffectRenderContext): void {
    const dt = clamp(delta, 0, 0.05);
    const mode = getStringParam(params.mode, DEFAULTS.mode);
    const edges = getStringParam(params.edges, DEFAULTS.edges);
    const sourceMode = getStringParam(params.source, "logo");
    const logoText = getStringParam(params.logoText, DEFAULTS.logoText);
    const amp = getNumberParam(params.amp, DEFAULTS.amp);
    const freq = getNumberParam(params.freq, DEFAULTS.freq);
    const speed = getNumberParam(params.speed, DEFAULTS.speed);
    const phase = getNumberParam(params.phase, DEFAULTS.phase);
    const slice = clamp(Math.round(getNumberParam(params.slice, DEFAULTS.slice)), 1, 8);
    const sourceScale = clamp(getNumberParam(params.sourceScale, DEFAULTS.sourceScale), 1, 3);
    const audioReact = clamp(getNumberParam(params.audioReact, DEFAULTS.audioReact), 0, 1);
    const beatBoost = clamp(getNumberParam(params.beatBoost, DEFAULTS.beatBoost), 0, 1);
    const glow = clamp(getNumberParam(params.glow, DEFAULTS.glow), 0, 0.3);

    if (audio.beat) {
      this.beatPulse = 1;
    } else {
      this.beatPulse = Math.max(0, this.beatPulse - dt * 6);
    }

    const speedEff = speed * (1 + audio.rms * 0.2 * audioReact);
    const ampEff = amp * (1 + audio.bass * 0.35 * audioReact + this.beatPulse * (0.25 + beatBoost));

    const sourceWidth = Math.max(1, Math.round(width / sourceScale));
    const sourceHeight = Math.max(1, Math.round(height / sourceScale));
    this.sourceCache = this.ensureCanvas(this.sourceCache, sourceWidth, sourceHeight);
    if (!this.sourceCache) {
      ctx.fillStyle = "#0a0c12";
      ctx.fillRect(0, 0, width, height);
      return;
    }

    const sourceCtx = this.sourceCache.ctx;
    if (sourceMode === "scene") {
      sourceCtx.clearRect(0, 0, sourceWidth, sourceHeight);
      sourceCtx.drawImage(ctx.canvas, 0, 0, sourceWidth, sourceHeight);
    } else {
      this.drawLogoSource(sourceCtx, sourceWidth, sourceHeight, logoText, time);
    }

    const scaleX = sourceWidth / width;
    const scaleY = sourceHeight / height;

    const needsTemp = mode === "both";
    this.tempCache = needsTemp ? this.ensureCanvas(this.tempCache, width, height) : this.tempCache;

    const targetCtx = needsTemp && this.tempCache ? this.tempCache.ctx : ctx;
    targetCtx.clearRect(0, 0, width, height);
    targetCtx.fillStyle = "#05070f";
    targetCtx.fillRect(0, 0, width, height);

    if (mode === "horizontal" || mode === "both") {
      for (let y = 0; y < height; y += slice) {
        const sliceHeight = Math.min(slice, height - y);
        const sourceY = y * scaleY;
        const sourceSliceHeight = sliceHeight * scaleY;
        const xOff = Math.sin(time * speedEff + y * freq + phase) * ampEff;
        this.drawWrappedSlice(
          targetCtx,
          this.sourceCache.canvas,
          0,
          sourceY,
          sourceWidth,
          sourceSliceHeight,
          xOff,
          y,
          width,
          sliceHeight,
          width,
          edges
        );
      }
    }

    if (mode === "vertical") {
      for (let x = 0; x < width; x += slice) {
        const sliceWidth = Math.min(slice, width - x);
        const sourceX = x * scaleX;
        const sourceSliceWidth = sliceWidth * scaleX;
        const yOff = Math.sin(time * speedEff + x * freq + phase) * ampEff;
        this.drawWrappedSlice(
          ctx,
          this.sourceCache.canvas,
          sourceX,
          0,
          sourceSliceWidth,
          sourceHeight,
          x,
          yOff,
          sliceWidth,
          height,
          height,
          edges
        );
      }
    }

    if (mode === "both" && this.tempCache) {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#05070f";
      ctx.fillRect(0, 0, width, height);
      for (let x = 0; x < width; x += slice) {
        const sliceWidth = Math.min(slice, width - x);
        const sourceX = x;
        const yOff = Math.sin(time * speedEff + x * freq * 1.1 + phase) * ampEff;
        this.drawWrappedSlice(
          ctx,
          this.tempCache.canvas,
          sourceX,
          0,
          sliceWidth,
          height,
          x,
          yOff,
          sliceWidth,
          height,
          height,
          edges
        );
      }
    }

    if (glow > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = glow;
      ctx.drawImage(ctx.canvas, 0, 0);
      ctx.restore();
    }
  }
}
