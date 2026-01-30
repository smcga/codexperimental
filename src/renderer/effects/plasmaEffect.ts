import { clamp, lerp } from "../../util/math";
import { buildPalette } from "../../util/palette";
import type { Effect, EffectRenderArgs } from "./types";

export class PlasmaEffect implements Effect {
  private palette = buildPalette();
  private canvas = document.createElement("canvas");
  private ctx: CanvasRenderingContext2D;
  private imageData: ImageData;

  constructor(private baseWidth = 200, private baseHeight = 112) {
    this.canvas.width = baseWidth;
    this.canvas.height = baseHeight;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to create plasma canvas");
    }
    this.ctx = ctx;
    this.imageData = ctx.createImageData(baseWidth, baseHeight);
  }

  render({ ctx, width, height, time, features, params }: EffectRenderArgs): void {
    const scale = typeof params?.scale === "number" ? params.scale : 1;
    const data = this.imageData.data;
    const t = time * 0.9;
    const intensity = lerp(0.6, 1.4, features.bass + features.beatStrength * 0.4);

    for (let y = 0; y < this.baseHeight; y += 1) {
      for (let x = 0; x < this.baseWidth; x += 1) {
        const idx = (y * this.baseWidth + x) * 4;
        const nx = (x / this.baseWidth - 0.5) * scale;
        const ny = (y / this.baseHeight - 0.5) * scale;
        const value =
          Math.sin(nx * 8 + t) +
          Math.sin(ny * 7 - t * 1.3) +
          Math.sin((nx + ny + t) * 6) +
          Math.cos(Math.sqrt(nx * nx + ny * ny) * 10 - t * 1.1);
        const normalized = clamp((value + 4) / 8, 0, 1);
        const paletteIndex = Math.floor(normalized * 255);
        const color = this.palette[paletteIndex];
        const brightness = lerp(0.7, 1.4, intensity + features.treble * 0.2);
        data[idx] = Math.min(255, (color & 255) * brightness);
        data[idx + 1] = Math.min(255, ((color >> 8) & 255) * brightness);
        data[idx + 2] = Math.min(255, ((color >> 16) & 255) * brightness);
        data[idx + 3] = 255;
      }
    }

    this.ctx.putImageData(this.imageData, 0, 0);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.canvas, 0, 0, width, height);
    ctx.restore();
  }
}
