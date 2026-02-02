import { Effect, EffectRenderContext } from "./types";
import { clamp } from "../../util/math";

export class EqualizerEffect implements Effect {
  render({ ctx, width, height, audio, params }: EffectRenderContext): void {
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fillRect(0, 0, width, height);

    const maxBars = audio.frequency.length;
    const bars = clamp(Math.round(params.bars ?? 48), 8, maxBars);
    const barWidth = width / bars;
    const barWidthScale = clamp(params.barWidth ?? 0.8, 0.2, 1);
    const heightScale = clamp(params.height ?? 0.8, 0.2, 1);
    const bassBoost = clamp(params.bassBoost ?? 10, 0, 60);
    const alpha = clamp(params.alpha ?? 0.8, 0.1, 1);
    ctx.fillStyle = `rgba(100, 220, 255, ${alpha})`;
    for (let i = 0; i < bars; i += 1) {
      const value = audio.frequency[i] / 255;
      const barHeight = value * height * heightScale + audio.bass * bassBoost;
      const x = i * barWidth;
      ctx.fillRect(x, height - barHeight, barWidth * barWidthScale, barHeight);
    }
  }
}
