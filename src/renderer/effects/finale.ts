import { randRange } from "../../util/math";
import { EffectDefinition } from "./types";

type Spark = { x: number; y: number; vx: number; vy: number; life: number; ttl: number };

export class FinaleEffect implements EffectDefinition {
  name = "finale";
  private sparks: Spark[] = [];

  reset(): void {
    this.sparks = [];
  }

  render({ ctx, width, height, delta, time, audio }: Parameters<EffectDefinition["render"]>[0]): void {
    ctx.save();
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.1,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.7
    );
    gradient.addColorStop(0, "rgba(40, 0, 80, 0.8)");
    gradient.addColorStop(1, "rgba(0, 0, 10, 0.9)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    if (audio.beat) {
      for (let i = 0; i < 24; i += 1) {
        const angle = randRange(0, Math.PI * 2);
        const speed = randRange(1, 4) * (1 + audio.beatStrength);
        this.sparks.push({
          x: width / 2,
          y: height / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          ttl: randRange(0.6, 1.4)
        });
      }
    }

    this.sparks.forEach((spark) => {
      spark.life += delta;
      spark.x += spark.vx * delta * 60;
      spark.y += spark.vy * delta * 60;
    });
    this.sparks = this.sparks.filter((spark) => spark.life < spark.ttl);

    ctx.globalCompositeOperation = "lighter";
    this.sparks.forEach((spark) => {
      const life = 1 - spark.life / spark.ttl;
      ctx.fillStyle = `rgba(255, 200, 120, ${life})`;
      ctx.fillRect(spark.x, spark.y, 2 + life * 3, 2 + life * 3);
    });

    ctx.strokeStyle = `rgba(120, 220, 255, ${0.3 + audio.treble * 0.5})`;
    ctx.lineWidth = 2 + audio.bass * 3;
    ctx.beginPath();
    const radius = Math.min(width, height) * (0.2 + audio.bass * 0.3);
    ctx.arc(width / 2, height / 2, radius + Math.sin(time * 6) * 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}
