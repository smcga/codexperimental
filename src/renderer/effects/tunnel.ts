import { createPalette } from "../../util/palette";

export class Tunnel {
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
    const cx = w / 2;
    const cy = h / 2;
    const t = time * 1.1;
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.0001;
        const angle = Math.atan2(dy, dx);
        const u = (angle / Math.PI + 1) * 0.5;
        const v = (1 / dist) * 40 + t * 0.4;
        const shade = Math.sin(v * 2 + t) + Math.cos(u * 8 + t);
        const idx = Math.floor(((shade + 2) / 4) * 255) & 255;
        this.buffer[y * w + x] = this.palette[idx];
      }
    }
    ctx.save();
    ctx.globalAlpha = 0.55 + intensity * 0.4;
    ctx.putImageData(this.imageData, 0, 0);
    ctx.restore();
  }
}
