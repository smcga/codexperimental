import { TAU } from '../../util/math';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

export class Particles {
  private particles: Particle[] = [];

  emitBurst(x: number, y: number, count: number, power: number) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * TAU;
      const speed = power * (0.4 + Math.random() * 0.8);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.8 + Math.random() * 0.8,
        color: `hsla(${180 + Math.random() * 120}, 90%, 70%, 0.9)`
      });
    }
  }

  update(dt: number) {
    this.particles = this.particles.filter((particle) => {
      particle.life += dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      return particle.life < particle.maxLife;
    });
  }

  render(ctx: CanvasRenderingContext2D) {
    for (const particle of this.particles) {
      const alpha = 1 - particle.life / particle.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 1.6 + alpha * 2, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
