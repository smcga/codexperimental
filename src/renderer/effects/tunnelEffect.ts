import { buildPalette } from "../../util/palette";
import { clamp } from "../../util/math";
import { tunnelValue } from "./tunnel";
import type { EffectRenderContext } from "./types";

export class TunnelEffect {
  private palette = buildPalette();
  private buffer: HTMLCanvasElement;
  private bufferCtx: CanvasRenderingContext2D;
  private imageData: ImageData;

  constructor(private width = 320, private height = 180) {
    this.buffer = document.createElement("canvas");
    this.buffer.width = width;
    this.buffer.height = height;
    const ctx = this.buffer.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to create tunnel buffer");
    }
    this.bufferCtx = ctx;
    this.imageData = ctx.createImageData(width, height);
  }

  render({ ctx, width, height, time, features, params }: EffectRenderContext): void {
    const data = this.imageData.data;
    const speed = params.depth ?? 1;
    const twist = params.twist ?? 0.4;
    const t = time * (1.2 + speed) + features.bass * 1.8;

    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const idx = (y * this.width + x) * 4;
        const value = tunnelValue(x, y, t + twist * Math.sin(time * 0.4));
        const paletteIndex = Math.floor(clamp(value + features.mid * 0.3, 0, 1) * 255);
        const color = this.palette[paletteIndex];
        data[idx] = color & 255;
        data[idx + 1] = (color >> 8) & 255;
        data[idx + 2] = (color >> 16) & 255;
        data[idx + 3] = 255;
      }
    }

    this.bufferCtx.putImageData(this.imageData, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.buffer, 0, 0, width, height);
  }
}
