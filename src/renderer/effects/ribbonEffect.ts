import { Effect, EffectRenderContext } from "./types";

export class RibbonEffect implements Effect {
  render({ ctx, width, height, time, audio }: EffectRenderContext): void {
    ctx.fillStyle = "rgba(5, 4, 10, 0.2)";
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "lighter";

    const ribbons = 5;
    for (let i = 0; i < ribbons; i += 1) {
      const phase = time * 0.8 + i * 1.1;
      const amplitude = height * (0.15 + audio.mid * 0.2);
      const yOffset = height * (0.3 + i * 0.08);

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
      ctx.lineWidth = 2 + audio.treble * 2;
      ctx.stroke();
    }

    ctx.globalCompositeOperation = "source-over";
  }
}
