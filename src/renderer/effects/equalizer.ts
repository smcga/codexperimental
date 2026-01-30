import { EffectDefinition } from "./types";

export class EqualizerEffect implements EffectDefinition {
  name = "equalizer";

  render({ ctx, width, height, audio }: Parameters<EffectDefinition["render"]>[0]): void {
    ctx.save();
    ctx.fillStyle = "#020208";
    ctx.fillRect(0, 0, width, height);

    const bars = 48;
    const barWidth = width / bars;
    ctx.globalCompositeOperation = "lighter";

    for (let i = 0; i < bars; i += 1) {
      const freqIndex = Math.floor((i / bars) * audio.frequency.length);
      const value = audio.frequency[freqIndex] / 255;
      const barHeight = value * height * (0.5 + audio.bass * 0.5);
      const hue = 180 + value * 120;
      ctx.fillStyle = `hsla(${hue}, 90%, 60%, ${0.3 + audio.mid * 0.4})`;
      ctx.fillRect(i * barWidth, height - barHeight, barWidth * 0.8, barHeight);
    }

    ctx.restore();
  }
}
