import { clamp, randRange } from "../../util/math";
import type { EffectRenderContext } from "./types";

export class GlitchEffect {
  render({ ctx, width, height, time, features, params }: EffectRenderContext): void {
    ctx.clearRect(0, 0, width, height);
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#10203a");
    gradient.addColorStop(1, "#200a28");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const lineCount = 60;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    for (let i = 0; i < lineCount; i += 1) {
      const y = (i / lineCount) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const intensity = clamp((params.intensity ?? 0.6) + features.treble * 0.8, 0, 1);
    const slices = 8 + Math.floor(intensity * 10);
    for (let i = 0; i < slices; i += 1) {
      const sliceHeight = randRange(6, 20);
      const y = randRange(0, height - sliceHeight);
      const offset = randRange(-20, 20) * intensity;
      ctx.drawImage(ctx.canvas, 0, y, width, sliceHeight, offset, y, width, sliceHeight);
    }

    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = `rgba(120, 240, 255, ${0.2 + Math.sin(time * 6) * 0.1})`;
    ctx.fillRect(0, height * 0.5, width, height * 0.03);
    ctx.globalCompositeOperation = "source-over";
  }
}
