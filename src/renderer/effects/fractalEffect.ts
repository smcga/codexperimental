import { Effect, EffectRenderContext } from "./types";
import { clamp } from "../../util/math";

export class FractalEffect implements Effect {
  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.globalCompositeOperation = "lighter";

    let x = 0.1;
    let y = 0.1;
    const baseIterations = clamp(Math.round(params.iterations ?? 600), 200, 1400);
    const trebleBoost = Math.max(0, params.trebleBoost ?? 400);
    const speed = Math.max(0, params.speed ?? 1);
    const scale = clamp(params.scale ?? 0.25, 0.1, 0.4);
    const alpha = clamp(params.alpha ?? 0.1, 0.05, 0.8);
    const iterations = baseIterations + Math.floor(audio.treble * trebleBoost);
    for (let i = 0; i < iterations; i += 1) {
      const nx = Math.sin(y * 2.3 + time * 0.2 * speed) * 0.6 + Math.cos(x * 3.1) * 0.4;
      const ny = Math.sin(x * 1.9 + time * 0.3 * speed) * 0.6 - Math.cos(y * 2.7) * 0.4;
      x = nx;
      y = ny;
      const px = x * width * scale;
      const py = y * height * scale;
      ctx.fillStyle = `rgba(100, 220, 255, ${alpha + audio.rms * 0.6})`;
      ctx.fillRect(px, py, 1.2, 1.2);
    }

    ctx.restore();
  }
}
