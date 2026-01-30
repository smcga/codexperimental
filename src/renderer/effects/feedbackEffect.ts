import { Effect, EffectRenderContext } from "./types";
import { clamp } from "../../util/math";

export class FeedbackEffect implements Effect {
  private buffer: HTMLCanvasElement;
  private bufferCtx: CanvasRenderingContext2D;

  constructor() {
    this.buffer = document.createElement("canvas");
    this.buffer.width = 320;
    this.buffer.height = 180;
    const ctx = this.buffer.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to create feedback buffer");
    }
    this.bufferCtx = ctx;
  }

  render({ ctx, width, height, time, audio }: EffectRenderContext): void {
    const scale = 1 + audio.bass * 0.02 + Math.sin(time * 0.6) * 0.01;
    const rotation = Math.sin(time * 0.3) * 0.02 + audio.treble * 0.04;
    const intensity = clamp(audio.rms + audio.bass, 0, 1);

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(this.buffer, 0, 0, width, height);

    ctx.translate(width / 2, height / 2);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2, -height / 2);
    ctx.globalAlpha = 0.96;
    ctx.drawImage(this.buffer, 0, 0, width, height);
    ctx.restore();

    ctx.fillStyle = `rgba(20, 200, 255, ${0.05 + intensity * 0.2})`;
    ctx.beginPath();
    ctx.arc(width * 0.5 + Math.sin(time) * width * 0.2, height * 0.5, 40 + audio.bass * 20, 0, Math.PI * 2);
    ctx.fill();

    this.bufferCtx.clearRect(0, 0, this.buffer.width, this.buffer.height);
    this.bufferCtx.drawImage(ctx.canvas, 0, 0, this.buffer.width, this.buffer.height);
  }

  reset(): void {
    this.bufferCtx.clearRect(0, 0, this.buffer.width, this.buffer.height);
  }
}
