import { Effect, EffectRenderContext } from "./types";
import { Starfield } from "./starfield";
import { ParticleSystem } from "./particles";
import { clamp } from "../../util/math";

export class FinaleEffect implements Effect {
  private starfield = new Starfield(320, 2.8);
  private particles = new ParticleSystem();

  render({ ctx, width, height, delta, audio, params }: EffectRenderContext): void {
    const trail = clamp(params.trail ?? 0.4, 0.05, 0.8);
    ctx.fillStyle = `rgba(0, 0, 0, ${trail})`;
    ctx.fillRect(0, 0, width, height);

    const starSpeed = clamp(params.starSpeed ?? 1.2, 0, 4);
    const starWarp = clamp(params.starWarp ?? 0.9, 0, 2);
    const starTurn = clamp(params.starTurn ?? 0.35, 0, 1.5);
    this.starfield.update(
      delta,
      starSpeed + audio.bass * 3,
      starWarp + audio.beatStrength * 0.6,
      starTurn + audio.rms * 0.3
    );
    this.starfield.render(ctx, width, height, audio.rms + audio.bass, 0.6 + audio.beatStrength);

    const particleCount = clamp(Math.round(params.particleCount ?? 40), 10, 120);
    const particleForce = clamp(params.particleForce ?? 3, 0.5, 6);
    if (audio.beat) {
      this.particles.emitBurst(particleCount, width, height, particleForce + audio.bass * 4);
    }
    this.particles.update(delta);
    this.particles.render(ctx, audio.rms + audio.bass * 0.6);

    const bars = clamp(Math.round(params.bars ?? 32), 8, 64);
    const barWidth = width / bars;
    const barHeight = clamp(params.barHeight ?? 0.6, 0.2, 1);
    ctx.fillStyle = "rgba(255, 180, 80, 0.8)";
    for (let i = 0; i < bars; i += 1) {
      const value = audio.frequency[i] / 255;
      const barSize = value * height * barHeight;
      ctx.fillRect(i * barWidth, height - barSize, barWidth * 0.7, barSize);
    }
  }

  reset(): void {
    this.starfield = new Starfield(320, 2.8);
    this.particles = new ParticleSystem();
  }
}
