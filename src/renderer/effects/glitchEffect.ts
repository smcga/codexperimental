import { Effect, EffectRenderContext } from "./types";
import { clamp } from "../../util/math";

export class GlitchEffect implements Effect {
  render({ ctx, width, height, time, audio }: EffectRenderContext): void {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#050015");
    gradient.addColorStop(1, "#220020");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = `rgba(120, 200, 255, ${0.05 + audio.treble * 0.2})`;
    for (let i = 0; i < 60; i += 1) {
      const x = (Math.sin(time * 1.4 + i) * 0.5 + 0.5) * width;
      const y = (Math.cos(time * 1.1 + i) * 0.5 + 0.5) * height;
      ctx.fillRect(x, y, 2 + audio.treble * 4, 1 + audio.bass * 4);
    }

    const glitchSlices = Math.floor(3 + audio.treble * 10);
    for (let i = 0; i < glitchSlices; i += 1) {
      const sliceHeight = 4 + Math.random() * 18;
      const y = Math.random() * (height - sliceHeight);
      const offset = (Math.random() - 0.5) * width * 0.08 * (0.3 + audio.treble);
      ctx.drawImage(ctx.canvas, 0, y, width, sliceHeight, offset, y, width, sliceHeight);
    }

    const shake = clamp(audio.beatStrength * 4, 0, 5);
    if (shake > 0.1) {
      ctx.drawImage(ctx.canvas, shake, -shake, width, height);
    }
  }
}
