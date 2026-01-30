import { AudioFeatures } from "../audio/audioPlayer";
import { SectionConfig, TextCue } from "../config/loadConfig";
import { clamp } from "../util/math";
import { effectRegistry, resetEffects } from "./effects";
import { isMonochromeTime } from "./monochrome";
import { renderTextCues } from "./text/textRenderer";

export type RenderState = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  time: number;
  delta: number;
  section: SectionConfig;
  transition?: {
    from: SectionConfig;
    to: SectionConfig;
    progress: number;
    type: "fade" | "wipe";
  };
  textCues: TextCue[];
  audio: AudioFeatures;
};

export class Renderer {
  private baseCanvas: HTMLCanvasElement;
  private baseCtx: CanvasRenderingContext2D;
  private transitionCanvas: HTMLCanvasElement;
  private transitionCtx: CanvasRenderingContext2D;
  private baseWidth: number;
  private baseHeight: number;

  constructor(baseWidth = 320, baseHeight = 180) {
    this.baseWidth = baseWidth;
    this.baseHeight = baseHeight;
    this.baseCanvas = document.createElement("canvas");
    this.baseCanvas.width = baseWidth;
    this.baseCanvas.height = baseHeight;
    const baseCtx = this.baseCanvas.getContext("2d");
    if (!baseCtx) {
      throw new Error("Unable to create base canvas");
    }
    this.baseCtx = baseCtx;

    this.transitionCanvas = document.createElement("canvas");
    this.transitionCanvas.width = baseWidth;
    this.transitionCanvas.height = baseHeight;
    const transitionCtx = this.transitionCanvas.getContext("2d");
    if (!transitionCtx) {
      throw new Error("Unable to create transition canvas");
    }
    this.transitionCtx = transitionCtx;
  }

  reset(): void {
    resetEffects();
    this.baseCtx.clearRect(0, 0, this.baseWidth, this.baseHeight);
    this.transitionCtx.clearRect(0, 0, this.baseWidth, this.baseHeight);
  }

  render({ ctx, width, height, time, delta, section, transition, textCues, audio }: RenderState): void {
    const shake = audio.beatStrength * 6;
    const { scale, offsetX, offsetY } = this.computeLetterbox(width, height);
    const monochrome = isMonochromeTime(time);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);

    if (monochrome) {
      ctx.save();
      ctx.filter = "grayscale(1)";
    }

    if (transition) {
      this.renderSectionTo(this.transitionCtx, transition.from, time, delta, audio);
      this.renderSectionTo(this.baseCtx, transition.to, time, delta, audio);
      this.drawTransition(ctx, transition, scale, offsetX, offsetY, shake);
    } else {
      this.renderSectionTo(this.baseCtx, section, time, delta, audio);
      this.drawScaled(ctx, this.baseCanvas, scale, offsetX, offsetY, shake, 1);
    }

    if (monochrome) {
      ctx.restore();
    }

    ctx.save();
    ctx.translate(offsetX + shake, offsetY + shake);
    ctx.scale(scale, scale);
    this.renderOverlays(ctx, this.baseWidth, this.baseHeight, audio);
    renderTextCues(ctx, this.baseWidth, this.baseHeight, textCues, time);
    ctx.restore();
  }

  private renderSectionTo(
    targetCtx: CanvasRenderingContext2D,
    section: SectionConfig,
    time: number,
    delta: number,
    audio: AudioFeatures
  ): void {
    const effect = effectRegistry[section.effect];
    if (!effect) {
      targetCtx.fillStyle = "#000";
      targetCtx.fillRect(0, 0, this.baseWidth, this.baseHeight);
      targetCtx.fillStyle = "#fff";
      targetCtx.fillText(`Missing effect: ${section.effect}`, 12, 24);
      return;
    }
    effect.render({
      ctx: targetCtx,
      width: this.baseWidth,
      height: this.baseHeight,
      time,
      delta,
      audio,
      params: section.params
    });
  }

  private drawTransition(
    ctx: CanvasRenderingContext2D,
    transition: Required<RenderState>["transition"],
    scale: number,
    offsetX: number,
    offsetY: number,
    shake: number
  ): void {
    const progress = transition.progress;
    if (transition.type === "wipe") {
      this.drawScaled(ctx, this.transitionCanvas, scale, offsetX, offsetY, shake, 1);
      ctx.save();
      ctx.beginPath();
      const wipeX = offsetX + (this.baseWidth * scale + shake) * progress;
      ctx.rect(offsetX, offsetY, wipeX - offsetX, this.baseHeight * scale + shake * 2);
      ctx.clip();
      this.drawScaled(ctx, this.baseCanvas, scale, offsetX, offsetY, shake, 1);
      ctx.restore();
      return;
    }

    this.drawScaled(ctx, this.transitionCanvas, scale, offsetX, offsetY, shake, 1 - progress);
    this.drawScaled(ctx, this.baseCanvas, scale, offsetX, offsetY, shake, progress);
  }

  private drawScaled(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    scale: number,
    offsetX: number,
    offsetY: number,
    shake: number,
    alpha: number
  ): void {
    ctx.save();
    ctx.globalAlpha = clamp(alpha, 0, 1);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      canvas,
      offsetX + shake,
      offsetY + shake,
      this.baseWidth * scale,
      this.baseHeight * scale
    );
    ctx.restore();
  }

  private computeLetterbox(width: number, height: number): { scale: number; offsetX: number; offsetY: number } {
    const scale = Math.min(width / this.baseWidth, height / this.baseHeight);
    const drawWidth = this.baseWidth * scale;
    const drawHeight = this.baseHeight * scale;
    return {
      scale,
      offsetX: (width - drawWidth) / 2,
      offsetY: (height - drawHeight) / 2
    };
  }

  private renderOverlays(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    audio: AudioFeatures
  ): void {
    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = `rgba(0, 0, 0, ${0.1 + audio.rms * 0.2})`;
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 2);
    }
    ctx.restore();

    const vignette = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.2,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.8
    );
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.6)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }
}
