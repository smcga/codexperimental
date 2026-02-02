import { Effect, EffectRenderContext } from "./types";
import { clamp } from "../../util/math";

export class GlitchEffect implements Effect {
  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#050015");
    gradient.addColorStop(1, "#220020");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = `rgba(120, 200, 255, ${0.05 + audio.treble * 0.2})`;
    const sparkles = clamp(Math.round(params.sparkles ?? 60), 10, 200);
    const sparkleSize = clamp(params.sparkleSize ?? 2, 1, 6);
    for (let i = 0; i < sparkles; i += 1) {
      const x = (Math.sin(time * 1.4 + i) * 0.5 + 0.5) * width;
      const y = (Math.cos(time * 1.1 + i) * 0.5 + 0.5) * height;
      ctx.fillRect(x, y, sparkleSize + audio.treble * 4, 1 + audio.bass * 4);
    }

    const sliceCount = Math.max(1, params.sliceCount ?? 3);
    const sliceBoost = Math.max(0, params.sliceBoost ?? 10);
    const glitchSlices = Math.floor(sliceCount + audio.treble * sliceBoost);
    const sliceHeight = Math.max(1, params.sliceHeight ?? 4);
    const sliceVariance = Math.max(0, params.sliceVariance ?? 18);
    const offsetAmount = clamp(params.offset ?? 0.08, 0, 0.3);
    for (let i = 0; i < glitchSlices; i += 1) {
      const sliceSize = sliceHeight + Math.random() * sliceVariance;
      const y = Math.random() * (height - sliceSize);
      const offset = (Math.random() - 0.5) * width * offsetAmount * (0.3 + audio.treble);
      ctx.drawImage(ctx.canvas, 0, y, width, sliceSize, offset, y, width, sliceSize);
    }

    const shakeAmount = Math.max(0, params.shake ?? 4);
    const maxShake = Math.max(0.5, params.maxShake ?? 5);
    const shake = clamp(audio.beatStrength * shakeAmount, 0, maxShake);
    if (shake > 0.1) {
      ctx.drawImage(ctx.canvas, shake, -shake, width, height);
    }
  }
}
