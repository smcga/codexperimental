import { Effect, EffectRenderContext } from "./types";
import { clamp } from "../../util/math";

export class LissajousEffect implements Effect {
  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.globalCompositeOperation = "lighter";
    ctx.beginPath();

    const points = clamp(Math.round(params.points ?? 320), 80, 800);
    const speed = Math.max(0, params.speed ?? 1);
    const aBase = params.a ?? 3;
    const bBase = params.b ?? 2;
    const radius = Math.min(width, height) * clamp(params.radius ?? 0.35, 0.1, 0.5);
    const lineWidth = Math.max(0.5, params.lineWidth ?? 1.5);
    const a = aBase + Math.sin(time * 0.2 * speed) * 2;
    const b = bBase + Math.cos(time * 0.25 * speed) * 2;

    for (let i = 0; i <= points; i += 1) {
      const t = (i / points) * Math.PI * 2;
      const x = Math.sin(t * a + time * 0.6 * speed) * radius;
      const y = Math.sin(t * b + time * 0.4 * speed) * radius;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle = `rgba(120, 240, 255, ${0.5 + audio.treble * 0.5})`;
    ctx.lineWidth = lineWidth + audio.rms * 3;
    ctx.stroke();
    ctx.restore();
  }
}
