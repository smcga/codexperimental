import { clamp } from "../../util/math";
import type { EffectRenderContext } from "./types";

export class RotozoomEffect {
  render({ ctx, width, height, time, features, params }: EffectRenderContext): void {
    ctx.clearRect(0, 0, width, height);
    const centerX = width / 2;
    const centerY = height / 2;
    const spin = (params.spin ?? 0.6) + features.treble * 0.4;
    const zoom = (params.zoom ?? 1) + features.bass * 0.4;
    const angle = time * spin;
    const scale = 0.8 + Math.sin(time * 0.6) * 0.15 + zoom * 0.1;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -centerY);

    const size = 24;
    for (let y = -size; y < height + size; y += size) {
      for (let x = -size; x < width + size; x += size) {
        const even = ((x / size + y / size) & 1) === 0;
        const brightness = clamp(0.4 + features.bass * 0.6, 0.2, 1);
        ctx.fillStyle = even
          ? `rgba(40, 220, 255, ${brightness})`
          : `rgba(12, 20, 40, ${0.8})`;
        ctx.fillRect(x, y, size, size);
      }
    }

    ctx.restore();
  }
}
