import { clamp } from "../../util/math";
import type { EffectRenderContext } from "./types";

export class LissajousEffect {
  render({ ctx, width, height, time, features, params }: EffectRenderContext): void {
    ctx.fillStyle = "rgba(8, 8, 20, 0.3)";
    ctx.fillRect(0, 0, width, height);

    const loops = params.loops ?? 5;
    const glow = params.glow ?? 0.6;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.32;
    const points = 240;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(120, 240, 255, ${clamp(0.2 + glow + features.treble * 0.5, 0, 1)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= points; i += 1) {
      const angle = (i / points) * Math.PI * 2;
      const x = centerX + Math.sin(angle * loops + time * 0.6) * radius;
      const y = centerY + Math.cos(angle * (loops - 1) - time * 0.5) * radius;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.restore();
  }
}
