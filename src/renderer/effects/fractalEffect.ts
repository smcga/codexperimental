import { Effect, EffectRenderContext } from "./types";

export class FractalEffect implements Effect {
  render({ ctx, width, height, time, audio }: EffectRenderContext): void {
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.globalCompositeOperation = "lighter";

    let x = 0.1;
    let y = 0.1;
    const iterations = 600 + Math.floor(audio.treble * 400);
    for (let i = 0; i < iterations; i += 1) {
      const nx = Math.sin(y * 2.3 + time * 0.2) * 0.6 + Math.cos(x * 3.1) * 0.4;
      const ny = Math.sin(x * 1.9 + time * 0.3) * 0.6 - Math.cos(y * 2.7) * 0.4;
      x = nx;
      y = ny;
      const px = x * width * 0.25;
      const py = y * height * 0.25;
      ctx.fillStyle = `rgba(100, 220, 255, ${0.1 + audio.rms * 0.6})`;
      ctx.fillRect(px, py, 1.2, 1.2);
    }

    ctx.restore();
  }
}
