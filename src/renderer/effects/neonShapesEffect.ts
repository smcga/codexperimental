import { Effect, EffectRenderContext } from "./types";
import { clamp } from "../../util/math";

export class NeonShapesEffect implements Effect {
  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.globalCompositeOperation = "lighter";
    const shapes = clamp(Math.round(params.shapes ?? 4), 1, 8);
    const radiusBase = clamp(params.radius ?? 30, 10, 80);
    const radiusStep = clamp(params.radiusStep ?? 24, 5, 60);
    const speed = Math.max(0, params.speed ?? 0.6);
    const glow = clamp(params.glow ?? 18, 4, 40);
    const lineWidth = Math.max(0.5, params.lineWidth ?? 2);

    for (let i = 0; i < shapes; i += 1) {
      const radius = radiusBase + i * radiusStep + audio.bass * 25;
      const angle = time * speed + i * 1.2;
      ctx.beginPath();
      for (let p = 0; p <= 6; p += 1) {
        const theta = angle + (p / 6) * Math.PI * 2;
        const x = Math.cos(theta) * radius;
        const y = Math.sin(theta) * radius;
        if (p === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(120, 240, 255, ${0.4 + audio.treble * 0.5})`;
      ctx.shadowColor = "rgba(120, 240, 255, 0.8)";
      ctx.shadowBlur = glow;
      ctx.lineWidth = lineWidth + audio.rms * 2;
      ctx.stroke();
    }
    ctx.restore();
  }
}
