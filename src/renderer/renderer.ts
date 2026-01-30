import type { AudioFeatures } from "../audio/audioPlayer";
import type { TimelineState } from "../timeline/timeline";
import { clamp } from "../util/math";
import { createEffectRegistry } from "./effects";
import type { Effect } from "./effects/types";
import { renderTextCues } from "./text/textRenderer";

export type RenderContext = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  time: number;
  delta: number;
  features: AudioFeatures;
  state: TimelineState;
};

export class Renderer {
  private baseWidth: number;
  private baseHeight: number;
  private effects: Record<string, Effect>;
  private sceneA: HTMLCanvasElement;
  private sceneB: HTMLCanvasElement;
  private sceneCtxA: CanvasRenderingContext2D;
  private sceneCtxB: CanvasRenderingContext2D;
  private outputCanvas: HTMLCanvasElement;
  private outputCtx: CanvasRenderingContext2D;

  constructor(baseWidth = 480, baseHeight = 270) {
    this.baseWidth = baseWidth;
    this.baseHeight = baseHeight;
    this.effects = createEffectRegistry();

    this.sceneA = document.createElement("canvas");
    this.sceneB = document.createElement("canvas");
    this.outputCanvas = document.createElement("canvas");

    [this.sceneA, this.sceneB, this.outputCanvas].forEach((canvas) => {
      canvas.width = this.baseWidth;
      canvas.height = this.baseHeight;
    });

    const ctxA = this.sceneA.getContext("2d");
    const ctxB = this.sceneB.getContext("2d");
    const ctxOut = this.outputCanvas.getContext("2d");
    if (!ctxA || !ctxB || !ctxOut) {
      throw new Error("Unable to create renderer buffers");
    }
    this.sceneCtxA = ctxA;
    this.sceneCtxB = ctxB;
    this.outputCtx = ctxOut;
  }

  reset(): void {
    Object.values(this.effects).forEach((effect) => effect.reset?.());
    this.sceneCtxA.clearRect(0, 0, this.baseWidth, this.baseHeight);
    this.sceneCtxB.clearRect(0, 0, this.baseWidth, this.baseHeight);
    this.outputCtx.clearRect(0, 0, this.baseWidth, this.baseHeight);
  }

  render({ ctx, width, height, time, delta, features, state }: RenderContext): void {
    const { current, next, transition } = state;
    const currentEffect = this.effects[current.effect];
    if (!currentEffect) {
      throw new Error(`Unknown effect: ${current.effect}`);
    }

    if (transition && next) {
      const nextEffect = this.effects[next.effect];
      if (!nextEffect) {
        throw new Error(`Unknown effect: ${next.effect}`);
      }
      this.renderEffect(currentEffect, this.sceneCtxA, current.params, time, delta, features);
      this.renderEffect(nextEffect, this.sceneCtxB, next.params, time, delta, features);
      this.mixTransition(transition.progress, transition.type);
    } else {
      this.renderEffect(currentEffect, this.outputCtx, current.params, time, delta, features);
    }

    ctx.clearRect(0, 0, width, height);
    const scale = Math.min(width / this.baseWidth, height / this.baseHeight);
    const drawWidth = this.baseWidth * scale;
    const drawHeight = this.baseHeight * scale;
    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2;

    const shake = features.beatStrength * 6;
    const shakeX = (Math.random() - 0.5) * shake;
    const shakeY = (Math.random() - 0.5) * shake;

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.translate(offsetX + shakeX, offsetY + shakeY);
    ctx.scale(scale, scale);
    ctx.drawImage(this.outputCanvas, 0, 0, this.baseWidth, this.baseHeight);
    renderTextCues(ctx, state.cues, time, features, this.baseWidth, this.baseHeight);
    ctx.restore();

    this.renderOverlays(ctx, width, height, features);
  }

  private renderEffect(
    effect: Effect,
    ctx: CanvasRenderingContext2D,
    params: Record<string, number>,
    time: number,
    delta: number,
    features: AudioFeatures
  ): void {
    effect.render({
      ctx,
      width: this.baseWidth,
      height: this.baseHeight,
      time,
      delta,
      features,
      params
    });
  }

  private mixTransition(progress: number, type: "fade" | "wipe"): void {
    this.outputCtx.clearRect(0, 0, this.baseWidth, this.baseHeight);
    if (type === "wipe") {
      const wipeX = this.baseWidth * clamp(progress, 0, 1);
      this.outputCtx.drawImage(this.sceneA, 0, 0);
      this.outputCtx.save();
      this.outputCtx.beginPath();
      this.outputCtx.rect(0, 0, wipeX, this.baseHeight);
      this.outputCtx.clip();
      this.outputCtx.drawImage(this.sceneB, 0, 0);
      this.outputCtx.restore();
      return;
    }

    this.outputCtx.globalAlpha = 1 - progress;
    this.outputCtx.drawImage(this.sceneA, 0, 0);
    this.outputCtx.globalAlpha = progress;
    this.outputCtx.drawImage(this.sceneB, 0, 0);
    this.outputCtx.globalAlpha = 1;
  }

  private renderOverlays(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    features: AudioFeatures
  ): void {
    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = `rgba(0, 0, 0, ${0.18 + features.bass * 0.2})`;
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 2);
    }

    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.2,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.8
    );
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.5)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}
