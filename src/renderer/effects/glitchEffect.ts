import { clamp } from "../../util/math";
import type { Effect, EffectRenderArgs } from "./types";

export class GlitchEffect implements Effect {
  render({ ctx, width, height, time, features, params }: EffectRenderArgs): void {
    const slices = typeof params?.sliceCount === "number" ? params.sliceCount : 8;
    ctx.fillStyle = "#05050a";
    ctx.fillRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "rgba(40, 120, 200, 0.6)");
    gradient.addColorStop(1, "rgba(200, 80, 180, 0.6)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = `rgba(255, 255, 255, ${0.05 + features.treble * 0.2})`;
    for (let i = 0; i < 20; i += 1) {
      ctx.fillRect(
        Math.random() * width,
        Math.random() * height,
        40 + Math.random() * 120,
        2 + Math.random() * 6
      );
    }
    ctx.restore();

    const glitchAmount = clamp(features.treble + features.beatStrength * 0.5, 0, 1);
    for (let i = 0; i < slices; i += 1) {
      const sliceHeight = 6 + Math.random() * 16;
      const y = Math.random() * (height - sliceHeight);
      const offset = (Math.random() - 0.5) * width * 0.08 * glitchAmount;
      ctx.drawImage(ctx.canvas, 0, y, width, sliceHeight, offset, y, width, sliceHeight);
    }

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.translate(Math.sin(time * 2) * 4, Math.cos(time * 3) * 4);
    ctx.drawImage(ctx.canvas, 2, -2);
    ctx.restore();
  }
}
