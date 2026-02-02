import { Effect, EffectRenderContext } from "./types";
import { clamp } from "../../util/math";

export class IsoGridEffect implements Effect {
  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    ctx.fillStyle = "rgba(5, 5, 20, 0.4)";
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, height * 0.6);
    const opacity = clamp(params.opacity ?? 0.2, 0.05, 0.8);
    const lineWidth = Math.max(0.5, params.lineWidth ?? 1);
    const spacing = clamp(params.spacing ?? 18, 8, 40);
    const wave = clamp(params.wave ?? 8, 0, 20);
    const speed = Math.max(0, params.speed ?? 0.8);
    ctx.strokeStyle = `rgba(120, 200, 255, ${opacity + audio.mid * 0.6})`;
    ctx.lineWidth = lineWidth;

    for (let y = -height; y < height; y += spacing) {
      ctx.beginPath();
      for (let x = -width; x < width; x += spacing) {
        const waveOffset = Math.sin(time * speed + (x + y) * 0.02) * wave * (0.5 + audio.bass);
        const isoX = x - y;
        const isoY = (x + y) * 0.5 + waveOffset;
        if (x === -width) {
          ctx.moveTo(isoX * 0.5, isoY * 0.5);
        } else {
          ctx.lineTo(isoX * 0.5, isoY * 0.5);
        }
      }
      ctx.stroke();
    }

    ctx.restore();
  }
}
