import { clamp } from "../../util/math";
import type { EffectRenderContext } from "./types";

export class EqualizerEffect {
  render({ ctx, width, height, features, params }: EffectRenderContext): void {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#05070d";
    ctx.fillRect(0, 0, width, height);

    const bars = Math.max(12, Math.floor(params.bars ?? 40));
    const barWidth = width / bars;
    const maxHeight = height * (params.height ?? 0.9);

    for (let i = 0; i < bars; i += 1) {
      const value = features.frequency[Math.floor((i / bars) * features.frequency.length)] / 255;
      const heightValue = clamp(value * maxHeight * (0.6 + features.bass), 4, maxHeight);
      const x = i * barWidth;
      const y = height - heightValue;
      const hue = 180 + value * 120;
      ctx.fillStyle = `hsla(${hue}, 90%, 60%, ${0.5 + value})`;
      ctx.fillRect(x + 1, y, barWidth - 2, heightValue);
    }
  }
}
