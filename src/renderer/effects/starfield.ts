import { randRange } from "../../util/math";
import { EffectDefinition } from "./types";

type Star = {
  x: number;
  y: number;
  z: number;
};

class Starfield {
  private stars: Star[];

  constructor(private count: number, private depth: number) {
    this.stars = Array.from({ length: count }, () => this.spawnStar());
  }

  reset(): void {
    this.stars = Array.from({ length: this.count }, () => this.spawnStar());
  }

  private spawnStar(): Star {
    return {
      x: randRange(-1, 1),
      y: randRange(-1, 1),
      z: randRange(0.2, this.depth)
    };
  }

  update(delta: number, speed: number): void {
    const movement = speed * delta;
    this.stars.forEach((star) => {
      star.z -= movement;
      if (star.z <= 0.05) {
        Object.assign(star, this.spawnStar(), { z: this.depth });
      }
    });
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number, warp: number): void {
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) * (0.45 + warp * 0.2);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    this.stars.forEach((star) => {
      const perspective = scale / star.z;
      const x = centerX + star.x * perspective;
      const y = centerY + star.y * perspective;
      const size = Math.max(0.8, (1 - star.z / this.depth) * 3) + warp * 3;
      const alpha = Math.min(1, 0.4 + warp * 0.8);
      ctx.fillStyle = `rgba(120, 200, 255, ${alpha})`;
      ctx.fillRect(x, y, size, size + warp * 2);
    });
    ctx.restore();
  }
}

export class StarfieldEffect implements EffectDefinition {
  name = "starfield";
  private field = new Starfield(260, 2.8);

  reset(): void {
    this.field.reset();
  }

  render({ ctx, width, height, delta, audio, params }: Parameters<EffectDefinition["render"]>[0]): void {
    const speed = (params.speed ?? 1.2) + audio.bass * 1.4;
    const warp = (params.warp ?? 0.4) + audio.beatStrength * 0.6;
    this.field.update(delta, speed);
    ctx.save();
    ctx.fillStyle = "#020312";
    ctx.fillRect(0, 0, width, height);
    this.field.render(ctx, width, height, warp);
    ctx.restore();
  }
}
