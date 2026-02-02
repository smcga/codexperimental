import { Effect, EffectRenderContext } from "./types";
import { clamp } from "../../util/math";

function pseudoRandom(seed: number): number {
  return Math.abs(Math.sin(seed) * 43758.5453123) % 1;
}

export class BokehEffect implements Effect {
  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    ctx.fillStyle = "rgba(4, 4, 12, 0.4)";
    ctx.fillRect(0, 0, width, height);

    const count = clamp(Math.round(params.count ?? 40), 10, 120);
    const speed = Math.max(0, params.speed ?? 0.7);
    const radiusBase = clamp(params.radius ?? 30, 4, 80);
    const alphaBase = clamp(params.alpha ?? 0.15, 0.05, 0.8);
    const hueShift = params.hueShift ?? 0;
    for (let i = 0; i < count; i += 1) {
      const seed = time * speed + i * 12.3;
      const x = pseudoRandom(seed) * width;
      const y = pseudoRandom(seed + 4.2) * height;
      const radius = 6 + pseudoRandom(seed + 8.7) * radiusBase + audio.bass * 20;
      const alpha = alphaBase + pseudoRandom(seed + 2.1) * 0.35;
      const hue = (pseudoRandom(seed + 6.5) * 360 + audio.treble * 120 + hueShift) % 360;
      ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
