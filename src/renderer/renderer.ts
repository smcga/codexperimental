import { AudioFeatures } from "../audio/audioPlayer";
import { NormalizedSection } from "../config/loadConfig";
import { TimelineState } from "../timeline/timeline";
import { effectRegistry } from "./effects";
import { EffectDefinition } from "./effects/types";
import { renderTextCue } from "./text/textRenderer";

export type RenderContext = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  time: number;
  delta: number;
  audio: AudioFeatures;
  timelineState: TimelineState;
};

export class Renderer {
  private baseWidth: number;
  private baseHeight: number;
  private bufferA: HTMLCanvasElement;
  private bufferB: HTMLCanvasElement;
  private bufferCtxA: CanvasRenderingContext2D;
  private bufferCtxB: CanvasRenderingContext2D;

  constructor(baseWidth = 320, baseHeight = 180) {
    this.baseWidth = baseWidth;
    this.baseHeight = baseHeight;
    this.bufferA = document.createElement("canvas");
    this.bufferB = document.createElement("canvas");
    this.bufferA.width = baseWidth;
    this.bufferA.height = baseHeight;
    this.bufferB.width = baseWidth;
    this.bufferB.height = baseHeight;
    const ctxA = this.bufferA.getContext("2d");
    const ctxB = this.bufferB.getContext("2d");
    if (!ctxA || !ctxB) {
      throw new Error("Unable to create offscreen buffers.");
    }
    this.bufferCtxA = ctxA;
    this.bufferCtxB = ctxB;
  }

  reset(): void {
    effectRegistry.forEach((effect) => effect.reset?.());
    this.bufferCtxA.clearRect(0, 0, this.baseWidth, this.baseHeight);
    this.bufferCtxB.clearRect(0, 0, this.baseWidth, this.baseHeight);
  }

  render({ ctx, width, height, time, delta, audio, timelineState }: RenderContext): void {
    const { section, transition, activeCues } = timelineState;
    const { scale, offsetX, offsetY, drawWidth, drawHeight } = this.getLetterbox(width, height);

    const shake = audio.beatStrength * 6 + audio.rms * 2;
    const shakeX = (Math.random() - 0.5) * shake;
    const shakeY = (Math.random() - 0.5) * shake;

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.translate(shakeX, shakeY);

    if (transition) {
      this.renderSectionToBuffer(transition.from, this.bufferCtxA, time, delta, audio);
      this.renderSectionToBuffer(transition.to, this.bufferCtxB, time, delta, audio);
      this.drawTransition(ctx, transition.type, transition.progress, offsetX, offsetY, drawWidth, drawHeight);
    } else {
      this.renderSectionToBuffer(section, this.bufferCtxA, time, delta, audio);
      ctx.drawImage(this.bufferA, offsetX, offsetY, drawWidth, drawHeight);
    }

    this.renderText(ctx, activeCues, time, offsetX, offsetY, scale);
    this.renderOverlay(ctx, width, height, audio);

    ctx.restore();
  }

  private renderSectionToBuffer(
    section: NormalizedSection,
    bufferCtx: CanvasRenderingContext2D,
    time: number,
    delta: number,
    audio: AudioFeatures
  ): void {
    bufferCtx.clearRect(0, 0, this.baseWidth, this.baseHeight);
    const effect = this.getEffect(section.effect);
    effect.render({
      ctx: bufferCtx,
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
    type: "fade" | "wipe",
    progress: number,
    offsetX: number,
    offsetY: number,
    drawWidth: number,
    drawHeight: number
  ): void {
    if (type === "wipe") {
      ctx.drawImage(this.bufferA, offsetX, offsetY, drawWidth, drawHeight);
      ctx.save();
      ctx.beginPath();
      ctx.rect(offsetX, offsetY, drawWidth * progress, drawHeight);
      ctx.clip();
      ctx.drawImage(this.bufferB, offsetX, offsetY, drawWidth, drawHeight);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.globalAlpha = 1 - progress;
    ctx.drawImage(this.bufferA, offsetX, offsetY, drawWidth, drawHeight);
    ctx.globalAlpha = progress;
    ctx.drawImage(this.bufferB, offsetX, offsetY, drawWidth, drawHeight);
    ctx.restore();
  }

  private renderText(
    ctx: CanvasRenderingContext2D,
    cues: TimelineState["activeCues"],
    time: number,
    offsetX: number,
    offsetY: number,
    scale: number
  ): void {
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    cues.forEach((cue) => {
      renderTextCue(ctx, cue, time, this.baseWidth, this.baseHeight);
    });
    ctx.restore();
  }

  private renderOverlay(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    audio: AudioFeatures
  ): void {
    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = `rgba(0, 0, 0, ${0.2 + audio.rms * 0.3})`;
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 2);
    }

    const vignette = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.3,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.7
    );
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.6)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(80, 200, 255, ${audio.bass * 0.15})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  private getEffect(name: string): EffectDefinition {
    const effect = effectRegistry.get(name);
    if (!effect) {
      throw new Error(`Unknown effect: ${name}`);
    }
    return effect;
  }

  private getLetterbox(width: number, height: number): {
    scale: number;
    offsetX: number;
    offsetY: number;
    drawWidth: number;
    drawHeight: number;
  } {
    const scale = Math.min(width / this.baseWidth, height / this.baseHeight);
    const drawWidth = this.baseWidth * scale;
    const drawHeight = this.baseHeight * scale;
    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2;
    return { scale, offsetX, offsetY, drawWidth, drawHeight };
  }
}
