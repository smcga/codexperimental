import { Effect, EffectRenderContext } from "./types";
import { clamp } from "../../util/math";

export class BlobsEffect implements Effect {
  render({ ctx, width, height, time, audio }: EffectRenderContext): void {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(10, 8, 20, 1)";
    ctx.fillRect(0, 0, width, height);

    const count = 6;
    const baseRadius = Math.min(width, height) * 0.12;
    ctx.globalCompositeOperation = "lighter";

    for (let i = 0; i < count; i += 1) {
      const angle = time * 0.6 + i * 1.3;
      const radius = baseRadius * (1 + audio.bass * 0.8);
      const x = width / 2 + Math.cos(angle * 1.3) * width * 0.25;
      const y = height / 2 + Math.sin(angle * 0.9) * height * 0.25;
      const gradient = ctx.createRadialGradient(x, y, radius * 0.1, x, y, radius * 1.3);
      const alpha = clamp(0.5 + audio.rms * 0.8, 0, 1);
      gradient.addColorStop(0, `rgba(120, 200, 255, ${alpha})`);
      gradient.addColorStop(1, "rgba(20, 10, 40, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = "source-over";
  }
}
