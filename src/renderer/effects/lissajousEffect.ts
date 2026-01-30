import { Effect, EffectRenderContext } from "./types";

export class LissajousEffect implements Effect {
  render({ ctx, width, height, time, audio }: EffectRenderContext): void {
    ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.globalCompositeOperation = "lighter";
    ctx.beginPath();

    const points = 320;
    const a = 3 + Math.sin(time * 0.2) * 2;
    const b = 2 + Math.cos(time * 0.25) * 2;
    const radius = Math.min(width, height) * 0.35;

    for (let i = 0; i <= points; i += 1) {
      const t = (i / points) * Math.PI * 2;
      const x = Math.sin(t * a + time * 0.6) * radius;
      const y = Math.sin(t * b + time * 0.4) * radius;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle = `rgba(120, 240, 255, ${0.5 + audio.treble * 0.5})`;
    ctx.lineWidth = 1.5 + audio.rms * 3;
    ctx.stroke();
    ctx.restore();
  }
}
