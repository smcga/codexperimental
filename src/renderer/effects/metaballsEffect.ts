import { clamp, lerp } from "../../util/math";
import type { EffectRenderContext } from "./types";

export class MetaballsEffect {
  private buffer: HTMLCanvasElement;
  private bufferCtx: CanvasRenderingContext2D;
  private imageData: ImageData;

  constructor(private width = 160, private height = 90) {
    this.buffer = document.createElement("canvas");
    this.buffer.width = width;
    this.buffer.height = height;
    const ctx = this.buffer.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to create metaballs buffer");
    }
    this.bufferCtx = ctx;
    this.imageData = ctx.createImageData(width, height);
  }

  render({ ctx, width, height, time, features, params }: EffectRenderContext): void {
    const count = Math.max(3, Math.floor(params.count ?? 4));
    const threshold = params.threshold ?? 1.1;
    const data = this.imageData.data;
    const balls = Array.from({ length: count }, (_, index) => {
      const angle = time * 0.6 + index * 1.4;
      return {
        x: (Math.sin(angle) * 0.4 + 0.5) * this.width,
        y: (Math.cos(angle * 1.2) * 0.4 + 0.5) * this.height,
        r: 16 + features.bass * 18 + index * 2
      };
    });

    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        let field = 0;
        balls.forEach((ball) => {
          const dx = x - ball.x;
          const dy = y - ball.y;
          field += (ball.r * ball.r) / (dx * dx + dy * dy + 1);
        });
        const idx = (y * this.width + x) * 4;
        const intensity = clamp((field / (threshold * 120)) * 1.6, 0, 1);
        const glow = lerp(30, 220, intensity);
        data[idx] = glow + features.treble * 40;
        data[idx + 1] = glow * 0.6 + features.mid * 80;
        data[idx + 2] = glow * 0.2 + 80 + features.bass * 60;
        data[idx + 3] = 255;
      }
    }

    this.bufferCtx.putImageData(this.imageData, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.buffer, 0, 0, width, height);
  }
}
