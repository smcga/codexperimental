import { Effect, EffectRenderContext } from "./types";
import { ParticleSystem } from "./particles";

export class ParticleFieldEffect implements Effect {
  private particles = new ParticleSystem();

  render({ ctx, width, height, delta, audio }: EffectRenderContext): void {
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(0, 0, width, height);

    if (audio.beat) {
      this.particles.emitBurst(24 + Math.floor(audio.bass * 20), width, height, 1 + audio.bass * 2);
    }
    this.particles.update(delta);
    this.particles.render(ctx, audio.bass + audio.rms);
  }

  reset(): void {
    this.particles = new ParticleSystem();
  }
}
