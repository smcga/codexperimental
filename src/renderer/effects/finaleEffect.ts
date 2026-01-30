import { Effect, EffectRenderContext } from "./types";
import { Starfield } from "./starfield";
import { ParticleSystem } from "./particles";

export class FinaleEffect implements Effect {
  private starfield = new Starfield(320, 2.8);
  private particles = new ParticleSystem();

  render({ ctx, width, height, delta, audio }: EffectRenderContext): void {
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fillRect(0, 0, width, height);

    this.starfield.update(delta, 1.2 + audio.bass * 3);
    this.starfield.render(ctx, width, height, audio.rms + audio.bass, 0.6 + audio.beatStrength);

    if (audio.beat) {
      this.particles.emitBurst(40, width, height, 3 + audio.bass * 4);
    }
    this.particles.update(delta);
    this.particles.render(ctx, audio.rms + audio.bass * 0.6);

    const bars = 32;
    const barWidth = width / bars;
    ctx.fillStyle = "rgba(255, 180, 80, 0.8)";
    for (let i = 0; i < bars; i += 1) {
      const value = audio.frequency[i] / 255;
      const barHeight = value * height * 0.6;
      ctx.fillRect(i * barWidth, height - barHeight, barWidth * 0.7, barHeight);
    }
  }

  reset(): void {
    this.starfield = new Starfield(320, 2.8);
    this.particles = new ParticleSystem();
  }
}
