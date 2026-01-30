import { lerp, randRange } from "../../util/math";
import type { Effect, EffectRenderArgs } from "./types";

type Dot = { x: number; y: number; radius: number; hue: number };

export class BokehEffect implements Effect {
  private dots: Dot[] = [];

  constructor() {
    this.reset();
  }

  reset(): void {
    this.dots = Array.from({ length: 140 }, () => ({
      x: randRange(0, 1),
      y: randRange(0, 1),
      radius: randRange(8, 42),
      hue: randRange(180, 320)
    }));
  }

  render({ ctx, width, height, time, features, params }: EffectRenderArgs): void {
    const count = typeof params?.dotCount === "number" ? params.dotCount : this.dots.length;
    ctx.fillStyle = "rgba(5, 7, 12, 0.6)";
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < count; i += 1) {
      const dot = this.dots[i % this.dots.length];
      const pulse = 1 + Math.sin(time * 0.6 + i) * 0.2 + features.bass * 0.4;
      const radius = dot.radius * pulse;
      const alpha = lerp(0.1, 0.6, features.mid);
      ctx.fillStyle = `hsla(${dot.hue}, 80%, 60%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(dot.x * width, dot.y * height, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
