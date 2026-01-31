import { randRange } from "../../util/math";

export type Star = {
  x: number;
  y: number;
  z: number;
};

export class Starfield {
  private stars: Star[];
  private elapsed = 0;

  constructor(private count: number, private depth: number) {
    this.stars = Array.from({ length: count }, () => this.spawnStar());
  }

  private spawnStar(): Star {
    return {
      x: randRange(-1, 1),
      y: randRange(-1, 1),
      z: randRange(0.1, this.depth)
    };
  }

  update(delta: number, speed: number, turnStrength = 0): void {
    const movement = speed * delta;
    this.elapsed += delta;
    const turn = Math.sin(this.elapsed * 0.6) * turnStrength;
    const strafe = turn * delta;
    const bank = turn * delta * 0.35;
    this.stars.forEach((star) => {
      star.z -= movement;
      const depthRatio = 1 - star.z / this.depth;
      star.x += strafe * depthRatio;
      star.y += bank * depthRatio;
      if (star.z <= 0.05 || star.x < -1.5 || star.x > 1.5 || star.y < -1.5 || star.y > 1.5) {
        Object.assign(star, this.spawnStar(), { z: this.depth });
      }
    });
  }

  render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number,
    warp = 0
  ): void {
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) * 0.45;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    this.stars.forEach((star) => {
      const perspective = scale / star.z;
      const x = centerX + star.x * perspective;
      const y = centerY + star.y * perspective;
      const size = Math.max(0.8, (1 - star.z / this.depth) * 3) + intensity * 1.5;
      const alpha = Math.min(1, 0.6 + intensity * 0.8);
      ctx.fillStyle = `rgba(180, 220, 255, ${alpha})`;
      ctx.fillRect(x, y, size, size);
      if (warp > 0.01) {
        ctx.strokeStyle = `rgba(120, 200, 255, ${alpha * warp})`;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(centerX + star.x * perspective * (1 + warp * 2), centerY + star.y * perspective * (1 + warp * 2));
        ctx.stroke();
      }
    });
    ctx.restore();
  }
}
