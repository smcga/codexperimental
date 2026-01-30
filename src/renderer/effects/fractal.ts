import { EffectDefinition } from "./types";

export class FractalFeedbackEffect implements EffectDefinition {
  name = "fractal";
  private buffer: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.buffer = document.createElement("canvas");
    this.buffer.width = 320;
    this.buffer.height = 180;
    const ctx = this.buffer.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to create fractal buffer.");
    }
    this.ctx = ctx;
  }

  reset(): void {
    this.ctx.clearRect(0, 0, this.buffer.width, this.buffer.height);
  }

  render({ ctx, width, height, time, audio }: Parameters<EffectDefinition["render"]>[0]): void {
    const bctx = this.ctx;
    bctx.save();
    bctx.globalCompositeOperation = "source-over";
    bctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    bctx.fillRect(0, 0, this.buffer.width, this.buffer.height);

    bctx.translate(this.buffer.width / 2, this.buffer.height / 2);
    bctx.rotate(time * 0.1 + audio.treble * 0.6);
    bctx.scale(0.98 + audio.bass * 0.04, 0.98 + audio.bass * 0.04);
    bctx.drawImage(
      this.buffer,
      -this.buffer.width / 2,
      -this.buffer.height / 2,
      this.buffer.width,
      this.buffer.height
    );
    bctx.restore();

    bctx.save();
    bctx.translate(this.buffer.width / 2, this.buffer.height / 2);
    bctx.strokeStyle = `rgba(120, 240, 255, ${0.4 + audio.mid * 0.4})`;
    bctx.lineWidth = 1 + audio.bass * 2;
    for (let i = 0; i < 6; i += 1) {
      const angle = time * 0.6 + i * 1.1;
      bctx.beginPath();
      bctx.moveTo(0, 0);
      bctx.lineTo(Math.cos(angle) * 60, Math.sin(angle) * 60);
      bctx.stroke();
    }
    bctx.restore();

    ctx.save();
    ctx.drawImage(this.buffer, 0, 0, width, height);
    ctx.restore();
  }
}
