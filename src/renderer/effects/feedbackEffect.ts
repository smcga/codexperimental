import type { EffectRenderContext } from "./types";

export class FeedbackEffect {
  private buffer: HTMLCanvasElement;
  private bufferCtx: CanvasRenderingContext2D;

  constructor(private width = 320, private height = 180) {
    this.buffer = document.createElement("canvas");
    this.buffer.width = width;
    this.buffer.height = height;
    const ctx = this.buffer.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to create feedback buffer");
    }
    this.bufferCtx = ctx;
  }

  render({ ctx, width, height, time, features, params }: EffectRenderContext): void {
    const zoom = params.zoom ?? 1.01;
    const rotate = params.rotate ?? 0.02;

    this.bufferCtx.save();
    this.bufferCtx.globalAlpha = 0.92;
    this.bufferCtx.translate(this.width / 2, this.height / 2);
    this.bufferCtx.rotate(rotate + features.treble * 0.04);
    const pulse = 1 + features.bass * 0.04;
    this.bufferCtx.scale(zoom * pulse, zoom * pulse);
    this.bufferCtx.translate(-this.width / 2, -this.height / 2);
    this.bufferCtx.drawImage(this.buffer, 0, 0);
    this.bufferCtx.restore();

    this.bufferCtx.fillStyle = "rgba(8, 10, 20, 0.25)";
    this.bufferCtx.fillRect(0, 0, this.width, this.height);

    this.bufferCtx.globalCompositeOperation = "lighter";
    this.bufferCtx.fillStyle = `rgba(255, 120, 180, ${0.2 + Math.sin(time * 4) * 0.1})`;
    this.bufferCtx.fillRect(
      this.width / 2 + Math.sin(time) * 30,
      this.height / 2 + Math.cos(time * 1.3) * 30,
      6 + features.mid * 10,
      40
    );
    this.bufferCtx.globalCompositeOperation = "source-over";

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(this.buffer, 0, 0, width, height);
  }

  reset(): void {
    this.bufferCtx.clearRect(0, 0, this.width, this.height);
  }
}
