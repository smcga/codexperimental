import { EffectDefinition } from "./types";

export class LissajousEffect implements EffectDefinition {
  name = "lissajous";

  render({ ctx, width, height, time, audio }: Parameters<EffectDefinition["render"]>[0]): void {
    ctx.save();
    ctx.fillStyle = "rgba(4, 0, 10, 0.25)";
    ctx.fillRect(0, 0, width, height);
    ctx.translate(width / 2, height / 2);
    ctx.globalCompositeOperation = "lighter";

    const scale = Math.min(width, height) * 0.35;
    const a = 3 + Math.sin(time * 0.2) * 2;
    const b = 2 + Math.cos(time * 0.3) * 2;
    const points = 260;

    ctx.beginPath();
    for (let i = 0; i <= points; i += 1) {
      const t = (i / points) * Math.PI * 2;
      const x = Math.sin(a * t + time) * scale;
      const y = Math.sin(b * t + time * 1.3) * scale;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.strokeStyle = `rgba(120, 255, 220, ${0.5 + audio.mid * 0.5})`;
    ctx.lineWidth = 1.5 + audio.treble * 2;
    ctx.stroke();

    ctx.restore();
  }
}
