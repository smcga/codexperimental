import { createPalette } from "../../util/palette";

export class Plasma {
  private width: number;
  private height: number;
  private imageData: ImageData;
  private buffer: Uint32Array;
  private palette = createPalette();

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.imageData = new ImageData(width, height);
    this.buffer = new Uint32Array(this.imageData.data.buffer);
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.imageData = new ImageData(width, height);
    this.buffer = new Uint32Array(this.imageData.data.buffer);
  }

  render(ctx: CanvasRenderingContext2D, time: number, intensity: number) {
    const w = this.width;
    const h = this.height;
    const t = time * 1.4;
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const value =
          Math.sin(x * 0.05 + t) +
          Math.sin(y * 0.06 + t * 1.3) +
          Math.sin((x + y) * 0.04 + t * 0.8);
        const idx = Math.floor(((value + 3) / 6) * 255) & 255;
        this.buffer[y * w + x] = this.palette[idx];
      }
    }
    ctx.save();
    ctx.globalAlpha = 0.6 + 0.4 * intensity;
    ctx.putImageData(this.imageData, 0, 0);
    ctx.restore();
  }
}
