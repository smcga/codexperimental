import { TAU } from '../../util/math';

interface Star {
  x: number;
  y: number;
  z: number;
}

export class Starfield {
  private stars: Star[] = [];
  private width = 0;
  private height = 0;

  constructor(count = 180) {
    for (let i = 0; i < count; i += 1) {
      this.stars.push({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() });
    }
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  update(dt: number, speed: number) {
    for (const star of this.stars) {
      star.z -= dt * speed;
      if (star.z <= 0) {
        star.z = 1;
        star.x = Math.random() * 2 - 1;
        star.y = Math.random() * 2 - 1;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, intensity: number) {
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.fillStyle = 'white';
    for (const star of this.stars) {
      const depth = 1 / star.z;
      const x = star.x * depth * this.width * 0.5;
      const y = star.y * depth * this.height * 0.5;
      const radius = Math.max(0.5, depth * 1.2);
      const alpha = Math.min(1, depth * 0.15 + intensity * 0.4);
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}
