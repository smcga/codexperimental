import { clamp } from "../../util/math";
import { EffectDefinition } from "./types";

export class TunnelEffect implements EffectDefinition {
  name = "tunnel";
  render({ ctx, width, height, time, audio, params }: Parameters<EffectDefinition["render"]>[0]): void {
    ctx.save();
    ctx.fillStyle = "#02010a";
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.hypot(centerX, centerY);
    const rings = 120;
    const speed = params.speed ?? 1.3;
    const wobble = params.wobble ?? 0.6;

    for (let i = 0; i < rings; i += 1) {
      const progress = i / rings;
      const depth = (progress + time * speed) % 1;
      const radius = clamp((1 - depth) * maxRadius, 1, maxRadius);
      const wave = Math.sin(depth * 10 + time * 2) * wobble * 20;
      const alpha = 1 - depth;
      ctx.strokeStyle = `rgba(120, 220, 255, ${alpha * (0.4 + audio.mid)})`;
      ctx.lineWidth = 2 + audio.bass * 3;
      ctx.beginPath();
      ctx.ellipse(centerX + wave, centerY + wave * 0.5, radius, radius * 0.8, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
