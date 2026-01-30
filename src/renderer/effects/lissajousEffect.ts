import { clamp } from "../../util/math";
import type { Effect, EffectRenderArgs } from "./types";

export class LissajousEffect implements Effect {
  render({ ctx, width, height, time, features, params }: EffectRenderArgs): void {
    const trails = typeof params?.trails === "number" ? params.trails : 0.2;
    ctx.fillStyle = `rgba(0, 0, 0, ${trails})`;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.globalCompositeOperation = "lighter";
    const a = 3 + Math.sin(time * 0.4) * 0.5;
    const b = 2 + Math.cos(time * 0.3) * 0.6;
    const delta = time * 0.8;

    ctx.strokeStyle = `rgba(120, 240, 255, ${0.4 + features.treble * 0.5})`;
    ctx.lineWidth = 2 + features.bass * 2;
    ctx.beginPath();
    const steps = 400;
    for (let i = 0; i <= steps; i += 1) {
      const t = (i / steps) * Math.PI * 2;
      const x = Math.sin(a * t + delta) * width * 0.25;
      const y = Math.sin(b * t) * height * 0.25;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    const pulse = clamp(features.beatStrength * 1.8, 0, 1);
    ctx.strokeStyle = `rgba(255, 200, 120, ${pulse})`;
    ctx.lineWidth = 1 + pulse * 3;
    ctx.stroke();
    ctx.restore();
  }
}
