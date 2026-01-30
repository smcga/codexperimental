import type { Effect, EffectRenderArgs } from "./types";

export class EqualizerEffect implements Effect {
  render({ ctx, width, height, features }: EffectRenderArgs): void {
    ctx.fillStyle = "#05060c";
    ctx.fillRect(0, 0, width, height);

    const barCount = 48;
    const barWidth = width / barCount;
    ctx.save();
    ctx.translate(0, height * 0.8);
    for (let i = 0; i < barCount; i += 1) {
      const value = features.frequency[i] / 255;
      const barHeight = value * height * 0.6;
      ctx.fillStyle = `rgba(100, 220, 255, ${0.3 + value * 0.7})`;
      ctx.fillRect(i * barWidth + 1, -barHeight, barWidth - 2, barHeight);
    }
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "rgba(255, 200, 120, 0.6)";
    ctx.beginPath();
    features.timeDomain.forEach((value, index) => {
      const x = (index / features.timeDomain.length) * width;
      const y = height * 0.25 + ((value - 128) / 128) * height * 0.2;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    ctx.restore();
  }
}
