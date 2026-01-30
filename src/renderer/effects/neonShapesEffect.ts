import { Effect, EffectRenderContext } from "./types";

export class NeonShapesEffect implements Effect {
  render({ ctx, width, height, time, audio }: EffectRenderContext): void {
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.globalCompositeOperation = "lighter";
    const shapes = 4;

    for (let i = 0; i < shapes; i += 1) {
      const radius = 30 + i * 24 + audio.bass * 25;
      const angle = time * 0.6 + i * 1.2;
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
      ctx.shadowBlur = 18;
      ctx.lineWidth = 2 + audio.rms * 2;
      ctx.stroke();
    }
    ctx.restore();
  }
}
