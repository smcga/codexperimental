import { Effect, EffectRenderContext } from "./types";
import { PixelBuffer } from "./pixelBuffer";
import { rotoValue } from "./rotozoom";
import { clamp } from "../../util/math";

export class RotozoomEffect implements Effect {
  private buffer: PixelBuffer;

  constructor(private width = 320, private height = 180) {
    this.buffer = new PixelBuffer(width, height);
  }

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const data = this.buffer.imageData.data;
    const t = time * (params.speed ?? 1.0);
    const glow = clamp(audio.treble + audio.rms * 0.5, 0, 1);

    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const idx = (y * this.width + x) * 4;
        const value = rotoValue(x, y, t);
        const colorA = value > 0.5 ? 40 + glow * 120 : 10;
        const colorB = value > 0.5 ? 200 : 40 + glow * 80;
        data[idx] = colorB;
        data[idx + 1] = 50 + glow * 80;
        data[idx + 2] = colorA;
        data[idx + 3] = 255;
      }
    }

    this.buffer.commit();
    ctx.drawImage(this.buffer.canvas, 0, 0, width, height);
  }
}
