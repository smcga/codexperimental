import { Effect, EffectRenderContext } from "./types";

function pseudoRandom(seed: number): number {
  return Math.abs(Math.sin(seed) * 43758.5453123) % 1;
}

export class BokehEffect implements Effect {
  render({ ctx, width, height, time, audio }: EffectRenderContext): void {
    ctx.fillStyle = "rgba(4, 4, 12, 0.4)";
    ctx.fillRect(0, 0, width, height);

    const count = 40;
    for (let i = 0; i < count; i += 1) {
      const seed = time * 0.7 + i * 12.3;
      const x = pseudoRandom(seed) * width;
      const y = pseudoRandom(seed + 4.2) * height;
      const radius = 6 + pseudoRandom(seed + 8.7) * 30 + audio.bass * 20;
      const alpha = 0.15 + pseudoRandom(seed + 2.1) * 0.35;
      const hue = (pseudoRandom(seed + 6.5) * 360 + audio.treble * 120) % 360;
      ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
