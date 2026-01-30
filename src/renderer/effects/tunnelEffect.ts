import { Effect, EffectRenderContext } from "./types";
import { PixelBuffer } from "./pixelBuffer";
import { tunnelValue } from "./tunnel";
import { buildPalette } from "../../util/palette";
import { clamp } from "../../util/math";

export class TunnelEffect implements Effect {
  private buffer: PixelBuffer;
  private palette = buildPalette();

  constructor(private width = 320, private height = 180) {
    this.buffer = new PixelBuffer(width, height);
  }

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const data = this.buffer.imageData.data;
    const t = time * (params.speed ?? 1.1);
    const glow = clamp(0.3 + audio.mid * 0.9, 0, 1);

    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const idx = (y * this.width + x) * 4;
        const value = tunnelValue(x, y, t);
        const paletteIndex = Math.floor(value * 255);
        const color = this.palette[paletteIndex];
        data[idx] = Math.min(255, (color & 255) * (0.6 + glow));
        data[idx + 1] = Math.min(255, ((color >> 8) & 255) * (0.5 + glow));
        data[idx + 2] = Math.min(255, ((color >> 16) & 255) * (0.8 + glow));
        data[idx + 3] = 255;
      }
    }

    this.buffer.commit();
    ctx.drawImage(this.buffer.canvas, 0, 0, width, height);
  }
}
