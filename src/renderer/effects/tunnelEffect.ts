import { clamp, lerp } from "../../util/math";
import type { Effect, EffectRenderArgs } from "./types";

export class TunnelEffect implements Effect {
  render({ ctx, width, height, time, features, params }: EffectRenderArgs): void {
    const centerX = width / 2;
    const centerY = height / 2;
    const twist = typeof params?.twist === "number" ? params.twist : 0.5;
    const rings = 60;
    const maxRadius = Math.min(width, height) * 0.6;

    ctx.fillStyle = "#03040a";
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < rings; i += 1) {
      const progress = i / rings;
      const radius = lerp(20, maxRadius, progress) * (1 + features.bass * 0.15);
      const angle = time * (0.6 + twist) + progress * Math.PI * 6;
      const alpha = clamp(1 - progress + features.mid * 0.4, 0, 1);
      ctx.strokeStyle = `rgba(80, 200, 255, ${alpha * 0.7})`;
      ctx.lineWidth = 2 - progress * 1.2;
      ctx.beginPath();
      ctx.ellipse(
        centerX + Math.cos(angle) * 20 * (1 - progress),
        centerY + Math.sin(angle) * 14 * (1 - progress),
        radius,
        radius * 0.6,
        angle,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
  }
}
