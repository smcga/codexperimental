import { randRange } from "../../util/math";
import type { EffectRenderContext } from "./types";

type BokehDot = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  hue: number;
};

export class BokehEffect {
  private dots: BokehDot[] = [];

  render({ ctx, width, height, delta, features, params }: EffectRenderContext): void {
    const count = Math.max(12, Math.floor(params.count ?? 32));
    if (this.dots.length === 0) {
      for (let i = 0; i < count; i += 1) {
        this.dots.push({
          x: randRange(0, width),
          y: randRange(0, height),
          radius: randRange(12, 36),
          speed: randRange(10, 30),
          hue: randRange(180, 320)
        });
      }
    }

    ctx.fillStyle = "rgba(8, 6, 18, 0.35)";
    ctx.fillRect(0, 0, width, height);

    const drift = params.drift ?? 0.7;
    this.dots.forEach((dot) => {
      dot.y -= (dot.speed + features.bass * 20) * delta * drift;
      if (dot.y + dot.radius < 0) {
        dot.y = height + dot.radius;
      }
      const alpha = 0.3 + features.treble * 0.4;
      ctx.fillStyle = `hsla(${dot.hue}, 80%, 60%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  reset(): void {
    this.dots = [];
  }
}
