import { buildPalette } from "../../util/palette";
import { clamp, lerp } from "../../util/math";
import { EffectDefinition } from "./types";

export class PlasmaEffect implements EffectDefinition {
  name = "plasma";
  private palette = buildPalette();
  private buffer: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private imageData: ImageData;

  constructor(private width = 220, private height = 124) {
    this.buffer = document.createElement("canvas");
    this.buffer.width = width;
    this.buffer.height = height;
    const ctx = this.buffer.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to create plasma buffer.");
    }
    this.ctx = ctx;
    this.imageData = ctx.createImageData(width, height);
  }

  render({ ctx, width, height, time, audio, params }: Parameters<EffectDefinition["render"]>[0]): void {
    const data = this.imageData.data;
    const t = time * (params.speed ?? 0.6);
    const scale = params.scale ?? 1.2;

    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const idx = (y * this.width + x) * 4;
        const nx = (x / this.width - 0.5) * scale;
        const ny = (y / this.height - 0.5) * scale;
        const v =
          Math.sin(nx * 4 + t) +
          Math.sin(ny * 6 - t * 1.2) +
          Math.sin((nx + ny) * 4 + t * 0.7);
        const value = clamp((v / 3 + 1) / 2, 0, 1);
        const paletteIndex = Math.floor(value * 255);
        const color = this.palette[paletteIndex];
        const energy = lerp(0.7, 1.3, audio.bass + audio.beatStrength * 0.6);
        data[idx] = ((color & 255) * energy) | 0;
        data[idx + 1] = (((color >> 8) & 255) * energy) | 0;
        data[idx + 2] = (((color >> 16) & 255) * energy) | 0;
        data[idx + 3] = 255;
      }
    }

    this.ctx.putImageData(this.imageData, 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.buffer, 0, 0, width, height);
    ctx.restore();
  }
}
