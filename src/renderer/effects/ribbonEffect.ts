import { Effect, EffectRenderContext } from "./types";
import { clamp } from "../../util/math";

export class RibbonEffect implements Effect {
  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    ctx.fillStyle = "rgba(5, 4, 10, 0.2)";
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "lighter";

    const ribbons = Math.max(1, Math.round(params.count ?? 5));
    const speed = Math.max(0, params.speed ?? 0.8);
    const amplitudeBase = Math.max(0.05, params.amplitude ?? 0.15);
    const audioBoost = Math.max(0, params.audioBoost ?? 0.2);
    const offset = clamp(params.offset ?? 0.3, 0, 0.8);
    const spacing = clamp(params.spacing ?? 0.08, 0, 0.3);
    const thickness = Math.max(0.5, params.thickness ?? 2);
    for (let i = 0; i < ribbons; i += 1) {
      const phase = time * speed + i * 1.1;
      const amplitude = height * (amplitudeBase + audio.mid * audioBoost);
      const yOffset = height * (offset + i * spacing);

      ctx.beginPath();
      for (let x = 0; x <= width; x += 6) {
        const y = yOffset + Math.sin(phase + x * 0.02) * amplitude;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.strokeStyle = `rgba(120, 180, 255, ${0.3 + audio.bass * 0.7})`;
      ctx.lineWidth = thickness + audio.treble * 2;
      ctx.stroke();
    }

    ctx.globalCompositeOperation = "source-over";
  }
}
