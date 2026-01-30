import { EffectDefinition } from "./types";

export class SpiralRingsEffect implements EffectDefinition {
  name = "spiral";

  render({ ctx, width, height, time, audio }: Parameters<EffectDefinition["render"]>[0]): void {
    ctx.save();
    ctx.fillStyle = "#03010d";
    ctx.fillRect(0, 0, width, height);
    ctx.translate(width / 2, height / 2);

    const rings = 60;
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < rings; i += 1) {
      const progress = i / rings;
      const radius = progress * Math.min(width, height) * 0.5;
      const angle = time * 0.8 + progress * 6;
      const x = Math.cos(angle) * radius * 0.3;
      const y = Math.sin(angle) * radius * 0.3;
      ctx.strokeStyle = `rgba(120, 200, 255, ${0.3 + audio.treble * 0.4})`;
      ctx.lineWidth = 1 + audio.bass * 1.5;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
