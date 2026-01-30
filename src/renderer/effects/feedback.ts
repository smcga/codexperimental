import { EffectDefinition } from "./types";

export class FeedbackZoomEffect implements EffectDefinition {
  name = "feedback";
  private buffer: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.buffer = document.createElement("canvas");
    this.buffer.width = 320;
    this.buffer.height = 180;
    const ctx = this.buffer.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to create feedback buffer.");
    }
    this.ctx = ctx;
  }

  reset(): void {
    this.ctx.clearRect(0, 0, this.buffer.width, this.buffer.height);
  }

  render({ ctx, width, height, audio }: Parameters<EffectDefinition["render"]>[0]): void {
    const bctx = this.ctx;
    const zoom = 1.01 + audio.bass * 0.03;
    const rotation = audio.treble * 0.03;

    bctx.save();
    bctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    bctx.fillRect(0, 0, this.buffer.width, this.buffer.height);
    bctx.translate(this.buffer.width / 2, this.buffer.height / 2);
    bctx.rotate(rotation);
    bctx.scale(zoom, zoom);
    bctx.drawImage(
      this.buffer,
      -this.buffer.width / 2,
      -this.buffer.height / 2,
      this.buffer.width,
      this.buffer.height
    );
    bctx.restore();

    bctx.save();
    bctx.globalCompositeOperation = "lighter";
    bctx.fillStyle = `rgba(255, 120, 200, ${0.2 + audio.mid * 0.3})`;
    bctx.fillRect(
      this.buffer.width * 0.2,
      this.buffer.height * 0.2,
      this.buffer.width * 0.6,
      this.buffer.height * 0.6
    );
    bctx.restore();

    ctx.save();
    ctx.drawImage(this.buffer, 0, 0, width, height);
    ctx.restore();
  }
}
