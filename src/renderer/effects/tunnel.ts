import { createPalette } from '../../util/palette';

export class Tunnel {
  private width: number;
  private height: number;
  private imageData: ImageData;
  private buffer: Uint32Array;
  private palette = createPalette();
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
      throw new Error('Tunnel context unavailable');
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
    const cx = w / 2;
    const cy = h / 2;
    const t = time * 0.6;

    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const dx = (x - cx) / w;
        const dy = (y - cy) / h;
        const angle = Math.atan2(dy, dx);
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
        const u = angle * 3 + t * 1.4;
        const v = 1 / dist + t * 2.4;
        const checker = (Math.floor(u * 4) + Math.floor(v * 1.5)) & 1;
        const shade = checker ? 200 : 60;
        const colorIndex = (shade + Math.floor(dist * 220)) & 255;
        this.buffer[y * w + x] = this.palette[colorIndex];
      }
    }

    this.ctx.putImageData(this.imageData, 0, 0);
  }

  drawTo(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.drawImage(this.canvas, 0, 0, width, height);
  }
}
