import { clamp } from "../../util/math";
import type { EffectRenderContext } from "./types";

export class FractalEffect {
  private buffer: HTMLCanvasElement;
  private bufferCtx: CanvasRenderingContext2D;

  constructor(private width = 320, private height = 180) {
    this.buffer = document.createElement("canvas");
    this.buffer.width = width;
    this.buffer.height = height;
    const ctx = this.buffer.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to create fractal buffer");
    }
    this.bufferCtx = ctx;
  }

  render({ ctx, width, height, time, features, params }: EffectRenderContext): void {
    const fade = params.fade ?? 0.12;
    const spin = params.spin ?? 0.4;
    const scale = 0.98 + features.bass * 0.02;

    this.bufferCtx.save();
    this.bufferCtx.globalAlpha = 1 - fade;
    this.bufferCtx.translate(this.width / 2, this.height / 2);
    this.bufferCtx.rotate(time * spin * 0.2 + features.treble * 0.1);
    this.bufferCtx.scale(scale, scale);
    this.bufferCtx.translate(-this.width / 2, -this.height / 2);
    this.bufferCtx.drawImage(this.buffer, 0, 0);
    this.bufferCtx.restore();

    this.bufferCtx.globalCompositeOperation = "lighter";
    this.bufferCtx.fillStyle = `rgba(100, 220, 255, ${clamp(0.2 + features.treble * 0.5, 0, 1)})`;
    this.bufferCtx.beginPath();
    this.bufferCtx.arc(
      this.width / 2 + Math.sin(time * 1.2) * 40,
      this.height / 2 + Math.cos(time * 1.1) * 40,
      12 + features.bass * 20,
      0,
      Math.PI * 2
    );
    this.bufferCtx.fill();
    this.bufferCtx.globalCompositeOperation = "source-over";

    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.buffer, 0, 0, width, height);
  }

  reset(): void {
    this.bufferCtx.clearRect(0, 0, this.width, this.height);
  }
}
