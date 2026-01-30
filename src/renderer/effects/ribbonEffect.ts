import { clamp, randRange } from "../../util/math";
import type { EffectRenderContext } from "./types";

type RibbonParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
};

export class RibbonEffect {
  private particles: RibbonParticle[] = [];

  render({ ctx, width, height, delta, time, features, params }: EffectRenderContext): void {
    ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
    ctx.fillRect(0, 0, width, height);

    const emitRate = 12 + Math.floor(features.bass * 30);
    const spread = params.spread ?? 0.8;
    for (let i = 0; i < emitRate; i += 1) {
      const angle = time * 0.6 + randRange(-0.6, 0.6) * spread;
      const speed = randRange(20, 60) * (0.6 + features.mid);
      this.particles.push({
        x: width / 2 + Math.sin(angle) * 40,
        y: height / 2 + Math.cos(angle * 1.2) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: randRange(1.2, 2.4)
      });
    }

    this.particles.forEach((particle) => {
      particle.life += delta;
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.vx *= 0.98;
      particle.vy *= 0.98;
    });
    this.particles = this.particles.filter((particle) => particle.life < particle.maxLife);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = params.thickness ?? 2;
    this.particles.forEach((particle) => {
      const alpha = 1 - particle.life / particle.maxLife;
      const hue = 180 + Math.sin(time + particle.life * 2) * 60;
      ctx.strokeStyle = `hsla(${hue}, 90%, 60%, ${clamp(alpha, 0, 1)})`;
      ctx.beginPath();
      ctx.moveTo(particle.x, particle.y);
      ctx.lineTo(particle.x - particle.vx * 0.05, particle.y - particle.vy * 0.05);
      ctx.stroke();
    });
    ctx.restore();
  }
}
