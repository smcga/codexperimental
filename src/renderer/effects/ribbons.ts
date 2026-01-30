import { randRange } from "../../util/math";
import { EffectDefinition } from "./types";

type RibbonPoint = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

export class RibbonTrailsEffect implements EffectDefinition {
  name = "ribbons";
  private points: RibbonPoint[] = [];

  reset(): void {
    this.points = [];
  }

  render({ ctx, width, height, delta, time, audio }: Parameters<EffectDefinition["render"]>[0]): void {
    if (this.points.length === 0) {
      this.points = Array.from({ length: 3 }, (_, index) => ({
        x: width / 2,
        y: height / 2,
        vx: Math.cos(index * 2) * 1.5,
        vy: Math.sin(index * 2) * 1.2
      }));
    }

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.fillRect(0, 0, width, height);

    this.points.forEach((point, index) => {
      point.vx += Math.sin(time * 0.6 + index) * 0.02;
      point.vy += Math.cos(time * 0.5 + index) * 0.02;
      point.x += point.vx * delta * 60;
      point.y += point.vy * delta * 60;
      if (point.x < 0 || point.x > width) {
        point.vx *= -1;
      }
      if (point.y < 0 || point.y > height) {
        point.vy *= -1;
      }
    });

    ctx.globalCompositeOperation = "lighter";
    this.points.forEach((point, index) => {
      const hue = 200 + index * 40 + audio.treble * 80;
      ctx.strokeStyle = `hsla(${hue}, 90%, 60%, ${0.4 + audio.bass * 0.3})`;
      ctx.lineWidth = 2 + audio.beatStrength * 4;
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      for (let i = 0; i < 12; i += 1) {
        const offset = i * 14;
        ctx.lineTo(
          point.x + Math.sin(time * 1.2 + i + index) * offset * 0.4,
          point.y + Math.cos(time * 1.1 + i + index) * offset * 0.4
        );
      }
      ctx.stroke();
    });

    if (audio.beat) {
      const sparkCount = 12;
      for (let i = 0; i < sparkCount; i += 1) {
        ctx.fillStyle = `rgba(255, 220, 180, ${0.5 + Math.random() * 0.5})`;
        ctx.fillRect(randRange(0, width), randRange(0, height), 2, 2);
      }
    }

    ctx.restore();
  }
}
