import { clamp } from "../../util/math";
import type { Effect, EffectRenderArgs } from "./types";

export class VortexEffect implements Effect {
  render({ ctx, width, height, time, features, params }: EffectRenderArgs): void {
    const arms = typeof params?.arms === "number" ? params.arms : 5;
    const maxRadius = Math.min(width, height) * 0.45;

    ctx.fillStyle = "#020208";
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.globalCompositeOperation = "lighter";
    for (let arm = 0; arm < arms; arm += 1) {
      const hue = 200 + arm * 30 + features.treble * 80;
      ctx.strokeStyle = `hsla(${hue}, 90%, 60%, ${0.4 + features.mid * 0.5})`;
      ctx.lineWidth = 2 + features.bass * 2;
      ctx.beginPath();
      for (let i = 0; i < 200; i += 1) {
        const t = i / 200;
        const angle = t * Math.PI * 6 + time * 0.6 + (arm / arms) * Math.PI * 2;
        const radius = maxRadius * t;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius * (0.6 + clamp(features.bass, 0, 1) * 0.2);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
    ctx.restore();
  }
}
