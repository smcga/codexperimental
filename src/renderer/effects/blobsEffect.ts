import { Effect, EffectRenderContext } from "./types";
import { clamp } from "../../util/math";

export class BlobsEffect implements Effect {
  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(10, 8, 20, 1)";
    ctx.fillRect(0, 0, width, height);

    const count = clamp(Math.round(params.count ?? 6), 1, 12);
    const baseRadius = Math.min(width, height) * clamp(params.radius ?? 0.12, 0.05, 0.3);
    const orbit = clamp(params.orbit ?? 0.25, 0, 0.6);
    const speed = Math.max(0, params.speed ?? 0.6);
    const glow = clamp(params.glow ?? 0.8, 0, 1.5);
    ctx.globalCompositeOperation = "lighter";

    for (let i = 0; i < count; i += 1) {
      const angle = time * speed + i * 1.3;
      const radius = baseRadius * (1 + audio.bass * 0.8);
      const x = width / 2 + Math.cos(angle * 1.3) * width * orbit;
      const y = height / 2 + Math.sin(angle * 0.9) * height * orbit;
      const gradient = ctx.createRadialGradient(x, y, radius * 0.1, x, y, radius * 1.3);
      const alpha = clamp(0.5 + audio.rms * glow, 0, 1);
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
