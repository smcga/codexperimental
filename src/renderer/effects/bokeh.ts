import { randRange } from "../../util/math";
import { EffectDefinition } from "./types";

type Dot = { x: number; y: number; r: number; vx: number; vy: number };

export class BokehEffect implements EffectDefinition {
  name = "bokeh";
  private dots: Dot[] = [];

  reset(): void {
    this.dots = [];
  }

  render({ ctx, width, height, delta, audio }: Parameters<EffectDefinition["render"]>[0]): void {
    if (this.dots.length === 0) {
      this.dots = Array.from({ length: 40 }, () => ({
        x: randRange(0, width),
        y: randRange(0, height),
        r: randRange(20, 90),
        vx: randRange(-0.2, 0.2),
        vy: randRange(-0.15, 0.15)
      }));
    }

    ctx.save();
    ctx.fillStyle = "#05050d";
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "lighter";

    this.dots.forEach((dot, index) => {
      dot.x += dot.vx * delta * 60;
      dot.y += dot.vy * delta * 60;
      if (dot.x < -dot.r || dot.x > width + dot.r) {
        dot.x = randRange(0, width);
      }
      if (dot.y < -dot.r || dot.y > height + dot.r) {
        dot.y = randRange(0, height);
      }
      const hue = 180 + index * 4 + audio.bass * 90;
      ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${0.12 + audio.mid * 0.2})`;
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.r * (0.6 + audio.rms * 0.4), 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }
}
