import { createPalette } from '../../util/palette';

export class PlasmaField {
  private width: number;
  private height: number;
  private imageData: ImageData;
  private palette = createPalette();
  private buffer: Uint32Array;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Plasma context unavailable');
    }
    this.ctx = ctx;
    this.imageData = new ImageData(width, height);
    this.buffer = new Uint32Array(this.imageData.data.buffer);
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.imageData = new ImageData(width, height);
    this.buffer = new Uint32Array(this.imageData.data.buffer);
  }

  render(time: number) {
    const w = this.width;
    const h = this.height;
    const t = time * 0.8;
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const value =
          Math.sin(x * 0.07 + t) +
          Math.sin(y * 0.08 + t * 1.3) +
          Math.sin((x + y) * 0.05 + t * 0.7) +
          Math.sin(Math.sqrt(x * x + y * y) * 0.09 - t);
        const colorIndex = Math.floor((value + 4) * 32) & 255;
        this.buffer[y * w + x] = this.palette[colorIndex];
      }
    }
    this.ctx.putImageData(this.imageData, 0, 0);
  }

  drawTo(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.drawImage(this.canvas, 0, 0, width, height);
  }
}
