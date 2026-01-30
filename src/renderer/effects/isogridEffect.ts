import { clamp } from "../../util/math";
import type { EffectRenderContext } from "./types";

export class IsoGridEffect {
  render({ ctx, width, height, time, features, params }: EffectRenderContext): void {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#060814";
    ctx.fillRect(0, 0, width, height);

    const grid = Math.max(10, Math.floor(params.grid ?? 18));
    const wave = params.wave ?? 0.7;
    const spacing = width / grid;

    ctx.save();
    ctx.translate(width / 2, height * 0.7);
    ctx.strokeStyle = `rgba(80, 200, 255, ${0.3 + features.treble * 0.4})`;

    for (let i = -grid; i <= grid; i += 1) {
      ctx.beginPath();
      for (let j = 0; j <= grid; j += 1) {
        const x = (i - j) * spacing * 0.5;
        const y = (i + j) * spacing * 0.25;
        const z = Math.sin(time * 1.2 + j * 0.5 + i * 0.4) * spacing * wave;
        ctx.lineTo(x, -y + z * (0.3 + features.bass));
      }
      ctx.stroke();
    }

    ctx.strokeStyle = `rgba(120, 255, 200, ${clamp(0.2 + features.mid * 0.5, 0, 1)})`;
    for (let i = -grid; i <= grid; i += 1) {
      ctx.beginPath();
      for (let j = 0; j <= grid; j += 1) {
        const x = (j - i) * spacing * 0.5;
        const y = (i + j) * spacing * 0.25;
        const z = Math.cos(time * 1.1 + j * 0.5 + i * 0.3) * spacing * wave;
        ctx.lineTo(x, -y + z * (0.3 + features.bass));
      }
      ctx.stroke();
    }

    ctx.restore();
  }
}
