import { randRange } from "../../util/math";

export type Star = {
  x: number;
  y: number;
  z: number;
};

export class Starfield {
  private stars: Star[];
  private turnPhase = randRange(0, Math.PI * 2);
  private turnStrength = 0.35;
  private turnRate = 0.6;

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

  update(delta: number, speed: number, turnRate = 0.6, turnStrength = 0.35): void {
    this.turnRate = turnRate;
    this.turnStrength = turnStrength;
    this.turnPhase += delta * this.turnRate;
    const movement = speed * delta;
    this.stars.forEach((star) => {
      star.z -= movement;
      if (star.z <= 0.05) {
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
    const yaw = Math.sin(this.turnPhase) * this.turnStrength;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    this.stars.forEach((star) => {
      const perspective = scale / star.z;
      const yawOffset = yaw * (1 - star.z / this.depth);
      const offsetX = star.x + yawOffset;
      const offsetY = star.y;
      const x = centerX + offsetX * perspective;
      const y = centerY + star.y * perspective;
      const size = Math.max(0.8, (1 - star.z / this.depth) * 3) + intensity * 1.5;
      const alpha = Math.min(1, 0.6 + intensity * 0.8);
      ctx.fillStyle = `rgba(180, 220, 255, ${alpha})`;
      ctx.fillRect(x, y, size, size);
      if (warp > 0.01) {
        ctx.strokeStyle = `rgba(120, 200, 255, ${alpha * warp})`;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
          centerX + offsetX * perspective * (1 + warp * 2),
          centerY + offsetY * perspective * (1 + warp * 2)
        );
        ctx.stroke();
      }
    });
    ctx.restore();
  }
}
