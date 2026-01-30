import { randRange } from "../../util/math";

interface Star {
  x: number;
  y: number;
  z: number;
  speed: number;
}

export class Starfield {
  private stars: Star[] = [];
  private width = 320;
  private height = 180;

  constructor(count: number) {
    for (let i = 0; i < count; i += 1) {
      this.stars.push(this.spawnStar(true));
    }
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  update(delta: number, warp: number) {
    for (const star of this.stars) {
      star.z -= delta * (0.6 + warp * 2) * star.speed;
      if (star.z <= 0.2) {
        Object.assign(star, this.spawnStar(false));
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, intensity: number) {
    ctx.save();
    ctx.fillStyle = "#000";
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, this.width, this.height);
    for (const star of this.stars) {
      const k = 1 / star.z;
      const x = star.x * k + this.width / 2;
      const y = star.y * k + this.height / 2;
      if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
        continue;
      }
      const size = Math.max(1, (1.2 - star.z) * 2);
      const alpha = Math.min(1, intensity + 0.2) * (1 - star.z * 0.4);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#9ff";
      ctx.fillRect(x, y, size, size);
    }
    ctx.restore();
  }

  private spawnStar(initial: boolean): Star {
    const z = initial ? randRange(0.2, 1.2) : 1.2;
    return {
      x: randRange(-this.width / 2, this.width / 2),
      y: randRange(-this.height / 2, this.height / 2),
      z,
      speed: randRange(0.5, 1.4)
    };
  }
}
