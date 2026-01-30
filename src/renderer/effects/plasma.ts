import { buildPalette } from "../../util/palette";

export class Plasma {
  private width: number;
  private height: number;
  private imageData: ImageData;
  private palette: { r: number; g: number; b: number }[];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.imageData = new ImageData(width, height);
    this.palette = buildPalette();
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.imageData = new ImageData(width, height);
  }

  render(time: number, intensity: number) {
    const data = this.imageData.data;
    const w = this.width;
    const h = this.height;
    let index = 0;
    const t = time * 0.8;
    const warp = 0.8 + intensity * 0.6;

    for (let y = 0; y < h; y++) {
      const ny = y / h;
      for (let x = 0; x < w; x++) {
        const nx = x / w;
        const v =
          Math.sin((nx * 4 + t) * warp) +
          Math.sin((ny * 4 - t * 1.2) * warp) +
          Math.sin((nx + ny + t * 0.6) * 4);
        const value = Math.floor(((v + 3) / 6) * 255);
        const color = this.palette[(value + Math.floor(time * 30)) % 256];
        data[index++] = color.r;
        data[index++] = color.g;
        data[index++] = color.b;
        data[index++] = 255;
      }
    }
    return this.imageData;
  }
}
