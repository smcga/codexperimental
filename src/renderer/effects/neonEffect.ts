import { randRange } from "../../util/math";
import type { Effect, EffectRenderArgs } from "./types";

type Shape = { x: number; y: number; radius: number; speed: number; hue: number };

export class NeonEffect implements Effect {
  private shapes: Shape[] = [];

  constructor() {
    this.reset();
  }

  reset(): void {
    this.shapes = Array.from({ length: 6 }, () => ({
      x: randRange(0.2, 0.8),
      y: randRange(0.2, 0.8),
      radius: randRange(40, 90),
      speed: randRange(0.3, 0.8),
      hue: randRange(180, 320)
    }));
  }

  render({ ctx, width, height, time, features, params }: EffectRenderArgs): void {
    const count = typeof params?.shapeCount === "number" ? params.shapeCount : this.shapes.length;
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < count; i += 1) {
      const shape = this.shapes[i % this.shapes.length];
      const x = width / 2 + Math.sin(time * shape.speed + i) * width * 0.2;
      const y = height / 2 + Math.cos(time * shape.speed * 0.8 + i) * height * 0.2;
      const radius = shape.radius * (1 + features.bass * 0.4);
      ctx.strokeStyle = `hsla(${shape.hue}, 90%, 60%, 0.8)`;
      ctx.lineWidth = 4 + features.mid * 3;
      ctx.shadowColor = `hsla(${shape.hue}, 100%, 70%, 0.8)`;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}
