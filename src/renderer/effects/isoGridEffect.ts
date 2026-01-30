import { lerp } from "../../util/math";
import type { Effect, EffectRenderArgs } from "./types";

export class IsoGridEffect implements Effect {
  render({ ctx, width, height, time, features, params }: EffectRenderArgs): void {
    const heightScale = typeof params?.height === "number" ? params.height : 0.5;
    ctx.fillStyle = "#050610";
    ctx.fillRect(0, 0, width, height);

    const gridSize = 14;
    const baseY = height * 0.65;
    ctx.strokeStyle = `rgba(80, 180, 255, ${0.3 + features.mid * 0.4})`;
    ctx.lineWidth = 1;

    for (let y = 0; y < 20; y += 1) {
      ctx.beginPath();
      for (let x = -10; x <= 20; x += 1) {
        const wave = Math.sin(time + x * 0.4 + y * 0.3) * heightScale * 10;
        const screenX = width / 2 + (x - y) * gridSize;
        const screenY = baseY + (x + y) * (gridSize * 0.5) + wave;
        if (x === -10) {
          ctx.moveTo(screenX, screenY);
        } else {
          ctx.lineTo(screenX, screenY);
        }
      }
      ctx.stroke();
    }

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = `rgba(120, 255, 180, ${lerp(0.1, 0.4, features.bass)})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}
