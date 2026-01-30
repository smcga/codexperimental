import { clamp } from "../../util/math";
import type { EffectRenderContext } from "./types";

export class CheckerEffect {
  render({ ctx, width, height, time, features, params }: EffectRenderContext): void {
    ctx.clearRect(0, 0, width, height);
    const scale = params.scale ?? 1;
    const speed = params.speed ?? 1;
    const size = 20 * scale;
    const shiftX = Math.sin(time * speed) * 30;
    const shiftY = Math.cos(time * speed * 0.8) * 30;

    for (let y = -size; y < height + size; y += size) {
      for (let x = -size; x < width + size; x += size) {
        const even = ((Math.floor((x + shiftX) / size) + Math.floor((y + shiftY) / size)) & 1) === 0;
        const brightness = clamp(0.2 + features.bass * 0.7, 0.2, 1);
        ctx.fillStyle = even
          ? `rgba(250, 240, 210, ${brightness})`
          : `rgba(20, 30, 50, 0.9)`;
        ctx.fillRect(x + shiftX, y + shiftY, size, size);
      }
    }
  }
}
