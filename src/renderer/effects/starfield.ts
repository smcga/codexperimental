import { randRange } from "../../util/math";

export type Star = {
  x: number;
  y: number;
  z: number;
};

export class Starfield {
  private stars: Star[] = [];
  private width: number;
  private height: number;

  constructor(width: number, height: number, count = 220) {
    this.width = width;
    this.height = height;
    this.stars = new Array(count).fill(0).map(() => this.spawnStar());
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  private spawnStar(): Star {
    return {
      x: randRange(-this.width / 2, this.width / 2),
      y: randRange(-this.height / 2, this.height / 2),
      z: randRange(0.2, 1)
    };
  }

  update(dt: number, speed: number) {
    const zSpeed = dt * speed;
    for (const star of this.stars) {
      star.z -= zSpeed;
      if (star.z <= 0.05) {
        Object.assign(star, this.spawnStar(), { z: 1 });
      }
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    for (const star of this.stars) {
      const perspective = 1 / star.z;
      const x = star.x * perspective;
      const y = star.y * perspective;
      const size = Math.min(2.2, perspective * 0.6);
      const alpha = Math.min(1, perspective * 0.35);
      ctx.fillStyle = `rgba(180, 240, 255, ${alpha})`;
      ctx.fillRect(x, y, size, size);
    }
    ctx.restore();
  }
}
