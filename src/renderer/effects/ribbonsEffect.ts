import { lerp, randRange } from "../../util/math";
import type { Effect, EffectRenderArgs } from "./types";

type RibbonPoint = { x: number; y: number; vx: number; vy: number };

export class RibbonsEffect implements Effect {
  private ribbons: RibbonPoint[][] = [];

  constructor() {
    this.reset();
  }

  reset(): void {
    this.ribbons = Array.from({ length: 4 }, () =>
      Array.from({ length: 40 }, () => ({
        x: randRange(0.1, 0.9),
        y: randRange(0.1, 0.9),
        vx: randRange(-0.4, 0.4),
        vy: randRange(-0.4, 0.4)
      }))
    );
  }

  render({ ctx, width, height, delta, features, params }: EffectRenderArgs): void {
    const count = typeof params?.count === "number" ? params.count : this.ribbons.length;

    ctx.fillStyle = "rgba(4, 6, 16, 0.35)";
    ctx.fillRect(0, 0, width, height);

    for (let r = 0; r < count; r += 1) {
      const ribbon = this.ribbons[r % this.ribbons.length];
      const hue = 190 + r * 40 + features.treble * 80;
      ctx.strokeStyle = `hsla(${hue}, 80%, 60%, 0.7)`;
      ctx.lineWidth = 2 + features.bass * 2;
      ctx.beginPath();
      ribbon.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x * width, point.y * height);
        } else {
          ctx.lineTo(point.x * width, point.y * height);
        }
        point.x += point.vx * delta;
        point.y += point.vy * delta;
        point.vx += Math.sin(index * 0.2) * delta * 0.02 + features.mid * 0.03 * delta;
        point.vy += Math.cos(index * 0.2) * delta * 0.02 - features.mid * 0.03 * delta;
        if (point.x < 0 || point.x > 1) {
          point.vx *= -1;
        }
        if (point.y < 0 || point.y > 1) {
          point.vy *= -1;
        }
      });
      ctx.stroke();
    }

    const glow = lerp(0.1, 0.5, features.beatStrength);
    ctx.fillStyle = `rgba(100, 220, 255, ${glow})`;
    ctx.fillRect(0, 0, width, height);
  }
}
