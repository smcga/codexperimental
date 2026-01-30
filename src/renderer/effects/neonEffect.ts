import { randRange } from "../../util/math";
import type { EffectRenderContext } from "./types";

type NeonShape = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  angle: number;
};

export class NeonEffect {
  private shapes: NeonShape[] = [];

  render({ ctx, width, height, delta, time, features, params }: EffectRenderContext): void {
    const count = Math.max(4, Math.floor(params.count ?? 6));
    if (this.shapes.length === 0) {
      for (let i = 0; i < count; i += 1) {
        this.shapes.push({
          x: randRange(width * 0.2, width * 0.8),
          y: randRange(height * 0.2, height * 0.8),
          radius: randRange(30, 70),
          speed: randRange(0.3, 1.0),
          angle: randRange(0, Math.PI * 2)
        });
      }
    }

    ctx.fillStyle = "rgba(5, 4, 12, 0.3)";
    ctx.fillRect(0, 0, width, height);

    const pulse = params.pulse ?? 0.8;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    this.shapes.forEach((shape, index) => {
      shape.angle += delta * shape.speed;
      const offsetX = Math.cos(shape.angle) * 12;
      const offsetY = Math.sin(shape.angle) * 12;
      const hue = 300 + index * 30 + Math.sin(time) * 20;
      ctx.strokeStyle = `hsla(${hue}, 90%, 60%, ${0.6 + features.treble * 0.3})`;
      ctx.lineWidth = 2 + pulse * 4 + features.bass * 2;
      ctx.beginPath();
      ctx.arc(shape.x + offsetX, shape.y + offsetY, shape.radius, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.restore();
  }

  reset(): void {
    this.shapes = [];
  }
}
