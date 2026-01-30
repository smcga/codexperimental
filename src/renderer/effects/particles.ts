import { randRange } from "../../util/math";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export class Particles {
  private particles: Particle[] = [];
  private width = 320;
  private height = 180;

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  burst(count: number, strength: number) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randRange(0.4, 1.6) * strength;
      this.particles.push({
        x: this.width / 2,
        y: this.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: randRange(30, 60)
      });
    }
  }

  update(delta: number) {
    for (const particle of this.particles) {
      particle.life += delta * 60;
      particle.x += particle.vx * delta * 60;
      particle.y += particle.vy * delta * 60;
      particle.vx *= 0.98;
      particle.vy *= 0.98;
    }
    this.particles = this.particles.filter((particle) => particle.life < particle.maxLife);
  }

  render(ctx: CanvasRenderingContext2D, intensity: number) {
    if (this.particles.length === 0) {
      return;
    }
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const particle of this.particles) {
      const alpha = (1 - particle.life / particle.maxLife) * (0.6 + intensity * 0.4);
      ctx.fillStyle = `rgba(150, 255, 220, ${alpha})`;
      ctx.fillRect(particle.x, particle.y, 2, 2);
    }
    ctx.restore();
  }
}
