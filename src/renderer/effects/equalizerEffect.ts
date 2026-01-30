import { Effect, EffectRenderContext } from "./types";

export class EqualizerEffect implements Effect {
  render({ ctx, width, height, audio }: EffectRenderContext): void {
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fillRect(0, 0, width, height);

    const bars = 48;
    const barWidth = width / bars;
    ctx.fillStyle = "rgba(100, 220, 255, 0.8)";
    for (let i = 0; i < bars; i += 1) {
      const value = audio.frequency[i] / 255;
      const barHeight = value * height * 0.8 + audio.bass * 10;
      const x = i * barWidth;
      ctx.fillRect(x, height - barHeight, barWidth * 0.8, barHeight);
    }
  }
}
