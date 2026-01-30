import { Effect, EffectRenderContext } from "./types";

export class IsoGridEffect implements Effect {
  render({ ctx, width, height, time, audio }: EffectRenderContext): void {
    ctx.fillStyle = "rgba(5, 5, 20, 0.4)";
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, height * 0.6);
    ctx.strokeStyle = `rgba(120, 200, 255, ${0.2 + audio.mid * 0.6})`;
    ctx.lineWidth = 1;
    const spacing = 18;

    for (let y = -height; y < height; y += spacing) {
      ctx.beginPath();
      for (let x = -width; x < width; x += spacing) {
        const wave = Math.sin(time * 0.8 + (x + y) * 0.02) * 8 * (0.5 + audio.bass);
        const isoX = x - y;
        const isoY = (x + y) * 0.5 + wave;
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
