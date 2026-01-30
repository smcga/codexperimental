import { randRange } from "../../util/math";
import { EffectDefinition } from "./types";

type Shape = { x: number; y: number; r: number; vx: number; vy: number };

export class NeonShapesEffect implements EffectDefinition {
  name = "neon";
  private shapes: Shape[] = [];

  reset(): void {
    this.shapes = [];
  }

  render({ ctx, width, height, delta, audio }: Parameters<EffectDefinition["render"]>[0]): void {
    if (this.shapes.length === 0) {
      this.shapes = Array.from({ length: 6 }, () => ({
        x: randRange(0, width),
        y: randRange(0, height),
        r: randRange(30, 80),
        vx: randRange(-0.5, 0.5),
        vy: randRange(-0.5, 0.5)
      }));
    }

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "lighter";

    this.shapes.forEach((shape, index) => {
      shape.x += shape.vx * delta * 60;
      shape.y += shape.vy * delta * 60;
      if (shape.x < 0 || shape.x > width) {
        shape.vx *= -1;
      }
      if (shape.y < 0 || shape.y > height) {
        shape.vy *= -1;
      }
      const hue = 280 + index * 20 + audio.treble * 80;
      ctx.strokeStyle = `hsla(${hue}, 90%, 60%, ${0.5 + audio.mid * 0.4})`;
      ctx.lineWidth = 2 + audio.bass * 2;
      ctx.beginPath();
      ctx.ellipse(shape.x, shape.y, shape.r, shape.r * 0.6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `hsla(${hue}, 90%, 75%, ${0.2 + audio.mid * 0.2})`;
      ctx.lineWidth = 6;
      ctx.stroke();
    });

    ctx.restore();
  }
}
