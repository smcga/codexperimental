import { randRange } from "../../util/math";

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
};

export class ParticleSystem {
  private particles: Particle[] = [];

  emitBurst(count: number, width: number, height: number, force: number): void {
    const centerX = width / 2;
    const centerY = height / 2;
    for (let i = 0; i < count; i += 1) {
      const angle = randRange(0, Math.PI * 2);
      const speed = randRange(0.4, 1.4) * force;
      this.particles.push({
        x: centerX + randRange(-40, 40),
        y: centerY + randRange(-40, 40),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: randRange(0.8, 1.6)
      });
    }
  }

  update(delta: number): void {
    this.particles.forEach((particle) => {
      particle.life += delta;
      particle.x += particle.vx * delta * 60;
      particle.y += particle.vy * delta * 60;
      particle.vy += 0.15 * delta * 60;
    });
    this.particles = this.particles.filter((particle) => particle.life < particle.maxLife);
  }

  render(ctx: CanvasRenderingContext2D, intensity: number): void {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    this.particles.forEach((particle) => {
      const lifeRatio = 1 - particle.life / particle.maxLife;
      const size = 2 + 4 * lifeRatio + intensity * 2;
      ctx.fillStyle = `rgba(255, 180, 80, ${lifeRatio})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }
}
