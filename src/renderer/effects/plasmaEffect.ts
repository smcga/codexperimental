import { Effect, EffectRenderContext } from "./types";
import { PixelBuffer } from "./pixelBuffer";
import { plasmaValue } from "./plasma";
import { buildPalette } from "../../util/palette";
import { clamp, lerp } from "../../util/math";

export class PlasmaEffect implements Effect {
  private buffer: PixelBuffer;
  private palette = buildPalette();

  constructor(private width = 320, private height = 180) {
    this.buffer = new PixelBuffer(width, height);
  }

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const data = this.buffer.imageData.data;
    const speed = params.speed ?? 1.0;
    const paletteShift = audio.bass * 80;
    const t = time * 0.9 * speed;

    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const idx = (y * this.width + x) * 4;
        const value = plasmaValue(x, y, t);
        const paletteIndex = (Math.floor(value * 255 + paletteShift) + 256) % 256;
        const color = this.palette[paletteIndex];
        const brightness = lerp(0.7, 1.3, clamp(audio.rms + audio.bass * 0.6, 0, 1));
        data[idx] = Math.min(255, (color & 255) * brightness);
        data[idx + 1] = Math.min(255, ((color >> 8) & 255) * brightness);
        data[idx + 2] = Math.min(255, ((color >> 16) & 255) * brightness);
        data[idx + 3] = 255;
      }
    }

    this.buffer.commit();
    ctx.drawImage(this.buffer.canvas, 0, 0, width, height);
  }
}
