import type { EffectRenderContext } from "./types";
import { Starfield } from "./starfield";
import { ParticleSystem } from "./particles";

export class FinaleEffect {
  private stars = new Starfield(320, 3.2);
  private particles = new ParticleSystem();

  render({ ctx, width, height, delta, features, time, params }: EffectRenderContext): void {
    ctx.fillStyle = "rgba(2, 2, 8, 0.4)";
    ctx.fillRect(0, 0, width, height);

    const speed = 1.2 + features.bass * 2.2;
    this.stars.update(delta, speed);
    this.stars.render(ctx, width, height, features.bass + features.treble * 0.6);

    if (features.beat) {
      this.particles.emitBurst(48, width, height, 3 + features.bass * 4);
    }
    this.particles.update(delta);
    this.particles.render(ctx, 0.4 + features.bass + params.intensity);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const barCount = 24;
    const barWidth = width / barCount;
    for (let i = 0; i < barCount; i += 1) {
      const value = features.frequency[Math.floor((i / barCount) * features.frequency.length)] / 255;
      const barHeight = value * height * 0.4 * (1 + features.bass);
      ctx.fillStyle = `rgba(120, 255, 220, ${0.2 + value})`;
      ctx.fillRect(i * barWidth, height - barHeight, barWidth * 0.6, barHeight);
    }
    ctx.restore();

    ctx.fillStyle = `rgba(255, 120, 200, ${0.1 + Math.sin(time * 6) * 0.05})`;
    ctx.fillRect(0, height * 0.45, width, height * 0.02);
  }

  reset(): void {
    this.stars = new Starfield(320, 3.2);
    this.particles = new ParticleSystem();
  }
}
